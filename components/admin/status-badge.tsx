const COLORS: Record<string, string> = {
  draft: "bg-sand text-ink/70 dark:bg-white/10 dark:text-white/70",
  published: "bg-moss/15 text-moss",
  archived: "bg-ink/10 text-ink/50 dark:bg-white/5 dark:text-white/40",
  pending: "bg-sand text-ink/70 dark:bg-white/10 dark:text-white/70",
  confirmed: "bg-accent/15 text-accent",
  processing: "bg-accent/15 text-accent",
  shipped: "bg-accent/15 text-accent",
  delivered: "bg-moss/15 text-moss",
  cancelled: "bg-rust/15 text-rust",
  returned: "bg-rust/15 text-rust",
  refunded: "bg-rust/15 text-rust",
  paid: "bg-moss/15 text-moss",
  failed: "bg-rust/15 text-rust",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${COLORS[status] ?? "bg-sand"}`}>
      {status}
    </span>
  );
}
