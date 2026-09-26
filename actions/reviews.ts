"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, reviews } from "@/db";
import { requireRole } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/audit";

export async function moderateReview(reviewId: string, status: "approved" | "rejected" | "hidden") {
  const session = await requireRole("staff");
  await db.update(reviews).set({ status }).where(eq(reviews.id, reviewId));
  await recordAudit({ actorId: session.user.id, action: "review.moderate", targetType: "review", targetId: reviewId, metadata: { status } });
  revalidatePath("/admin/reviews");
}
