"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, addresses } from "@/db";
import { requireSession } from "@/lib/auth/rbac";

const addressSchema = z.object({
  fullName: z.string().min(1).max(200),
  phone: z.string().min(7).max(20),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  isDefault: z.coerce.boolean().default(false),
});

export async function addAddress(input: unknown) {
  const session = await requireSession();
  const data = addressSchema.parse(input);

  if (data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, session.user.id));
  }

  await db.insert(addresses).values({ userId: session.user.id, ...data });
  revalidatePath("/account/addresses");
}

export async function deleteAddress(addressId: string) {
  const session = await requireSession();
  // Ownership check inline in the WHERE clause — deleting someone else's
  // address by id is not possible even if the id is guessed.
  await db.delete(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)));
  revalidatePath("/account/addresses");
}
