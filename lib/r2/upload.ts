import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "./client";

// Never trust the browser's file type/extension claims — this is the
// server-side allowlist that actually governs what can be uploaded.
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export class UploadValidationError extends Error {}

interface RequestUploadUrlInput {
  mimeType: string;
  fileSizeBytes: number;
  folder: "products" | "avatars" | "brands";
}

/**
 * Generates a presigned PUT URL for direct-to-R2 upload. The caller never
 * gets R2 credentials — only a short-lived, single-object URL. Validates
 * type and size BEFORE issuing the URL; the object key is fully
 * server-generated (randomUUID), so the original filename never reaches
 * storage and path traversal via a crafted filename is not possible.
 */
export async function requestUploadUrl(input: RequestUploadUrlInput) {
  const extension = ALLOWED_MIME_TYPES[input.mimeType];
  if (!extension) {
    throw new UploadValidationError(`Unsupported file type: ${input.mimeType}`);
  }
  if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new UploadValidationError(`File size must be under ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
  }

  const objectKey = `${input.folder}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    ContentType: input.mimeType,
    ContentLength: input.fileSizeBytes,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 }); // 5 minutes

  return { uploadUrl, objectKey, publicUrl: `${R2_PUBLIC_URL}/${objectKey}` };
}

export async function deleteObject(objectKey: string) {
  // Defense in depth against a malformed/absolute key deleting outside the
  // intended prefix structure.
  if (objectKey.includes("..") || objectKey.startsWith("/")) {
    throw new UploadValidationError("Invalid object key");
  }
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: objectKey }));
}

export function publicUrlFor(objectKey: string) {
  return `${R2_PUBLIC_URL}/${objectKey}`;
}
