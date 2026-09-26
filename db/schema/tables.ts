import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------- enums ----------
export const roleEnum = pgEnum("role", ["super_admin", "admin", "manager", "staff", "customer"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "published", "archived"]);

// ---------- auth (Better Auth compatible shape) ----------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
}));

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(), // "credential" | "google" | ...
  accountId: text("account_id").notNull(),
  passwordHash: text("password_hash"), // never expose to client
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  providerAccountIdx: uniqueIndex("accounts_provider_account_idx").on(t.providerId, t.accountId),
  userIdx: index("accounts_user_idx").on(t.userId),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  tokenIdx: uniqueIndex("sessions_token_idx").on(t.token),
  userIdx: index("sessions_user_idx").on(t.userId),
}));

// ---------- catalog ----------
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  parentId: uuid("parent_id"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
}));

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex("brands_slug_idx").on(t.slug),
}));

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  categoryId: uuid("category_id").references(() => categories.id),
  brandId: uuid("brand_id").references(() => brands.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: productStatusEnum("status").notNull().default("draft"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  // Perfume scent profile — each 0-100, shown as animated bars on the
  // product page (see components/scent-profile.tsx)
  fragranceIntensity: integer("fragrance_intensity"),
  sweetness: integer("sweetness"),
  longevity: integer("longevity"),
  scentNotes: text("scent_notes"), // e.g. "Top: Bergamot, Citrus — Heart: Jasmine, Rose — Base: Sandalwood, Musk"
  ingredients: text("ingredients"),
  deletedAt: timestamp("deleted_at"), // soft delete
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
  skuIdx: uniqueIndex("products_sku_idx").on(t.sku),
  categoryIdx: index("products_category_idx").on(t.categoryId),
  brandIdx: index("products_brand_idx").on(t.brandId),
}));

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  // R2 object key, not a raw filename — see lib/r2
  objectKey: text("object_key").notNull(),
  altText: text("alt_text"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  productIdx: index("product_images_product_idx").on(t.productId),
}));

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }).notNull(),
  name: text("name").notNull(), // e.g. "Red / Large"
  options: jsonb("options").$type<Record<string, string>>().notNull(),
  priceOverride: numeric("price_override", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  skuIdx: uniqueIndex("product_variants_sku_idx").on(t.sku),
  productIdx: index("product_variants_product_idx").on(t.productId),
}));

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  stock: integer("stock").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  productIdx: index("inventory_product_idx").on(t.productId),
}));

// ---------- cart ----------
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token"), // guest carts
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  cartIdx: index("cart_items_cart_idx").on(t.cartId),
}));

// ---------- addresses ----------
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  province: text("province"),
  postalCode: text("postal_code"),
  country: varchar("country", { length: 2 }).notNull().default("PK"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("addresses_user_idx").on(t.userId),
}));

// ---------- orders ----------
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  addressId: uuid("address_id").references(() => addresses.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentMethod: text("payment_method"), // "safepay" | "cod"
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountTotal: numeric("discount_total", { precision: 12, scale: 2 }).notNull().default("0"),
  shippingTotal: numeric("shipping_total", { precision: 12, scale: 2 }).notNull().default("0"),
  taxTotal: numeric("tax_total", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("PKR"),
  trackingNumber: text("tracking_number"),
  couponCode: text("coupon_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("orders_user_idx").on(t.userId),
  statusIdx: index("orders_status_idx").on(t.status),
}));

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(), // snapshot at purchase time
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(), // price AT purchase
}, (t) => ({
  orderIdx: index("order_items_order_idx").on(t.orderId),
}));

// ---------- payments ----------
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("safepay"),
  providerPaymentId: text("provider_payment_id").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("PKR"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  providerPaymentIdx: uniqueIndex("payments_provider_payment_idx").on(t.providerPaymentId),
  orderIdx: index("payments_order_idx").on(t.orderId),
}));

// Dedupe table for webhook idempotency — see app/api/webhooks/safepay/route.ts
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerEventId: text("provider_event_id").notNull(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
}, (t) => ({
  eventIdx: uniqueIndex("processed_webhook_events_id_idx").on(t.providerEventId),
}));

// ---------- coupons ----------
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull(),
  type: text("type").notNull(), // "percentage" | "fixed"
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 }),
  maxDiscount: numeric("max_discount", { precision: 12, scale: 2 }),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  usageLimit: integer("usage_limit"),
  perUserLimit: integer("per_user_limit"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  codeIdx: uniqueIndex("coupons_code_idx").on(t.code),
}));

export const couponUsage = pgTable("coupon_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  usedAt: timestamp("used_at").notNull().defaultNow(),
}, (t) => ({
  couponUserIdx: index("coupon_usage_coupon_user_idx").on(t.couponId, t.userId),
}));

// ---------- reviews / wishlist / notifications / audit ----------
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body"),
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  status: text("status").notNull().default("pending"), // pending|approved|rejected|hidden
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  productIdx: index("reviews_product_idx").on(t.productId),
  userProductIdx: uniqueIndex("reviews_user_product_idx").on(t.userId, t.productId),
}));

export const wishlists = pgTable("wishlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userProductIdx: uniqueIndex("wishlists_user_product_idx").on(t.userId, t.productId),
}));

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("notifications_user_idx").on(t.userId),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(), // "product.create", "order.status_change", ...
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  actorIdx: index("audit_logs_actor_idx").on(t.actorId),
  createdIdx: index("audit_logs_created_idx").on(t.createdAt),
}));
