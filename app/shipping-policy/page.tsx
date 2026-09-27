export const metadata = { title: "Shipping policy" };

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-prose px-4 sm:px-6 py-16 space-y-4 text-ink/80 dark:text-white/80">
      <h1 className="font-display text-3xl text-ink dark:text-white mb-4">Shipping policy</h1>
      <p>Orders are processed within 1–2 business days. Delivery typically takes 3–5 business days
        depending on your city, and up to 7 days for remote areas.</p>
      <p>Shipping is free on orders over PKR 5,000; a flat PKR 250 fee applies below that.</p>
      <p>You&apos;ll receive a tracking number by email once your order ships, and it will also
        appear on your order details page under your account.</p>
    </div>
  );
}
