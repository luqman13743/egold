import Link from "next/link";
import { db, categories } from "@/db";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const list = await db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl mb-8">Categories</h1>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {list.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/category/${cat.slug}`}
              className="block rounded-md border border-sand dark:border-white/10 p-4 hover:border-accent transition-colors"
            >
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
