"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email"));

    startTransition(async () => {
      const result = await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });
      // Always show the same success message whether or not the email
      // exists — never reveal account existence via this form's response.
      if (result.error) setError(result.error.message ?? "Something went wrong.");
      else setSent(true);
    });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl mb-4">Reset your password</h1>
      {sent ? (
        <p className="text-sm text-ink/70 dark:text-white/70">
          If an account exists for that email, we&apos;ve sent a reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-sm text-ink/60 dark:text-white/60">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm"
          />
          {error && <p role="alert" className="text-sm text-rust">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
