import { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee } from "@/components/StatusBadge";
import { Leaf, Droplets, TrendingUp, Recycle, IndianRupee, Trash2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export default function Analytics() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/analytics/dashboard").then((r) => setD(r.data)).catch(() => {}); }, []);

  const impact = [
    { icon: Recycle, label: "Total reuse cycles", value: d?.total_returns ?? "—", tint: "text-primary" },
    { icon: Trash2, label: "Single-use avoided", value: d?.disposables_avoided ?? "—", tint: "text-emerald-400" },
    { icon: Droplets, label: "Plastic waste avoided", value: d ? `${d.waste_kg} kg` : "—", tint: "text-blue-400" },
    { icon: TrendingUp, label: "CO₂ emissions avoided", value: d ? `${d.co2_kg} kg` : "—", tint: "text-amber-400" },
    { icon: IndianRupee, label: "Packaging cost saved", value: d ? rupee(d.cost_saved) : "—", tint: "text-primary" },
    { icon: Leaf, label: "Return rate", value: d ? `${d.return_rate}%` : "—", tint: "text-emerald-400" },
  ];

  return (
    <div>
      <PageHeader title="Sustainability Analytics" subtitle="Measurable waste reduction & ESG impact — aligned with SDG 11/12/13" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {impact.map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card/40 p-6" data-testid={`impact-${m.label}`}>
            <m.icon className={`mb-3 h-6 w-6 ${m.tint}`} />
            <p className="font-display text-3xl font-extrabold">{m.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Daily issue vs return</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={d?.daily_activity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#122019", border: "1px solid #234032", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="issued" fill="#f59e0b" name="Issued" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" fill="#10b981" name="Returned" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Container reuse leaderboard</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={d?.top_reused || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="code" stroke="#9ca3af" fontSize={11} width={110} />
              <Tooltip contentStyle={{ background: "#122019", border: "1px solid #234032", borderRadius: 12 }} />
              <Bar dataKey="cycles" fill="#10b981" name="Reuse cycles" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-2"><Leaf className="h-5 w-5 text-emerald-400" /><h2 className="font-display text-lg font-bold">Circular economy summary</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">
          Every returned container replaces a single-use one. Across {d?.total_returns ?? 0} verified returns, ReLoop has diverted
          an estimated <span className="font-semibold text-foreground">{d?.waste_kg ?? 0} kg</span> of plastic waste and avoided
          <span className="font-semibold text-foreground"> {d?.co2_kg ?? 0} kg</span> of CO₂ — while saving canteens
          <span className="font-semibold text-foreground"> {d ? rupee(d.cost_saved) : rupee(0)}</span> in packaging costs.
        </p>
      </div>
    </div>
  );
}
