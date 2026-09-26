import { db, brands } from "@/db";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export const metadata = { title: "Brands — Admin" };

export default async function AdminBrandsPage() {
  const list = await db.query.brands.findMany({ orderBy: (b, { asc }) => [asc(b.name)] });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Brands</h1>
      <TaxonomyManager kind="brand" items={list.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))} />
    </div>
  );
}
