"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, categories, brands } from "@/db";
import { requireRole } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/audit";
import { slugSchema } from "@/schemas/product";

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema,
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export async function createCategory(input: unknown) {
  const session = await requireRole("manager");
  const data = categorySchema.parse(input);
  const [category] = await db.insert(categories).values(data).returning();
  await recordAudit({ actorId: session.user.id, action: "category.create", targetType: "category", targetId: category.id });
  revalidatePath("/admin/categories");
  return category;
}

export async function deleteCategory(id: string) {
  const session = await requireRole("admin");
  await db.delete(categories).where(eq(categories.id, id));
  await recordAudit({ actorId: session.user.id, action: "category.delete", targetType: "category", targetId: id });
  revalidatePath("/admin/categories");
}

const brandSchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema,
});

export async function createBrand(input: unknown) {
  const session = await requireRole("manager");
  const data = brandSchema.parse(input);
  const [brand] = await db.insert(brands).values(data).returning();
  await recordAudit({ actorId: session.user.id, action: "brand.create", targetType: "brand", targetId: brand.id });
  revalidatePath("/admin/brands");
  return brand;
}

export async function deleteBrand(id: string) {
  const session = await requireRole("admin");
  await db.delete(brands).where(eq(brands.id, id));
  await recordAudit({ actorId: session.user.id, action: "brand.delete", targetType: "brand", targetId: id });
  revalidatePath("/admin/brands");
}
