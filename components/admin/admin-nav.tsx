"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", minRole: "staff" },
  { href: "/admin/products", label: "Products", minRole: "staff" },
  { href: "/admin/categories", label: "Categories", minRole: "manager" },
  { href: "/admin/brands", label: "Brands", minRole: "manager" },
  { href: "/admin/orders", label: "Orders", minRole: "staff" },
  { href: "/admin/customers", label: "Customers", minRole: "manager" },
  { href: "/admin/inventory", label: "Inventory", minRole: "staff" },
  { href: "/admin/payments", label: "Payments", minRole: "manager" },
  { href: "/admin/coupons", label: "Coupons", minRole: "manager" },
  { href: "/admin/reviews", label: "Reviews", minRole: "staff" },
  { href: "/admin/users", label: "Users", minRole: "admin" },
  { href: "/admin/roles", label: "Roles", minRole: "admin" },
  { href: "/admin/analytics", label: "Analytics", minRole: "manager" },
  { href: "/admin/audit-logs", label: "Audit logs", minRole: "admin" },
  { href: "/admin/settings", label: "Settings", minRole: "admin" },
];

const RANK: Record<string, number> = { customer: 0, staff: 1, manager: 2, admin: 3, super_admin: 4 };

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = NAV.filter((item) => RANK[role] >= RANK[item.minRole]);

  return (
    <>
      <div className="md:hidden flex items-center justify-between border-b border-sand dark:border-white/10 px-4 py-3">
        <span className="font-display text-lg">Admin</span>
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" className="p-2">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <nav
        className={`${open ? "block" : "hidden"} md:block w-full md:w-56 shrink-0 border-r border-sand dark:border-white/10 md:min-h-screen p-4`}
      >
        <p className="font-display text-lg mb-4 hidden md:block">Admin</p>
        <ul className="space-y-0.5">
          {visible.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded px-3 py-2 text-sm ${
                  pathname.startsWith(item.href) ? "bg-accent text-white" : "hover:bg-sand dark:hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
