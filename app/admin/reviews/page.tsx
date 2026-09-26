import { desc, eq } from "drizzle-orm";
import { db, reviews } from "@/db";
import { ReviewModerationRow } from "@/components/admin/review-moderation-row";

export const metadata = { title: "Reviews — Admin" };

export default async function AdminReviewsPage() {
  const pending = await db.query.reviews.findMany({
    where: eq(reviews.status, "pending"),
    orderBy: [desc(reviews.createdAt)],
    with: { product: true, user: true },
    limit: 100,
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Reviews — pending moderation</h1>
      {pending.length === 0 ? (
        <p className="text-ink/60 dark:text-white/60">Nothing waiting for review.</p>
      ) : (
        <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10 max-w-2xl">
          {pending.map((r) => (
            <ReviewModerationRow
              key={r.id}
              id={r.id}
              productName={r.product.name}
              userName={r.user.name}
              rating={r.rating}
              title={r.title}
              body={r.body}
              verifiedPurchase={r.verifiedPurchase}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
