export const metadata = { title: "FAQ" };

const FAQS = [
  { q: "How long does delivery take?", a: "Most orders arrive within 3–5 business days, depending on your city." },
  { q: "What payment methods do you accept?", a: "Cards, JazzCash and EasyPaisa through Safepay, or cash on delivery." },
  { q: "Can I return an item?", a: "Yes — see our return policy for the window and conditions." },
  { q: "How do I track my order?", a: "Once shipped, your tracking number appears on your order details page." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-prose px-4 sm:px-6 py-16">
      <h1 className="font-display text-3xl mb-8">Frequently asked questions</h1>
      <dl className="space-y-6">
        {FAQS.map((item) => (
          <div key={item.q}>
            <dt className="font-medium">{item.q}</dt>
            <dd className="mt-1 text-ink/70 dark:text-white/70">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
