"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server-side logging only — the customer never sees error.message or
    // error.stack, just a friendly message and a retry button.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-paper text-ink px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-3xl mb-2">Something went wrong</h1>
          <p className="text-ink/60 mb-6">
            We hit an unexpected error. It&apos;s been logged and we&apos;ll take a look.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-[#2C5F5B] px-6 py-3 text-white text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
