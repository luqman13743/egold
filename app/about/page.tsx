export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-prose px-4 sm:px-6 py-16">
      <h1 className="font-display text-3xl mb-6">About us</h1>
      <p className="text-ink/80 dark:text-white/80 mb-4">
        We&apos;re a small team building a straightforward place to buy quality goods online,
        with honest pricing and fast delivery across Pakistan.
      </p>
      <p className="text-ink/80 dark:text-white/80">
        Every product on this site is checked for stock before you order, and every payment
        is verified before an order is confirmed — no surprises, no oversold items.
      </p>
    </div>
  );
}
