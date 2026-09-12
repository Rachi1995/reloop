import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PortalLayout";
import { StatusBadge, rupee } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Wallet, Package, Recycle, Leaf, Droplets, ArrowRight, Monitor, TrendingUp } from "lucide-react";

function StatCard({ icon: Icon, label, value, tint = "primary", testid }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5" data-testid={testid}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-${tint}/10`}>
        <Icon className={`h-5 w-5 text-${tint}`} />
      </div>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    api.get("/students/me/summary").then((r) => setSummary(r.data)).catch(() => {});
    api.get("/students/me/container").then((r) => setCurrent(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title={`Hi, ${user?.name?.split(" ")[0]} 👋`} subtitle="Your reusable container impact at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Wallet balance" value={rupee(summary?.wallet_balance)} testid="stat-wallet" />
        <StatCard icon={Recycle} label="Reuse cycles" value={summary?.reuse_cycles ?? "—"} testid="stat-cycles" />
        <StatCard icon={Package} label="Active containers" value={summary?.active_containers ?? "—"} testid="stat-active" />
        <StatCard icon={Leaf} label="Disposables avoided" value={summary?.disposables_avoided ?? "—"} testid="stat-avoided" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Current container */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Current container</h2>
            <Link to="/app/container"><Button variant="ghost" size="sm">Details <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
          {current?.container ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 p-5" data-testid="current-container">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{current.container.container_code}</p>
                  <p className="font-mono text-xs text-muted-foreground">{current.container.rfid_uid} · {current.container.capacity}</p>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={current.container.status} />
                <p className="mt-2 font-mono text-sm text-muted-foreground">Deposit {rupee(current.transaction.deposit_amount)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground" data-testid="no-current-container">
              No active container. Grab a meal in a ReLoop container from the canteen!
            </div>
          )}
          <Link to="/kiosk">
            <Button className="mt-4 w-full" variant="outline" data-testid="dashboard-return-btn">
              <Monitor className="mr-2 h-4 w-4" /> Return at Kiosk
            </Button>
          </Link>
        </div>

        {/* Impact */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-lg font-bold">Your green impact</h2>
          </div>
          <div className="space-y-4">
            <ImpactRow icon={Recycle} label="Reuse cycles" value={summary?.reuse_cycles ?? 0} />
            <ImpactRow icon={Droplets} label="Plastic waste avoided" value={`${summary?.waste_avoided_g ?? 0} g`} />
            <ImpactRow icon={TrendingUp} label="CO₂ emissions avoided" value={`${summary?.co2_avoided_g ?? 0} g`} />
          </div>
          <div className="mt-5 rounded-xl bg-emerald-500/10 p-4 text-center">
            <p className="font-display text-3xl font-extrabold text-emerald-400">{summary?.disposables_avoided ?? 0}</p>
            <p className="text-xs text-muted-foreground">single-use containers kept out of landfill</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4 text-emerald-400" />{label}</span>
      <span className="font-mono font-semibold text-foreground">{value}</span>
    </div>
  );
}
