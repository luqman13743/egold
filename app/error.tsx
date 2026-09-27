"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <h1 className="font-display text-2xl mb-2">Something went wrong</h1>
      <p className="text-ink/60 dark:text-white/60 mb-6">
        We hit an unexpected error loading this page.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="rounded-md bg-accent px-5 py-2.5 text-white text-sm font-medium hover:bg-accent-dim">
          Try again
        </button>
        <Link href="/" className="rounded-md border border-sand dark:border-white/10 px-5 py-2.5 text-sm hover:bg-sand dark:hover:bg-white/10">
          Go home
        </Link>
      </div>
    </div>
  );
}
