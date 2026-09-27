import Link from "next/link";
import Image from "next/image";
import { getCart } from "@/actions/cart";
import { publicUrlFor } from "@/lib/r2/upload";
import { formatPrice } from "@/lib/format";
import { CartLineItem } from "@/components/cart-line-item";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const { items, subtotal } = await getCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 text-center">
        <h1 className="font-display text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-ink/60 dark:text-white/60">Nothing here yet — go find something you like.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl mb-8">Your cart</h1>

      <ul className="divide-y divide-sand dark:divide-white/10">
        {items.map((item) => {
          const unitPrice = item.variant?.priceOverride ?? item.product.salePrice ?? item.product.price;
          const image = item.product.images[0];
          return (
            <CartLineItem
              key={item.id}
              id={item.id}
              name={item.product.name}
              variantName={item.variant?.name}
              slug={item.product.slug}
              unitPrice={unitPrice}
              quantity={item.quantity}
              imageUrl={image ? publicUrlFor(image.objectKey) : undefined}
            />
          );
        })}
      </ul>

      <div className="mt-8 flex justify-end">
        <div className="w-full sm:w-72 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink/60 dark:text-white/60">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <p className="text-xs text-ink/50 dark:text-white/50">
            Shipping and any coupon are calculated at checkout.
          </p>
          <Link
            href="/checkout"
            className="block text-center rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
