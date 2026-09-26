import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated");

export const productStatusSchema = z.enum(["draft", "published", "archived"]);

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema,
  sku: z.string().min(1).max(100),
  description: z.string().max(20000).optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.coerce.number().positive().max(10_000_000),
  salePrice: z.coerce.number().positive().max(10_000_000).optional(),
  costPrice: z.coerce.number().nonnegative().max(10_000_000).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  status: productStatusSchema.default("draft"),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  fragranceIntensity: z.coerce.number().int().min(0).max(100).optional(),
  sweetness: z.coerce.number().int().min(0).max(100).optional(),
  longevity: z.coerce.number().int().min(0).max(100).optional(),
  scentNotes: z.string().max(500).optional(),
  ingredients: z.string().max(2000).optional(),
  initialStock: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
}).refine(
  (data) => !data.salePrice || data.salePrice < data.price,
  { message: "Sale price must be less than regular price", path: ["salePrice"] }
);

export const updateProductSchema = createProductSchema.innerType().partial().extend({
  id: z.string().uuid(),
});

export const addProductImageSchema = z.object({
  productId: z.string().uuid(),
  objectKey: z.string().min(1).max(500),
  altText: z.string().max(200).optional(),
  position: z.coerce.number().int().nonnegative().default(0),
});

export const requestUploadSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  fileSizeBytes: z.number().int().positive().max(8 * 1024 * 1024),
  folder: z.enum(["products", "avatars", "brands"]),
});

export const productSearchSchema = z.object({
  query: z.string().max(200).optional(),
  categorySlug: z.string().max(255).optional(),
  brandSlug: z.string().max(255).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest", "rating"]).default("relevance"),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(60).default(24),
});
