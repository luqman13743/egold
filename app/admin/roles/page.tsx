const ROLES = [
  { role: "Customer", desc: "Can browse, order, review purchased products, manage their own account." },
  { role: "Staff", desc: "Customer permissions, plus: moderate reviews, adjust inventory, update order status." },
  { role: "Manager", desc: "Staff permissions, plus: manage products, categories, brands, coupons, view customers & analytics." },
  { role: "Admin", desc: "Manager permissions, plus: delete products, refund orders, view users, audit logs, settings." },
  { role: "Super Admin", desc: "Admin permissions, plus: change any user's role — the only role that can do this." },
];

export const metadata = { title: "Roles — Admin" };

export default function AdminRolesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-2">Roles</h1>
      <p className="text-sm text-ink/60 dark:text-white/60 mb-6">
        To change a person&apos;s role, go to <a href="/admin/users" className="text-accent hover:underline">Users</a>.
        Every permission below is enforced server-side, in the action or route handler itself — never only by hiding UI.
      </p>
      <dl className="space-y-4">
        {ROLES.map((r) => (
          <div key={r.role} className="border-b border-sand dark:border-white/10 pb-4">
            <dt className="font-medium">{r.role}</dt>
            <dd className="text-sm text-ink/70 dark:text-white/70 mt-1">{r.desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
