import { db, auditLogs } from "@/db";

interface AuditInput {
  actorId: string | null;
  action: string; // e.g. "product.create", "order.status_change", "auth.login"
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

// Never pass passwords, tokens, CVV, or other credentials into metadata —
// this table is for accountability, not a secrets log.
export async function recordAudit(input: AuditInput) {
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata,
    ipAddress: input.ipAddress ?? null,
  });
}
