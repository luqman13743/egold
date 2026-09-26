"use client";

import { useState, useTransition } from "react";
import { addAddress } from "@/actions/addresses";

const inputClass = "w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm";
const labelClass = "block text-sm font-medium mb-1.5";

export function AddressForm() {
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
        await addAddress({ ...payload, isDefault: fd.get("isDefault") === "on" });
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save address.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="fullName" className={labelClass}>Full name</label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>Phone</label>
        <input id="phone" name="phone" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="line1" className={labelClass}>Address</label>
        <input id="line1" name="line1" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="line2" className={labelClass}>Apartment, suite (optional)</label>
        <input id="line2" name="line2" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className={labelClass}>City</label>
          <input id="city" name="city" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="province" className={labelClass}>Province</label>
          <input id="province" name="province" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="postalCode" className={labelClass}>Postal code</label>
        <input id="postalCode" name="postalCode" className={inputClass} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" />
        Set as default address
      </label>

      {error && <p role="alert" className="text-sm text-rust">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
