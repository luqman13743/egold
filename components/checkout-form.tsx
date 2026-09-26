"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeOrder } from "@/actions/checkout";

const inputClass =
  "w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm";
const labelClass = "block text-sm font-medium mb-1.5";

export function CheckoutForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"safepay" | "cod">("safepay");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      try {
        const result = await placeOrder({ ...payload, paymentMethod });
        router.push(result.redirectUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-ink/60 dark:text-white/60 mb-1">
          Delivery details
        </legend>

        <div>
          <label htmlFor="fullName" className={labelClass}>Full name</label>
          <input id="fullName" name="fullName" required className={inputClass} autoComplete="name" />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input id="phone" name="phone" required className={inputClass} autoComplete="tel" placeholder="03XX XXXXXXX" />
        </div>

        <div>
          <label htmlFor="line1" className={labelClass}>Address</label>
          <input id="line1" name="line1" required className={inputClass} autoComplete="address-line1" />
        </div>

        <div>
          <label htmlFor="line2" className={labelClass}>Apartment, suite, etc. (optional)</label>
          <input id="line2" name="line2" className={inputClass} autoComplete="address-line2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <input id="city" name="city" required className={inputClass} autoComplete="address-level2" />
          </div>
          <div>
            <label htmlFor="province" className={labelClass}>Province</label>
            <input id="province" name="province" className={inputClass} autoComplete="address-level1" />
          </div>
        </div>

        <div>
          <label htmlFor="postalCode" className={labelClass}>Postal code</label>
          <input id="postalCode" name="postalCode" className={inputClass} autoComplete="postal-code" />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink/60 dark:text-white/60 mb-1">Coupon (optional)</legend>
        <input name="couponCode" placeholder="Coupon code" className={inputClass} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink/60 dark:text-white/60 mb-1">Payment method</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="paymentMethodChoice"
            checked={paymentMethod === "safepay"}
            onChange={() => setPaymentMethod("safepay")}
          />
          Card, JazzCash or EasyPaisa (Safepay)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="paymentMethodChoice"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
          />
          Cash on delivery
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-rust">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50"
      >
        {pending ? "Placing order…" : paymentMethod === "cod" ? "Place order" : "Continue to payment"}
      </button>
    </form>
  );
}
