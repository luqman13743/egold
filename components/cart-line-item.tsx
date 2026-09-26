"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { updateCartItemQuantity, removeCartItem } from "@/actions/cart";
import { formatPrice } from "@/lib/format";

interface Props {
  id: string;
  name: string;
  variantName?: string;
  slug: string;
  unitPrice: string;
  quantity: number;
  imageUrl?: string;
}

export function CartLineItem({ id, name, variantName, slug, unitPrice, quantity, imageUrl }: Props) {
  const [pending, startTransition] = useTransition();

  function setQty(next: number) {
    startTransition(() => updateCartItemQuantity(id, next));
  }

  return (
    <li className="py-5 flex gap-4">
      <div className="relative h-20 w-20 shrink-0 rounded bg-sand dark:bg-white/5 overflow-hidden">
        {imageUrl && <Image src={imageUrl} alt={name} fill sizes="80px" className="object-cover" />}
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/product/${slug}`} className="font-medium hover:text-accent">
          {name}
        </Link>
        {variantName && <p className="text-sm text-ink/60 dark:text-white/60">{variantName}</p>}
        <p className="text-sm mt-1">{formatPrice(unitPrice)}</p>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center border border-sand dark:border-white/10 rounded">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={pending}
              onClick={() => setQty(quantity - 1)}
              className="p-1.5 hover:bg-sand dark:hover:bg-white/10"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 text-sm tabular-nums">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={pending}
              onClick={() => setQty(quantity + 1)}
              className="p-1.5 hover:bg-sand dark:hover:bg-white/10"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => removeCartItem(id))}
            className="p-1.5 text-ink/50 hover:text-rust"
            aria-label="Remove item"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="text-sm font-medium tabular-nums">{formatPrice(parseFloat(unitPrice) * quantity)}</div>
    </li>
  );
}
