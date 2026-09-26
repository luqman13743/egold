import { db, categories } from "@/db";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export const metadata = { title: "Categories — Admin" };

export default async function AdminCategoriesPage() {
  const list = await db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Categories</h1>
      <TaxonomyManager kind="category" items={list.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </div>
  );
}
