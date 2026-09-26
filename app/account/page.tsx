import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/rbac";

export const metadata = { title: "Your account" };

const LINKS = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile & security" },
  { href: "/wishlist", label: "Wishlist" },
];

export default async function AccountPage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login?redirect=/account");

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-1">Hi, {session.user.name}</h1>
      <p className="text-ink/60 dark:text-white/60 mb-8">{session.user.email}</p>

      <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="flex justify-between items-center py-4 hover:text-accent">
              <span>{link.label}</span>
              <span aria-hidden>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
