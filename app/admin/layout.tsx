import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/rbac";
import { AdminNav } from "@/components/admin/admin-nav";

// This check is what actually keeps non-staff out of every /admin/* page —
// middleware.ts only redirects logged-out visitors; it does not check
// roles. A customer with a valid session still gets redirected here.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("staff").catch(() => null);
  if (!session) redirect("/login?redirect=/admin/dashboard");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AdminNav role={(session.user as { role?: string }).role ?? "customer"} />
      <div className="flex-1 min-w-0">
        <header className="border-b border-sand dark:border-white/10 px-4 sm:px-6 py-3 flex justify-between items-center">
          <Link href="/" className="text-sm text-ink/60 dark:text-white/60 hover:text-accent">
            ← Back to store
          </Link>
          <span className="text-sm text-ink/60 dark:text-white/60">{session.user.name}</span>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
