import { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee, StatusBadge } from "@/components/StatusBadge";
import { Package, CheckCircle2 } from "lucide-react";

export default function ReturnHistory() {
  const [returns, setReturns] = useState([]);
  useEffect(() => { api.get("/students/me/returns").then((r) => setReturns(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader title="Return History" subtitle="Containers you've returned and refunds received" />
      {returns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground" data-testid="returns-empty">
          No returns yet. Return a container at the kiosk to see it here.
        </div>
      ) : (
        <div className="relative space-y-3 border-l border-border pl-6" data-testid="returns-timeline">
          {returns.map((r) => (
            <div key={r.id} className="relative rounded-2xl border border-border bg-card/40 p-5">
              <span className="absolute -left-[31px] top-6 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold">{r.container_code}</p>
                    <p className="text-xs text-muted-foreground">Returned {new Date(r.returned_at).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-emerald-400">+{rupee(r.refund_amount)}</p>
                  <StatusBadge status={r.status} className="mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
