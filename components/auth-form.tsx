"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth/client";

const inputClass = "w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm";
const labelClass = "block text-sm font-medium mb-1.5";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/account";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const name = String(fd.get("name") ?? "");

    startTransition(async () => {
      const result =
        mode === "login"
          ? await signIn.email({ email, password })
          : await signUp.email({ email, password, name });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong.");
        return;
      }

      if (mode === "register") {
        setNotice("Account created — check your email to verify before signing in.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl mb-8">{mode === "login" ? "Sign in" : "Create an account"}</h1>

      {notice ? (
        <p className="text-sm text-moss">{notice}</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="name" className={labelClass}>Name</label>
                <input id="name" name="name" required className={inputClass} autoComplete="name" />
              </div>
            )}
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" name="email" type="email" required className={inputClass} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={10}
                className={inputClass}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {mode === "login" && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && <p role="alert" className="text-sm text-rust">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
            >
              {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => signIn.social({ provider: "google", callbackURL: redirectTo })}
            className="mt-4 w-full rounded-md border border-sand dark:border-white/10 px-6 py-3 text-sm font-medium hover:bg-sand dark:hover:bg-white/10"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-sm text-center text-ink/60 dark:text-white/60">
            {mode === "login" ? (
              <>Don&apos;t have an account? <Link href="/register" className="text-accent hover:underline">Sign up</Link></>
            ) : (
              <>Already have an account? <Link href="/login" className="text-accent hover:underline">Sign in</Link></>
            )}
          </p>
        </>
      )}
    </div>
  );
}
