"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, users } from "@/db";
import { requireRole } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/audit";

const roleSchema = z.enum(["super_admin", "admin", "manager", "staff", "customer"]);

export async function setUserRole(userId: string, role: unknown) {
  // Only super_admin can grant/revoke roles — the most sensitive
  // permission in the system, so it sits above the "admin" boundary
  // that governs everything else here.
  const session = await requireRole("super_admin");
  const parsedRole = roleSchema.parse(role);

  await db.update(users).set({ role: parsedRole, updatedAt: new Date() }).where(eq(users.id, userId));

  await recordAudit({
    actorId: session.user.id,
    action: "user.role_change",
    targetType: "user",
    targetId: userId,
    metadata: { role: parsedRole },
  });

  revalidatePath("/admin/users");
}
