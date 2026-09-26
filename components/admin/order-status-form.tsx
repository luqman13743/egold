"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, refundOrder } from "@/actions/admin-orders";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"];

export function OrderStatusForm({
  orderId,
  currentStatus,
  trackingNumber,
  paymentStatus,
}: {
  orderId: string;
  currentStatus: string;
  trackingNumber: string | null;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const status = String(fd.get("status"));
    const tracking = String(fd.get("trackingNumber") ?? "");

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status, tracking);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update order.");
      }
    });
  }

  return (
    <div className="border-t border-sand dark:border-white/10 pt-6 space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end" noValidate>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1.5">Status</label>
          <select id="status" name="status" defaultValue={currentStatus} className="rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="trackingNumber" className="block text-sm font-medium mb-1.5">Tracking number</label>
          <input id="trackingNumber" name="trackingNumber" defaultValue={trackingNumber ?? ""} className="rounded border border-sand dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={pending} className="rounded-md bg-accent px-4 py-2 text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50">
          Update
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-rust">{error}</p>}

      {paymentStatus === "paid" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Start a full refund for this order?")) {
              startTransition(async () => {
                try {
                  await refundOrder(orderId);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Refund failed.");
                }
              });
            }
          }}
          className="rounded-md border border-rust text-rust px-4 py-2 text-sm hover:bg-rust/10"
        >
          Refund order
        </button>
      )}
    </div>
  );
}
