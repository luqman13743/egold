import { desc } from "drizzle-orm";
import { db, users } from "@/db";
import { hasRole } from "@/lib/auth/rbac";
import { UserRoleRow } from "@/components/admin/user-role-row";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  const list = await db.query.users.findMany({ orderBy: [desc(users.createdAt)], limit: 200 });
  const canEditRoles = await hasRole("super_admin");

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Users</h1>
      {!canEditRoles && (
        <p className="text-sm text-ink/50 dark:text-white/50 mb-6">
          Only a super admin can change roles — you can view but not edit here.
        </p>
      )}
      <table className="w-full text-sm mt-4">
        <thead>
          <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
            <th className="py-2 pr-4 font-normal">Name</th>
            <th className="py-2 pr-4 font-normal">Email</th>
            <th className="py-2 font-normal">Role</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <UserRoleRow key={u.id} id={u.id} name={u.name} email={u.email} role={u.role} editable={canEditRoles} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
