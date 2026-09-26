"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustInventory } from "@/actions/products";

export function InventoryRow({
  productId,
  productName,
  stock,
  reserved,
  lowStockThreshold,
}: {
  productId: string;
  productName: string;
  stock: number;
  reserved: number;
  lowStockThreshold: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const available = stock - reserved;
  const low = available <= lowStockThreshold;

  function adjust(delta: number) {
    const reason = delta > 0 ? "Manual restock" : "Manual correction";
    startTransition(async () => {
      try {
        await adjustInventory(productId, delta, reason);
        router.refresh();
      } catch {
        /* surfaced via refresh no-op; low-stakes control */
      }
    });
  }

  return (
    <tr className="border-b border-sand dark:border-white/10">
      <td className="py-3 pr-4">{productName}</td>
      <td className="py-3 pr-4 tabular-nums">{stock}</td>
      <td className="py-3 pr-4 tabular-nums">{reserved}</td>
      <td className={`py-3 pr-4 tabular-nums ${low ? "text-rust font-medium" : ""}`}>{available}</td>
      <td className="py-3 flex gap-2">
        <button disabled={pending} onClick={() => adjust(-1)} className="px-2 py-1 rounded border border-sand dark:border-white/10 hover:bg-sand dark:hover:bg-white/10">-1</button>
        <button disabled={pending} onClick={() => adjust(1)} className="px-2 py-1 rounded border border-sand dark:border-white/10 hover:bg-sand dark:hover:bg-white/10">+1</button>
        <button disabled={pending} onClick={() => adjust(10)} className="px-2 py-1 rounded border border-sand dark:border-white/10 hover:bg-sand dark:hover:bg-white/10">+10</button>
      </td>
    </tr>
  );
}
