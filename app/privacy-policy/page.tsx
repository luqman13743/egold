export const metadata = { title: "Privacy policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-prose px-4 sm:px-6 py-16 space-y-4 text-ink/80 dark:text-white/80">
      <h1 className="font-display text-3xl text-ink dark:text-white mb-4">Privacy policy</h1>
      <p>We collect the information needed to process your orders: name, contact details, delivery
        address and order history. We never store full card numbers — payments are handled directly
        by our payment gateway.</p>
      <p>We use your email to send order confirmations, shipping updates, and — only if you opt in —
        occasional product updates. You can unsubscribe from marketing email at any time.</p>
      <p>We do not sell your personal data to third parties. Data is shared only with the services
        needed to fulfil your order: our payment gateway, shipping partners, and hosting providers.</p>
      <p>You can request a copy of your data or ask us to delete your account by contacting us
        through the <a href="/contact" className="text-accent hover:underline">contact page</a>.</p>
      <p className="text-sm text-ink/50 dark:text-white/50">Last updated: 2026.</p>
    </div>
  );
}
