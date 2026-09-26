import { desc, eq } from "drizzle-orm";
import { db, auditLogs, users } from "@/db";

export const metadata = { title: "Audit logs — Admin" };

export default async function AdminAuditLogsPage() {
  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: 200,
  });

  const actorIds = [...new Set(logs.map((l) => l.actorId).filter((id): id is string => !!id))];
  const actors = actorIds.length
    ? await db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, actorIds) })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a.name]));

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Audit logs</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
              <th className="py-2 pr-4 font-normal">When</th>
              <th className="py-2 pr-4 font-normal">Actor</th>
              <th className="py-2 pr-4 font-normal">Action</th>
              <th className="py-2 font-normal">Target</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-sand dark:border-white/10">
                <td className="py-2 pr-4 text-ink/50 dark:text-white/50 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4">{log.actorId ? actorMap.get(log.actorId) ?? "Unknown" : "System"}</td>
                <td className="py-2 pr-4 font-mono text-xs">{log.action}</td>
                <td className="py-2 text-ink/60 dark:text-white/60">
                  {log.targetType ? `${log.targetType}:${log.targetId?.slice(0, 8)}` : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-ink/50">No activity logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
