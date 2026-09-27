export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-prose px-4 sm:px-6 py-16 space-y-4 text-ink/80 dark:text-white/80">
      <h1 className="font-display text-3xl text-ink dark:text-white mb-4">Terms of service</h1>
      <p>By placing an order on this site, you agree to pay the listed price plus any applicable
        shipping and taxes shown at checkout. All prices are in PKR unless stated otherwise.</p>
      <p>Orders are subject to product availability. We reserve the right to cancel an order and
        issue a refund if an item turns out to be out of stock after purchase.</p>
      <p>Content on this site — including product photography and descriptions — belongs to us or
        our suppliers and may not be reused without permission.</p>
      <p>We may update these terms from time to time; continued use of the site after changes means
        you accept the updated terms.</p>
      <p className="text-sm text-ink/50 dark:text-white/50">Last updated: 2026.</p>
    </div>
  );
}
