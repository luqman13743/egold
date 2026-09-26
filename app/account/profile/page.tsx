"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth/client";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !session) router.push("/login?redirect=/account/profile");
  }, [sessionLoading, session, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get("currentPassword"));
    const newPassword = String(fd.get("newPassword"));

    startTransition(async () => {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (result.error) setError(result.error.message ?? "Couldn't update password.");
      else setSuccess(true);
    });
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-3xl mb-1">Profile & security</h1>
      <p className="text-sm text-ink/60 dark:text-white/60 mb-8">{session.user.email}</p>

      <h2 className="font-medium mb-4">Change password</h2>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input
          name="currentPassword"
          type="password"
          required
          placeholder="Current password"
          autoComplete="current-password"
          className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="newPassword"
          type="password"
          required
          minLength={10}
          placeholder="New password"
          autoComplete="new-password"
          className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        {error && <p role="alert" className="text-sm text-rust">{error}</p>}
        {success && <p className="text-sm text-moss">Password updated.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
