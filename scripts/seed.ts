import { db, users, accounts, categories, brands, products, inventory } from "../db";
import { randomUUID } from "crypto";
import { scryptSync, randomBytes } from "crypto";

// This script creates DEMO data only. It never writes a real production
// password — the demo admin password below is a placeholder meant to be
// changed immediately (see SETUP.md "Admin setup" for the production
// procedure, which uses Better Auth's own registration + role promotion
// flow rather than this script).
const DEMO_ADMIN_EMAIL = "admin@example.com";
const DEMO_ADMIN_PASSWORD = "ChangeMeNow123!"; // placeholder — rotate immediately after first login
const DEMO_CUSTOMER_EMAIL = "customer@example.com";
const DEMO_CUSTOMER_PASSWORD = "ChangeMeToo123!";

// Minimal scrypt hash compatible with Better Auth's default credential
// hashing, for seeding only — production sign-up always goes through
// Better Auth itself, never this function.
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding demo data...");

  const [admin] = await db
    .insert(users)
    .values({ name: "Demo Admin", email: DEMO_ADMIN_EMAIL, emailVerified: true, role: "super_admin" })
    .returning();
  await db.insert(accounts).values({
    userId: admin.id,
    providerId: "credential",
    accountId: admin.id,
    passwordHash: hashPassword(DEMO_ADMIN_PASSWORD),
  });

  const [customer] = await db
    .insert(users)
    .values({ name: "Demo Customer", email: DEMO_CUSTOMER_EMAIL, emailVerified: true, role: "customer" })
    .returning();
  await db.insert(accounts).values({
    userId: customer.id,
    providerId: "credential",
    accountId: customer.id,
    passwordHash: hashPassword(DEMO_CUSTOMER_PASSWORD),
  });

  const [electronics] = await db.insert(categories).values({ name: "Electronics", slug: "electronics" }).returning();
  const [homeGoods] = await db.insert(categories).values({ name: "Home Goods", slug: "home-goods" }).returning();

  const [genericBrand] = await db.insert(brands).values({ name: "Everyday Co.", slug: "everyday-co" }).returning();

  const demoProducts = [
    {
      name: "Wireless Earbuds",
      slug: "wireless-earbuds",
      sku: "SKU-EARBUDS-01",
      price: "4999.00",
      salePrice: "3999.00",
      categoryId: electronics.id,
      brandId: genericBrand.id,
      shortDescription: "Compact wireless earbuds with 20-hour battery life.",
      status: "published" as const,
      stock: 40,
    },
    {
      name: "Ceramic Mug Set (4-pack)",
      slug: "ceramic-mug-set",
      sku: "SKU-MUG-04",
      price: "1899.00",
      categoryId: homeGoods.id,
      brandId: genericBrand.id,
      shortDescription: "Set of four handmade ceramic mugs.",
      status: "published" as const,
      stock: 25,
    },
    {
      name: "Desk Lamp",
      slug: "desk-lamp",
      sku: "SKU-LAMP-01",
      price: "2499.00",
      categoryId: homeGoods.id,
      brandId: genericBrand.id,
      shortDescription: "Adjustable LED desk lamp with three brightness settings.",
      status: "published" as const,
      stock: 3, // intentionally low, to demo the low-stock dashboard widget
    },
  ];

  for (const p of demoProducts) {
    const { stock, ...productData } = p;
    const [product] = await db.insert(products).values(productData).returning();
    await db.insert(inventory).values({ productId: product.id, stock, lowStockThreshold: 5 });
  }

  console.log("Seed complete.");
  console.log(`Demo admin:    ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD} (rotate this immediately)`);
  console.log(`Demo customer: ${DEMO_CUSTOMER_EMAIL} / ${DEMO_CUSTOMER_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
