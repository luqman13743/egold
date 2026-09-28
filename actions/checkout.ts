"use server";

import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db, carts, cartItems, addresses, orders, orderItems, payments, inventory, couponUsage } from "@/db";
import { getCurrentSession } from "@/lib/auth/rbac";
import { checkoutSchema, type CheckoutInput } from "@/schemas/checkout";
import { validateAndPriceCoupon, CouponError } from "@/services/coupons";
import { calculateShipping } from "@/lib/shipping";
import { getPaymentProvider } from "@/lib/payments";
import { recordAudit } from "@/lib/audit";

const CART_COOKIE = "cart_token";

class CheckoutError extends Error {}

export async function placeOrder(input: unknown) {
  const data = checkoutSchema.parse(input) as CheckoutInput;
  const session = await getCurrentSession();
  const cookieStore = await cookies();

  const cart = session?.user
    ? await db.query.carts.findFirst({ where: eq(carts.userId, session.user.id) })
    : await (async () => {
        const token = cookieStore.get(CART_COOKIE)?.value;
        return token ? db.query.carts.findFirst({ where: eq(carts.sessionToken, token) }) : undefined;
      })();

  if (!cart) throw new CheckoutError("Your cart is empty");

  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cart.id),
    with: { product: true, variant: true },
  });

  if (items.length === 0) throw new CheckoutError("Your cart is empty");

  // ---- Re-validate every line against the database, right now ----
  // Price, stock and product status are all re-read here — none of it
  // comes from the cart page the customer was just looking at.
  let subtotal = 0;
  const priced: Array<{
    productId: string;
    variantId: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
  }> = [];

  for (const item of items) {
    if (item.product.status !== "published" || item.product.deletedAt) {
      throw new CheckoutError(`${item.product.name} is no longer available`);
    }

    const stockRecord = await db.query.inventory.findFirst({
      where: and(
        eq(inventory.productId, item.productId),
        item.variantId ? eq(inventory.variantId, item.variantId) : isNull(inventory.variantId)
      ),
    });
    const available = stockRecord ? stockRecord.stock - stockRecord.reserved : 0;
    if (available < item.quantity) {
      throw new CheckoutError(`Only ${Math.max(available, 0)} of ${item.product.name} left in stock`);
    }

    const unitPrice = parseFloat(
      item.variant?.priceOverride ?? item.product.salePrice ?? item.product.price
    );
    subtotal += unitPrice * item.quantity;

    priced.push({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice,
    });
  }

  let discount = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;

  if (data.couponCode) {
    try {
      const result = await validateAndPriceCoupon({
        code: data.couponCode,
        userId: session?.user?.id,
        subtotal,
      });
      discount = result.discount;
      couponId = result.couponId;
      couponCode = result.code;
    } catch (err) {
      if (err instanceof CouponError) throw new CheckoutError(err.message);
      throw err;
    }
  }

  const shipping = calculateShipping(subtotal - discount);
  const total = Math.max(0, subtotal - discount + shipping);

  // ---- Everything below happens atomically: reserve stock, create the
  // order + snapshot line items, record coupon usage. If anything fails,
  // none of it commits — an order is never left half-created. ----
  const order = await db.transaction(async (tx) => {
    let addressId: string | null = null;
    if (session?.user) {
      const [address] = await tx
        .insert(addresses)
        .values({
          userId: session.user.id,
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
        })
        .returning();
      addressId = address.id;
    }

    const [newOrder] = await tx
      .insert(orders)
      .values({
        userId: session?.user?.id,
        addressId,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: data.paymentMethod,
        subtotal: subtotal.toFixed(2),
        discountTotal: discount.toFixed(2),
        shippingTotal: shipping.toFixed(2),
        total: total.toFixed(2),
        currency: "PKR",
        couponCode,
      })
      .returning();

    for (const line of priced) {
      await tx.insert(orderItems).values({
        orderId: newOrder.id,
        productId: line.productId,
        variantId: line.variantId,
        productName: line.productName,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toFixed(2), // price AT purchase, immune to later price changes
      });

      // Reserve stock now so two simultaneous checkouts can't oversell the
      // same last unit while payment is pending.
      const stockRecord = await tx.query.inventory.findFirst({
        where: and(
          eq(inventory.productId, line.productId),
          line.variantId ? eq(inventory.variantId, line.variantId) : isNull(inventory.variantId)
        ),
      });
      if (stockRecord) {
        await tx
          .update(inventory)
          .set({ reserved: stockRecord.reserved + line.quantity, updatedAt: new Date() })
          .where(eq(inventory.id, stockRecord.id));
      }
    }

    if (couponId && (session?.user || true)) {
      if (session?.user) {
        await tx.insert(couponUsage).values({ couponId, userId: session.user.id, orderId: newOrder.id });
      }
    }

    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    return newOrder;
  });

  await recordAudit({
    actorId: session?.user?.id ?? null,
    action: "order.create",
    targetType: "order",
    targetId: order.id,
    metadata: { total: order.total, paymentMethod: data.paymentMethod },
  });

  // ---- Cash on Delivery: no payment gateway involved, order confirmed
  // immediately; COD never touches the "paid" status. ----
  if (data.paymentMethod === "cod") {
    await db.update(orders).set({ status: "confirmed" }).where(eq(orders.id, order.id));
    return { orderId: order.id, redirectUrl: `/checkout/confirmation?order=${order.id}` };
  }

  // ---- Safepay: create the hosted-checkout session and hand back its
  // redirect URL. Order/payment status stays "pending" until the signed
  // webhook arrives — never flipped here based on this call succeeding. ----
  const provider = getPaymentProvider();
  const result = await provider.createPayment({
    orderId: order.id,
    amount: Math.round(total), // PKR has no minor unit split in Safepay's model
    currency: "PKR",
    customerEmail: session?.user?.email ?? "guest@example.com",
    metadata: { orderId: order.id },
  });

  await db.insert(payments).values({
    orderId: order.id,
    provider: provider.name,
    providerPaymentId: result.providerPaymentId,
    status: result.status,
    amount: total.toFixed(2),
    currency: "PKR",
  });

  if (!result.redirectUrl) {
    throw new CheckoutError("Could not start payment — please try again");
  }

  return { orderId: order.id, redirectUrl: result.redirectUrl };
}
