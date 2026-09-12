import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Package, Users, Recycle, Droplets, Leaf, TrendingUp, PackagePlus, PackageCheck,
  ArrowRight, Boxes, IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#a855f7", "#14b8a6", "#ef4444", "#f43f5e"];

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/analytics/dashboard").then((r) => setD(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time container circulation & sustainability impact"
        action={
          <div className="flex gap-2">
            <Link to="/app/issue"><Button data-testid="quick-issue"><PackagePlus className="mr-2 h-4 w-4" />Issue</Button></Link>
            <Link to="/app/return"><Button variant="outline" data-testid="quick-return"><PackageCheck className="mr-2 h-4 w-4" />Return</Button></Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Boxes} label="Total containers" value={d?.total_containers ?? "—"} testid="stat-total" />
        <Stat icon={Package} label="Currently issued" value={d?.issued ?? "—"} tint="amber" testid="stat-issued" />
        <Stat icon={Droplets} label="In washing queue" value={d?.washing ?? "—"} tint="purple" testid="stat-washing" />
        <Stat icon={Users} label="Students" value={d?.total_students ?? "—"} testid="stat-students" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Recycle} label="Return rate" value={d ? `${d.return_rate}%` : "—"} testid="stat-return-rate" />
        <Stat icon={Leaf} label="Disposables avoided" value={d?.disposables_avoided ?? "—"} testid="stat-disposables" />
        <Stat icon={TrendingUp} label="CO₂ avoided" value={d ? `${d.co2_kg} kg` : "—"} testid="stat-co2" />
        <Stat icon={IndianRupee} label="Packaging cost saved" value={d ? rupee(d.cost_saved) : "—"} testid="stat-cost-saved" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Container activity (last 7 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d?.daily_activity || []}>
              <defs>
                <linearGradient id="gIssued" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                <linearGradient id="gReturned" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#122019", border: "1px solid #234032", borderRadius: 12 }} />
              <Area type="monotone" dataKey="issued" stroke="#f59e0b" fill="url(#gIssued)" name="Issued" />
              <Area type="monotone" dataKey="returned" stroke="#10b981" fill="url(#gReturned)" name="Returned" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Container status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={d?.status_distribution || []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                {(d?.status_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#122019", border: "1px solid #234032", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {(d?.status_distribution || []).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.name}</span>
                <span className="font-mono text-muted-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Most reused containers</h2>
          <Link to="/app/containers"><Button variant="ghost" size="sm">All containers <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(d?.top_reused || []).map((c) => (
            <div key={c.code} className="rounded-xl border border-border bg-secondary/30 p-4 text-center">
              <p className="font-display text-2xl font-extrabold text-primary">{c.cycles}×</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{c.code}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint = "primary", testid }) {
  const tintMap = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5" data-testid={testid}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tintMap[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
