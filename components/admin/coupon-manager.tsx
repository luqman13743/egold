"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCoupon, toggleCouponActive } from "@/actions/coupons";

const inputClass = "rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: string;
  active: boolean;
  expiresAt: string | null;
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const form = e.currentTarget;

    startTransition(async () => {
      try {
        await createCoupon(payload);
        form.reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't create coupon.");
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-3 mb-8" noValidate>
        <input name="code" required placeholder="CODE10" className={inputClass} />
        <select name="type" defaultValue="percentage" className={inputClass}>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed (PKR)</option>
        </select>
        <input name="value" type="number" step="0.01" min="0" required placeholder="Value" className={inputClass} />
        <input name="minOrderAmount" type="number" step="0.01" min="0" placeholder="Min order (optional)" className={inputClass} />
        <input name="usageLimit" type="number" min="1" placeholder="Usage limit (optional)" className={inputClass} />
        <input name="expiresAt" type="date" className={inputClass} />
        <button type="submit" disabled={pending} className="rounded-md bg-accent px-4 py-2 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50 sm:col-span-3">
          {pending ? "Creating…" : "Create coupon"}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-rust mb-4">{error}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
            <th className="py-2 pr-4 font-normal">Code</th>
            <th className="py-2 pr-4 font-normal">Value</th>
            <th className="py-2 pr-4 font-normal">Expires</th>
            <th className="py-2 font-normal">Active</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id} className="border-b border-sand dark:border-white/10">
              <td className="py-2 pr-4 font-medium">{c.code}</td>
              <td className="py-2 pr-4">{c.type === "percentage" ? `${c.value}%` : `PKR ${c.value}`}</td>
              <td className="py-2 pr-4">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
              <td className="py-2">
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => { await toggleCouponActive(c.id, !c.active); router.refresh(); })}
                  className={`text-xs px-2 py-1 rounded ${c.active ? "bg-moss/15 text-moss" : "bg-sand dark:bg-white/10 text-ink/60 dark:text-white/60"}`}
                >
                  {c.active ? "Active" : "Inactive"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
