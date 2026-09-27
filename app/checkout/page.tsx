import { redirect } from "next/navigation";
import { getCart } from "@/actions/cart";
import { formatPrice } from "@/lib/format";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { items, subtotal } = await getCart();
  if (items.length === 0) redirect("/cart");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <h1 className="font-display text-3xl mb-8">Checkout</h1>
        <CheckoutForm />
      </div>

      <div className="order-first md:order-last">
        <div className="rounded-md border border-sand dark:border-white/10 p-5 sticky top-20">
          <h2 className="font-display text-lg mb-4">Order summary</h2>
          <ul className="space-y-3 text-sm">
            {items.map((item) => {
              const unitPrice = item.variant?.priceOverride ?? item.product.salePrice ?? item.product.price;
              return (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="text-ink/80 dark:text-white/80">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="tabular-nums shrink-0">{formatPrice(parseFloat(unitPrice) * item.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 pt-4 border-t border-sand dark:border-white/10 flex justify-between text-sm font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ink/50 dark:text-white/50">
            Shipping and any discount are applied at the next step.
          </p>
        </div>
      </div>
    </div>
  );
}
