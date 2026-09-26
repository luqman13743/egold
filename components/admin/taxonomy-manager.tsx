"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory, createBrand, deleteBrand } from "@/actions/taxonomy";

interface Item {
  id: string;
  name: string;
  slug: string;
}

export function TaxonomyManager({ kind, items }: { kind: "category" | "brand"; items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const create = kind === "category" ? createCategory : createBrand;
  const remove = kind === "category" ? deleteCategory : deleteBrand;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const form = e.currentTarget;

    startTransition(async () => {
      try {
        await create(payload);
        form.reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save.");
      }
    });
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6" noValidate>
        <input name="name" required placeholder="Name" className="flex-1 rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
        <input name="slug" required placeholder="slug" className="flex-1 rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
        <button type="submit" disabled={pending} className="rounded-md bg-accent px-4 py-2 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-rust mb-4">{error}</p>}

      <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center py-2.5 text-sm">
            <span>{item.name} <span className="text-ink/40 dark:text-white/40">/{item.slug}</span></span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm(`Delete "${item.name}"?`)) startTransition(async () => { await remove(item.id); router.refresh(); });
              }}
              className="text-xs text-ink/50 hover:text-rust"
            >
              Remove
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="py-4 text-ink/50 text-sm">Nothing yet.</li>}
      </ul>
    </div>
  );
}
