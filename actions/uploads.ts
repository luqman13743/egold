"use server";

import { requireRole } from "@/lib/auth/rbac";
import { requestUploadUrl as r2RequestUploadUrl } from "@/lib/r2/upload";
import { requestUploadSchema } from "@/schemas/product";

export async function requestProductImageUpload(input: unknown) {
  await requireRole("manager");
  const data = requestUploadSchema.parse({ ...input, folder: "products" });
  return r2RequestUploadUrl(data);
}
