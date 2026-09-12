import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { StatusBadge, rupee } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Package, Nfc, Scale, Calendar, Monitor, Recycle } from "lucide-react";

export default function MyContainer() {
  const [data, setData] = useState(undefined);
  useEffect(() => { api.get("/students/me/container").then((r) => setData(r.data)).catch(() => setData(null)); }, []);

  return (
    <div>
      <PageHeader title="My Container" subtitle="The reusable container currently issued to you" />
      {data === undefined ? (
        <div className="h-40 animate-pulse rounded-2xl bg-card/40" />
      ) : !data?.container ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center" data-testid="no-container">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-display text-lg font-semibold">No active container</p>
          <p className="mt-1 text-sm text-muted-foreground">Order a meal in a ReLoop container to get started.</p>
        </div>
      ) : (
        <div className="max-w-2xl rounded-2xl border border-border bg-card/40 p-6" data-testid="container-detail">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-display text-xl font-extrabold">{data.container.container_code}</p>
                <p className="text-sm text-muted-foreground">{data.container.material} · {data.container.capacity}</p>
              </div>
            </div>
            <StatusBadge status={data.container.status} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Detail icon={Nfc} label="RFID tag" value={data.container.rfid_uid} mono />
            <Detail icon={Scale} label="Empty weight" value={`${data.container.empty_weight} g`} mono />
            <Detail icon={Recycle} label="Total reuse cycles" value={data.container.usage_count} />
            <Detail icon={Calendar} label="Issued on" value={new Date(data.transaction.issued_at).toLocaleString("en-IN")} />
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Refundable deposit held</p>
              <p className="font-display text-2xl font-extrabold text-amber-400">{rupee(data.transaction.deposit_amount)}</p>
            </div>
            <Link to="/kiosk">
              <Button data-testid="return-at-kiosk"><Monitor className="mr-2 h-4 w-4" /> Return at Kiosk</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value, mono }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className={`mt-1 font-semibold ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}
