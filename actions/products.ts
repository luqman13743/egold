"use server";

import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db, products, productImages, inventory } from "@/db";
import { requireRole } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/audit";
import {
  createProductSchema,
  updateProductSchema,
  addProductImageSchema,
} from "@/schemas/product";

function clientIp() {
  return headers().then((h) => h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null);
}

export async function createProduct(input: unknown) {
  const session = await requireRole("manager");
  const data = createProductSchema.parse(input);

  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        description: data.description,
        shortDescription: data.shortDescription,
        price: String(data.price),
        salePrice: data.salePrice ? String(data.salePrice) : undefined,
        costPrice: data.costPrice ? String(data.costPrice) : undefined,
        categoryId: data.categoryId,
        brandId: data.brandId,
        tags: data.tags,
        status: data.status,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      })
      .returning();

    await tx.insert(inventory).values({
      productId: product.id,
      stock: data.initialStock,
      lowStockThreshold: data.lowStockThreshold,
    });

    return product;
  });

  await recordAudit({
    actorId: session.user.id,
    action: "product.create",
    targetType: "product",
    targetId: result.id,
    metadata: { name: result.name, sku: result.sku },
    ipAddress: await clientIp(),
  });

  revalidatePath("/admin/products");
  return result;
}

export async function updateProduct(input: unknown) {
  const session = await requireRole("manager");
  const data = updateProductSchema.parse(input);
  const { id, ...fields } = data;

  const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!existing) throw new Error("Product not found");

  // Track price changes specifically — they're operationally sensitive and
  // called out in the audit requirements.
  const priceChanged = fields.price !== undefined && String(fields.price) !== existing.price;

  const [updated] = await db
    .update(products)
    .set({
      ...fields,
      price: fields.price !== undefined ? String(fields.price) : undefined,
      salePrice: fields.salePrice !== undefined ? String(fields.salePrice) : undefined,
      costPrice: fields.costPrice !== undefined ? String(fields.costPrice) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  await recordAudit({
    actorId: session.user.id,
    action: priceChanged ? "product.price_change" : "product.update",
    targetType: "product",
    targetId: id,
    metadata: priceChanged ? { from: existing.price, to: String(fields.price) } : { fields: Object.keys(fields) },
    ipAddress: await clientIp(),
  });

  revalidatePath("/admin/products");
  revalidatePath(`/product/${updated.slug}`);
  return updated;
}

export async function archiveProduct(productId: string) {
  const session = await requireRole("manager");

  await db.update(products).set({ status: "archived", updatedAt: new Date() }).where(eq(products.id, productId));

  await recordAudit({
    actorId: session.user.id,
    action: "product.archive",
    targetType: "product",
    targetId: productId,
    ipAddress: await clientIp(),
  });

  revalidatePath("/admin/products");
}

export async function softDeleteProduct(productId: string) {
  // Deletion is more destructive than archiving — require admin, not just manager.
  const session = await requireRole("admin");

  await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, productId));

  await recordAudit({
    actorId: session.user.id,
    action: "product.delete",
    targetType: "product",
    targetId: productId,
    ipAddress: await clientIp(),
  });

  revalidatePath("/admin/products");
}

export async function setProductStatus(productId: string, status: "draft" | "published" | "archived") {
  const session = await requireRole("manager");

  await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, productId));

  await recordAudit({
    actorId: session.user.id,
    action: "product.status_change",
    targetType: "product",
    targetId: productId,
    metadata: { status },
    ipAddress: await clientIp(),
  });

  revalidatePath("/admin/products");
}

export async function addProductImage(input: unknown) {
  const session = await requireRole("manager");
  const data = addProductImageSchema.parse(input);

  const [image] = await db.insert(productImages).values(data).returning();

  await recordAudit({
    actorId: session.user.id,
    action: "product.image_add",
    targetType: "product",
    targetId: data.productId,
    ipAddress: await clientIp(),
  });

  revalidatePath("/admin/products");
  return image;
}

export async function reorderProductImages(productId: string, orderedImageIds: string[]) {
  await requireRole("manager");

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedImageIds.length; i++) {
      await tx
        .update(productImages)
        .set({ position: i })
        .where(and(eq(productImages.id, orderedImageIds[i]), eq(productImages.productId, productId)));
    }
  });

  revalidatePath("/admin/products");
}

export async function adjustInventory(productId: string, delta: number, reason: string) {
  const session = await requireRole("staff");

  await db.transaction(async (tx) => {
    const record = await tx.query.inventory.findFirst({
      where: and(eq(inventory.productId, productId), isNull(inventory.variantId)),
    });
    if (!record) throw new Error("Inventory record not found");

    const newStock = record.stock + delta;
    if (newStock < 0) throw new Error("Stock cannot go negative");

    await tx.update(inventory).set({ stock: newStock, updatedAt: new Date() }).where(eq(inventory.id, record.id));

    await recordAudit({
      actorId: session.user.id,
      action: "inventory.adjust",
      targetType: "product",
      targetId: productId,
      metadata: { delta, reason, newStock },
      ipAddress: await clientIp(),
    });
  });

  revalidatePath("/admin/inventory");
}
