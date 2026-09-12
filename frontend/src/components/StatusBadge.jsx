import { cn } from "@/lib/utils";

const STYLES = {
  Available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Issued: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Returned: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Refunded: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Washing: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Ready: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  Lost: "bg-red-500/10 text-red-400 border-red-500/30",
  Damaged: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  Deposit: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Refund: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Topup: "bg-sky-500/10 text-sky-400 border-sky-500/30",
};

export function StatusBadge({ status, className }) {
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status] || "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
