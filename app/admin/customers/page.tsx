import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, users } from "@/db";

export const metadata = { title: "Customers — Admin" };

export default async function AdminCustomersPage() {
  const list = await db.query.users.findMany({
    where: eq(users.role, "customer"),
    orderBy: [desc(users.createdAt)],
    limit: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Customers</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
            <th className="py-2 pr-4 font-normal">Name</th>
            <th className="py-2 pr-4 font-normal">Email</th>
            <th className="py-2 pr-4 font-normal">Verified</th>
            <th className="py-2 font-normal">Joined</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.id} className="border-b border-sand dark:border-white/10">
              <td className="py-2.5 pr-4">
                <Link href={`/admin/customers/${u.id}`} className="hover:text-accent">{u.name}</Link>
              </td>
              <td className="py-2.5 pr-4 text-ink/60 dark:text-white/60">{u.email}</td>
              <td className="py-2.5 pr-4">{u.emailVerified ? "Yes" : "No"}</td>
              <td className="py-2.5 text-ink/50 dark:text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-ink/50">No customers yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
