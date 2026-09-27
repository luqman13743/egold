"use client";

import { useState, useTransition } from "react";

export default function ContactPage() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(fd.entries())),
        });
        if (!res.ok) throw new Error("Couldn't send your message — please try again.");
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl mb-8">Contact us</h1>
      {sent ? (
        <p className="text-sm text-moss">Thanks — we&apos;ll get back to you soon.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input name="name" required placeholder="Name" className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <textarea name="message" required rows={5} placeholder="How can we help?" className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          {error && <p role="alert" className="text-sm text-rust">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
