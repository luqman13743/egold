import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  slug: string;
  name: string;
  price: string;
  salePrice?: string | null;
  imageUrl?: string;
  imageAlt?: string;
}

export function ProductCard({ slug, name, price, salePrice, imageUrl, imageAlt }: ProductCardProps) {
  const onSale = salePrice && parseFloat(salePrice) < parseFloat(price);

  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-sand transition-shadow duration-300 group-hover:shadow-gold">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/30 text-sm">No image</div>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 rounded bg-rust px-2 py-0.5 text-xs font-medium text-white">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm leading-snug line-clamp-2">{name}</p>
        <div className="flex items-center gap-2">
          <span className={onSale ? "text-sm font-medium text-rust" : "text-sm font-medium"}>
            {formatPrice(onSale ? salePrice! : price)}
          </span>
          {onSale && (
            <span className="text-xs text-ink/40 dark:text-white/40 line-through">{formatPrice(price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-md bg-sand dark:bg-white/5" />
      <div className="mt-3 h-3.5 w-4/5 rounded bg-sand dark:bg-white/5" />
      <div className="mt-2 h-3.5 w-1/3 rounded bg-sand dark:bg-white/5" />
    </div>
  );
}
