import Link from "next/link";
import { Suspense } from "react";
import { getFeaturedProducts } from "@/services/products";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { publicUrlFor } from "@/lib/r2/upload";
import { TiltCard } from "@/components/tilt-card";
import Image from "next/image";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/10 bg-ink text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          background: "radial-gradient(circle at 20% 20%, #D9A828 0%, transparent 45%), radial-gradient(circle at 80% 70%, #F4C430 0%, transparent 40%)"
        }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in-up">
            <p className="text-xs tracking-[0.3em] uppercase text-accent-bright mb-4">Signature scents</p>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] max-w-[16ch] gold-shimmer">
              Fragrance, worn like a memory.
            </h1>
            <p className="mt-5 max-w-prose text-white/70">
              A curated house of perfumes — hand-picked notes, honest longevity ratings,
              delivered across Pakistan.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-block rounded-full bg-accent px-8 py-3.5 text-ink text-sm font-semibold tracking-wide uppercase hover:bg-accent-bright hover:shadow-gold transition-all duration-300"
            >
              Shop now
            </Link>
          </div>

          <FeaturedHeroBottle />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl">New arrivals</h2>
          <Link href="/shop" className="text-sm text-accent-dim hover:underline">
            View all
          </Link>
        </div>
        <Suspense fallback={<FeaturedGridSkeleton />}>
          <FeaturedGrid />
        </Suspense>
      </section>
    </div>
  );
}

async function FeaturedHeroBottle() {
  const products = await getFeaturedProducts(1);
  const product = products[0];

  return (
    <div className="hidden md:block">
      <TiltCard maxTilt={10}>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-accent/20">
          {product?.images[0] ? (
            <Image
              src={publicUrlFor(product.images[0].objectKey)}
              alt={product.name}
              fill
              sizes="40vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/30 text-sm">
              Your featured scent goes here
            </div>
          )}
        </div>
      </TiltCard>
    </div>
  );
}

async function FeaturedGrid() {
  const products = await getFeaturedProducts(8);

  if (products.length === 0) {
    return (
      <p className="text-sm text-ink/60">
        No products yet — check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          slug={product.slug}
          name={product.name}
          price={product.price}
          salePrice={product.salePrice}
          imageUrl={product.images[0] ? publicUrlFor(product.images[0].objectKey) : undefined}
          imageAlt={product.images[0]?.altText ?? undefined}
        />
      ))}
    </div>
  );
}

function FeaturedGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
