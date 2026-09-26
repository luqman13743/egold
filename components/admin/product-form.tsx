"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, addProductImage } from "@/actions/products";
import { requestProductImageUpload } from "@/actions/uploads";

const inputClass = "w-full rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm";
const labelClass = "block text-sm font-medium mb-1.5";

interface ProductFormProps {
  mode: "create" | "edit";
  initial?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    description?: string | null;
    shortDescription?: string | null;
    price: string;
    salePrice?: string | null;
    status: "draft" | "published" | "archived";
    seoTitle?: string | null;
    seoDescription?: string | null;
    fragranceIntensity?: number | null;
    sweetness?: number | null;
    longevity?: number | null;
    scentNotes?: string | null;
    ingredients?: string | null;
  };
}

export function ProductForm({ mode, initial }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productId, setProductId] = useState(initial?.id);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    startTransition(async () => {
      try {
        if (mode === "create") {
          const product = await createProduct(payload);
          setProductId(product.id);
          router.push(`/admin/products/${product.id}/edit`);
        } else {
          await updateProduct({ ...payload, id: initial!.id });
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save product.");
      }
    });
  }

  async function handleImageUpload(file: File) {
    if (!productId) {
      setError("Save the product before adding images.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { uploadUrl, objectKey } = await requestProductImageUpload({
        mimeType: file.type,
        fileSizeBytes: file.size,
      });
      // Direct-to-R2 upload — the file never passes through our server,
      // and the presigned URL only allows this one object, this one time.
      const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error("Upload failed");
      await addProductImage({ productId, objectKey, altText: initial?.name ?? "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input id="name" name="name" required defaultValue={initial?.name} className={inputClass} />
        </div>
        <div>
          <label htmlFor="slug" className={labelClass}>Slug</label>
          <input id="slug" name="slug" required defaultValue={initial?.slug} className={inputClass} placeholder="product-name" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sku" className={labelClass}>SKU</label>
          <input id="sku" name="sku" required defaultValue={initial?.sku} className={inputClass} />
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" name="status" defaultValue={initial?.status ?? "draft"} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className={labelClass}>Price (PKR)</label>
          <input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={initial?.price} className={inputClass} />
        </div>
        <div>
          <label htmlFor="salePrice" className={labelClass}>Sale price (optional)</label>
          <input id="salePrice" name="salePrice" type="number" step="0.01" min="0" defaultValue={initial?.salePrice ?? ""} className={inputClass} />
        </div>
      </div>

      {mode === "create" && (
        <div>
          <label htmlFor="initialStock" className={labelClass}>Initial stock</label>
          <input id="initialStock" name="initialStock" type="number" min="0" defaultValue={0} className={inputClass} />
        </div>
      )}

      <div>
        <label htmlFor="shortDescription" className={labelClass}>Short description</label>
        <input id="shortDescription" name="shortDescription" defaultValue={initial?.shortDescription ?? ""} className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea id="description" name="description" rows={6} defaultValue={initial?.description ?? ""} className={inputClass} />
      </div>

      <fieldset className="border border-sand rounded-md p-4">
        <legend className="text-sm font-medium text-accent-dim px-1">Scent profile</legend>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="fragranceIntensity" className={labelClass}>Fragrance intensity (0–100)</label>
            <input id="fragranceIntensity" name="fragranceIntensity" type="number" min="0" max="100" defaultValue={initial?.fragranceIntensity ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sweetness" className={labelClass}>Sweetness (0–100)</label>
            <input id="sweetness" name="sweetness" type="number" min="0" max="100" defaultValue={initial?.sweetness ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="longevity" className={labelClass}>Longevity (0–100)</label>
            <input id="longevity" name="longevity" type="number" min="0" max="100" defaultValue={initial?.longevity ?? ""} className={inputClass} />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="scentNotes" className={labelClass}>Scent notes</label>
          <input id="scentNotes" name="scentNotes" placeholder="Top: Bergamot, Citrus — Heart: Jasmine, Rose — Base: Sandalwood, Musk" defaultValue={initial?.scentNotes ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="ingredients" className={labelClass}>Ingredients</label>
          <textarea id="ingredients" name="ingredients" rows={3} defaultValue={initial?.ingredients ?? ""} className={inputClass} />
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="seoTitle" className={labelClass}>SEO title</label>
          <input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={initial?.seoTitle ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="seoDescription" className={labelClass}>SEO description</label>
          <input id="seoDescription" name="seoDescription" maxLength={160} defaultValue={initial?.seoDescription ?? ""} className={inputClass} />
        </div>
      </div>

      {mode === "edit" && (
        <div>
          <label className={labelClass}>Add image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="text-sm"
          />
          {uploading && <p className="text-xs text-ink/50 mt-1">Uploading…</p>}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-rust">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
      >
        {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
      </button>
    </form>
  );
}
