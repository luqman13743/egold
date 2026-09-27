import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getProductBySlug, getProductReviews } from "@/services/products";
import { publicUrlFor } from "@/lib/r2/upload";
import { formatPrice } from "@/lib/format";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { TiltCard } from "@/components/tilt-card";
import { ScentProfile } from "@/components/scent-profile";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.images[0] ? [publicUrlFor(product.images[0].objectKey)] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const reviews = await getProductReviews(product.id);
  const onSale = product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
  const totalStock = product.inventory.reduce((sum, i) => sum + Math.max(0, i.stock - i.reserved), 0);
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? undefined,
    sku: product.sku,
    image: product.images.map((img) => publicUrlFor(img.objectKey)),
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: onSale ? product.salePrice : product.price,
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(avgRating !== undefined
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-ink/50 dark:text-white/50 mb-6">
        <ol className="flex flex-wrap gap-1">
          <li><a href="/shop" className="hover:text-accent">Shop</a></li>
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li><a href={`/category/${product.category.slug}`} className="hover:text-accent">{product.category.name}</a></li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink/80 dark:text-white/80">{product.name}</li>
        </ol>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <TiltCard>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-sand">
              {product.images[0] ? (
                <Image
                  src={publicUrlFor(product.images[0].objectKey)}
                  alt={product.images[0].altText ?? product.name}
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink/30 text-sm">No image</div>
              )}
            </div>
          </TiltCard>
          <p className="text-center text-xs text-ink/40 tracking-wide uppercase">Move your cursor over the bottle</p>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.slice(1, 6).map((img) => (
                <div key={img.id} className="relative aspect-square rounded bg-sand dark:bg-white/5 overflow-hidden">
                  <Image src={publicUrlFor(img.objectKey)} alt={img.altText ?? product.name} fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand && (
            <p className="text-sm tracking-[0.2em] uppercase text-accent-dim mb-1 font-medium">{product.brand.name}</p>
          )}
          <h1 className="font-display text-4xl leading-tight">{product.name}</h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className={onSale ? "text-2xl font-medium text-rust" : "text-2xl font-medium"}>
              {formatPrice(onSale ? product.salePrice! : product.price)}
            </span>
            {onSale && (
              <span className="text-base text-ink/40 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {avgRating !== undefined && (
            <p className="mt-2 text-sm text-ink/60">
              {avgRating.toFixed(1)} ★ · {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </p>
          )}

          {product.shortDescription && (
            <p className="mt-4 text-ink/80 max-w-prose">{product.shortDescription}</p>
          )}

          <p className="mt-4 text-sm">
            {totalStock > 0 ? (
              <span className="text-moss">In stock</span>
            ) : (
              <span className="text-rust">Out of stock</span>
            )}
          </p>

          {/* Buttons sit right up top, immediately actionable — no scrolling
              needed to buy, as requested */}
          <AddToCartForm
            productId={product.id}
            variants={product.variants}
            inStock={totalStock > 0}
          />

          {(product.fragranceIntensity !== null || product.sweetness !== null || product.longevity !== null) && (
            <div className="mt-12 pt-8 border-t border-sand">
              <h2 className="font-display text-xl mb-1">Scent profile</h2>
              <p className="text-sm text-ink/50 mb-6">Scroll to reveal — scroll back up to watch it fade.</p>
              <ScentProfile
                traits={[
                  ...(product.fragranceIntensity !== null ? [{ label: "Fragrance intensity", value: product.fragranceIntensity! }] : []),
                  ...(product.sweetness !== null ? [{ label: "Sweetness", value: product.sweetness! }] : []),
                  ...(product.longevity !== null ? [{ label: "Longevity", value: product.longevity! }] : []),
                ]}
              />
            </div>
          )}

          {product.scentNotes && (
            <div className="mt-10 pt-6 border-t border-sand">
              <h2 className="font-display text-xl mb-2">Notes</h2>
              <p className="text-ink/80 max-w-prose">{product.scentNotes}</p>
            </div>
          )}

          {product.description && (
            <div className="mt-10 pt-6 border-t border-sand">
              <h2 className="font-display text-xl mb-2">Details</h2>
              <p className="text-ink/80 max-w-prose whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {product.ingredients && (
            <div className="mt-10 pt-6 border-t border-sand">
              <h2 className="font-display text-xl mb-2">Ingredients</h2>
              <p className="text-sm text-ink/60 max-w-prose whitespace-pre-line">{product.ingredients}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 pt-8 border-t border-sand">
        <h2 className="font-display text-2xl mb-6">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink/60">No reviews yet.</p>
        ) : (
          <ul className="space-y-6 max-w-prose">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-sand pb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{review.rating} ★</span>
                  {review.verifiedPurchase && (
                    <span className="text-xs text-moss">Verified purchase</span>
                  )}
                </div>
                {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                {review.body && <p className="mt-1 text-ink/80">{review.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
