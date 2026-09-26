"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveProduct, softDeleteProduct } from "@/actions/products";

export function ProductDangerZone({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-10 pt-6 border-t border-sand dark:border-white/10 max-w-2xl">
      <h2 className="text-sm font-medium text-rust mb-3">Danger zone</h2>
      <div className="flex gap-3">
        {status !== "archived" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => archiveProduct(productId))}
            className="rounded-md border border-sand dark:border-white/10 px-4 py-2 text-sm hover:bg-sand dark:hover:bg-white/10"
          >
            Archive
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Permanently delete this product? This cannot be undone from the UI.")) {
              startTransition(async () => {
                await softDeleteProduct(productId);
                router.push("/admin/products");
              });
            }
          }}
          className="rounded-md border border-rust text-rust px-4 py-2 text-sm hover:bg-rust/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
