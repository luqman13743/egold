"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReview } from "@/actions/reviews";

export function ReviewModerationRow({
  id, productName, userName, rating, title, body, verifiedPurchase,
}: {
  id: string; productName: string; userName: string; rating: number;
  title: string | null; body: string | null; verifiedPurchase: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(status: "approved" | "rejected") {
    startTransition(async () => { await moderateReview(id, status); router.refresh(); });
  }

  return (
    <li className="py-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-sm font-medium">{productName} · {rating} ★ {verifiedPurchase && <span className="text-xs text-moss">Verified</span>}</p>
          <p className="text-xs text-ink/50 dark:text-white/50">{userName}</p>
          {title && <p className="text-sm mt-1 font-medium">{title}</p>}
          {body && <p className="text-sm text-ink/70 dark:text-white/70 mt-1">{body}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button disabled={pending} onClick={() => act("approved")} className="text-xs rounded bg-moss/15 text-moss px-2 py-1">Approve</button>
          <button disabled={pending} onClick={() => act("rejected")} className="text-xs rounded bg-rust/15 text-rust px-2 py-1">Reject</button>
        </div>
      </div>
    </li>
  );
}
