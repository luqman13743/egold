import { describe, it, expect } from "vitest";
import { calculateShipping } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";
import { checkoutSchema } from "@/schemas/checkout";
import { createProductSchema, slugSchema } from "@/schemas/product";

describe("calculateShipping", () => {
  it("charges the flat rate below the free-shipping threshold", () => {
    expect(calculateShipping(1000)).toBe(250);
  });

  it("is free at or above the threshold", () => {
    expect(calculateShipping(5000)).toBe(0);
    expect(calculateShipping(10000)).toBe(0);
  });
});

describe("formatPrice", () => {
  it("formats PKR with no decimal places", () => {
    expect(formatPrice(1999)).toContain("1,999");
  });
});

describe("slugSchema", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(slugSchema.safeParse("wireless-earbuds").success).toBe(true);
  });

  it("rejects uppercase, spaces, and leading/trailing hyphens", () => {
    expect(slugSchema.safeParse("Wireless Earbuds").success).toBe(false);
    expect(slugSchema.safeParse("-wireless-earbuds").success).toBe(false);
    expect(slugSchema.safeParse("wireless-earbuds-").success).toBe(false);
  });
});

describe("createProductSchema", () => {
  const base = {
    name: "Test Product",
    slug: "test-product",
    sku: "SKU-1",
    price: 1000,
  };

  it("accepts a valid product with no sale price", () => {
    expect(createProductSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a sale price that isn't lower than the regular price", () => {
    const result = createProductSchema.safeParse({ ...base, salePrice: 1000 });
    expect(result.success).toBe(false);
  });

  it("accepts a sale price lower than the regular price", () => {
    const result = createProductSchema.safeParse({ ...base, salePrice: 800 });
    expect(result.success).toBe(true);
  });

  it("rejects a negative price", () => {
    expect(createProductSchema.safeParse({ ...base, price: -5 }).success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const validAddress = {
    fullName: "Ayesha Khan",
    phone: "03001234567",
    line1: "123 Main St",
    city: "Lahore",
    paymentMethod: "safepay" as const,
  };

  it("accepts a valid checkout payload", () => {
    expect(checkoutSchema.safeParse(validAddress).success).toBe(true);
  });

  it("rejects an unknown payment method", () => {
    const result = checkoutSchema.safeParse({ ...validAddress, paymentMethod: "bitcoin" });
    expect(result.success).toBe(false);
  });

  it("requires a phone number", () => {
    const { phone, ...rest } = validAddress;
    expect(checkoutSchema.safeParse(rest).success).toBe(false);
  });
});
