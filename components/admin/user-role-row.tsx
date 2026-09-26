"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/actions/admin-users";

const ROLES = ["customer", "staff", "manager", "admin", "super_admin"];

export function UserRoleRow({
  id, name, email, role, editable,
}: { id: string; name: string; email: string; role: string; editable: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-b border-sand dark:border-white/10">
      <td className="py-2.5 pr-4">{name}</td>
      <td className="py-2.5 pr-4 text-ink/60 dark:text-white/60">{email}</td>
      <td className="py-2.5">
        {editable ? (
          <select
            defaultValue={role}
            disabled={pending}
            onChange={(e) => {
              if (confirm(`Change ${name}'s role to ${e.target.value}?`)) {
                startTransition(async () => { await setUserRole(id, e.target.value); router.refresh(); });
              }
            }}
            className="rounded border border-sand dark:border-white/10 bg-transparent px-2 py-1 text-sm"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        ) : (
          <span className="capitalize">{role.replace("_", " ")}</span>
        )}
      </td>
    </tr>
  );
}
