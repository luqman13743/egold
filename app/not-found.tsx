import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <h1 className="font-display text-3xl mb-2">Page not found</h1>
      <p className="text-ink/60 dark:text-white/60 mb-6">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link href="/shop" className="inline-block rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim">
        Browse the shop
      </Link>
    </div>
  );
}
