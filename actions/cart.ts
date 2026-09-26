"use server";

import { cookies } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, carts, cartItems, products, productVariants, inventory } from "@/db";
import { getCurrentSession } from "@/lib/auth/rbac";
import { z } from "zod";

const CART_COOKIE = "cart_token";

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().max(50).default(1),
});

async function getOrCreateCart() {
  const session = await getCurrentSession();
  const cookieStore = await cookies();

  if (session?.user) {
    let cart = await db.query.carts.findFirst({ where: eq(carts.userId, session.user.id) });
    if (!cart) {
      [cart] = await db.insert(carts).values({ userId: session.user.id }).returning();
    }
    return cart;
  }

  // Guest cart, tracked by an opaque cookie token — never a client-supplied id.
  let token = cookieStore.get(CART_COOKIE)?.value;
  let cart = token ? await db.query.carts.findFirst({ where: eq(carts.sessionToken, token) }) : undefined;

  if (!cart) {
    token = crypto.randomUUID();
    [cart] = await db.insert(carts).values({ sessionToken: token }).returning();
    cookieStore.set(CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return cart;
}

export async function addToCart(input: unknown) {
  const data = addToCartSchema.parse(input);

  // Revalidate product existence, status and stock server-side before
  // touching the cart — the client's claim about availability is never
  // trusted, even for the "in stock" label it just saw.
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, data.productId), eq(products.status, "published"), isNull(products.deletedAt)),
  });
  if (!product) throw new Error("Product is not available");

  if (data.variantId) {
    const variant = await db.query.productVariants.findFirst({
      where: and(eq(productVariants.id, data.variantId), eq(productVariants.productId, data.productId)),
    });
    if (!variant) throw new Error("Selected option is not available");
  }

  const stockRecord = await db.query.inventory.findFirst({
    where: and(
      eq(inventory.productId, data.productId),
      data.variantId ? eq(inventory.variantId, data.variantId) : isNull(inventory.variantId)
    ),
  });
  const available = stockRecord ? stockRecord.stock - stockRecord.reserved : 0;
  if (available < data.quantity) {
    throw new Error(`Only ${Math.max(available, 0)} in stock`);
  }

  const cart = await getOrCreateCart();

  const existing = await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cart.id),
      eq(cartItems.productId, data.productId),
      data.variantId ? eq(cartItems.variantId, data.variantId) : isNull(cartItems.variantId)
    ),
  });

  const newQuantity = (existing?.quantity ?? 0) + data.quantity;
  if (newQuantity > available) {
    throw new Error(`Only ${available} in stock`);
  }

  if (existing) {
    await db.update(cartItems).set({ quantity: newQuantity }).where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId: data.productId,
      variantId: data.variantId,
      quantity: data.quantity,
    });
  }

  revalidatePath("/cart");
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    revalidatePath("/cart");
    return;
  }

  const item = await db.query.cartItems.findFirst({ where: eq(cartItems.id, cartItemId) });
  if (!item) return;

  const stockRecord = await db.query.inventory.findFirst({
    where: and(
      eq(inventory.productId, item.productId),
      item.variantId ? eq(inventory.variantId, item.variantId) : isNull(inventory.variantId)
    ),
  });
  const available = stockRecord ? stockRecord.stock - stockRecord.reserved : 0;
  if (quantity > available) throw new Error(`Only ${available} in stock`);

  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
  revalidatePath("/cart");
}

export async function removeCartItem(cartItemId: string) {
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  revalidatePath("/cart");
}

export async function getCart() {
  const session = await getCurrentSession();
  const cookieStore = await cookies();

  const cart = session?.user
    ? await db.query.carts.findFirst({ where: eq(carts.userId, session.user.id) })
    : await (async () => {
        const token = cookieStore.get(CART_COOKIE)?.value;
        return token ? db.query.carts.findFirst({ where: eq(carts.sessionToken, token) }) : undefined;
      })();

  if (!cart) return { items: [], subtotal: 0 };

  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cart.id),
    with: { product: { with: { images: { limit: 1 } } }, variant: true },
  });

  // Prices are always read fresh from the product record here, never from
  // whatever was cached client-side — this is what checkout will total too.
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.variant?.priceOverride ?? item.product.salePrice ?? item.product.price;
    return sum + parseFloat(unitPrice) * item.quantity;
  }, 0);

  return { items, subtotal };
}
