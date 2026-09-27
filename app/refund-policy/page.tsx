export const metadata = { title: "Refund policy" };

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-prose px-4 sm:px-6 py-16 space-y-4 text-ink/80 dark:text-white/80">
      <h1 className="font-display text-3xl text-ink dark:text-white mb-4">Refund policy</h1>
      <p>Approved refunds are issued to your original payment method — card, JazzCash or EasyPaisa
        via Safepay — within 5–7 business days of us receiving a returned item.</p>
      <p>Cash-on-delivery orders are refunded via bank transfer; we&apos;ll ask for your account
        details when processing the refund.</p>
      <p>Shipping fees are non-refundable unless the return is due to our error (wrong or
        defective item).</p>
    </div>
  );
}
