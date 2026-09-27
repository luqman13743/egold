import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/rbac";
import { getUserWishlist } from "@/services/account";
import { ProductCard } from "@/components/product-card";
import { publicUrlFor } from "@/lib/r2/upload";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login?redirect=/wishlist");

  const items = await getUserWishlist(session.user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Your wishlist</h1>

      {items.length === 0 ? (
        <p className="text-ink/60 dark:text-white/60">Nothing saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {items.map((w) => (
            <ProductCard
              key={w.id}
              slug={w.product.slug}
              name={w.product.name}
              price={w.product.price}
              salePrice={w.product.salePrice}
              imageUrl={w.product.images[0] ? publicUrlFor(w.product.images[0].objectKey) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
