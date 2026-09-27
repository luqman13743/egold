"use client";

import { Suspense } from "react";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    const password = String(new FormData(e.currentTarget).get("password"));

    startTransition(async () => {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message ?? "Something went wrong.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    });
  }

  if (!token) {
    return <p className="text-sm text-rust">This reset link is invalid or has expired.</p>;
  }

  if (done) {
    return <p className="text-sm text-moss">Password updated — redirecting to sign in…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input
        name="password"
        type="password"
        required
        minLength={10}
        placeholder="New password"
        autoComplete="new-password"
        className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm"
      />
      {error && <p role="alert" className="text-sm text-rust">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl mb-8">Set a new password</h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
