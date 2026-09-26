"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart";

interface Variant {
  id: string;
  name: string;
  options: Record<string, string>;
}

interface Props {
  productId: string;
  variants: Variant[];
  inStock: boolean;
}

export function AddToCartForm({ productId, variants, inStock }: Props) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [buyNowPending, startBuyNowTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        await addToCart({ productId, variantId, quantity });
        setMessage("Added to cart.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Couldn't add to cart.");
      }
    });
  }

  function handleBuyNow() {
    setMessage(null);
    startBuyNowTransition(async () => {
      try {
        await addToCart({ productId, variantId, quantity });
        router.push("/checkout");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Couldn't proceed to checkout.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {variants.length > 0 && (
        <div>
          <label htmlFor="variant" className="block text-sm font-medium mb-1.5">
            Option
          </label>
          <select
            id="variant"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full max-w-xs rounded border border-sand bg-transparent px-3 py-2 text-sm"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium mb-1.5">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={50}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 rounded border border-sand bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={!inStock || pending}
          className="flex-1 rounded-full bg-accent px-6 py-3.5 text-ink text-sm font-semibold tracking-wide uppercase hover:bg-accent-bright hover:shadow-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Adding…" : inStock ? "Add to cart" : "Out of stock"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock || buyNowPending}
          className="flex-1 rounded-full bg-ink px-6 py-3.5 text-accent-bright text-sm font-semibold tracking-wide uppercase border border-ink hover:bg-black hover:shadow-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buyNowPending ? "Redirecting…" : "Buy now"}
        </button>
      </div>

      {message && (
        <p role="status" className="text-sm text-ink/70">
          {message}
        </p>
      )}
    </form>
  );
}
