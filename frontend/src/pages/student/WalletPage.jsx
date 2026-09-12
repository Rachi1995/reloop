import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PortalLayout";
import { rupee, StatusBadge } from "@/components/StatusBadge";
import { Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function WalletPage() {
  const { user } = useAuth();
  const [txns, setTxns] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/students/me/transactions").then((r) => setTxns(r.data)).catch(() => {});
    api.get("/students/me/summary").then((r) => setSummary(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Wallet" subtitle="Refundable deposits and instant refunds" />

      <div className="mb-6 max-w-md overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 to-emerald-400/5 p-7 reloop-glow" data-testid="wallet-card">
        <div className="flex items-center justify-between">
          <Wallet className="h-7 w-7 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">ReLoop Wallet</span>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Available balance</p>
        <p className="font-display text-4xl font-extrabold text-primary" data-testid="wallet-balance">{rupee(summary?.wallet_balance ?? user?.wallet_balance)}</p>
        <p className="mt-4 font-mono text-sm text-muted-foreground">{user?.name} · {user?.student_code}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/40">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold">Wallet activity</h2>
        </div>
        {txns.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground" data-testid="wallet-empty">No wallet activity yet.</p>
        ) : (
          <ul className="divide-y divide-border" data-testid="wallet-txn-list">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.amount >= 0 ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                    {t.amount >= 0 ? <ArrowDownLeft className="h-5 w-5 text-emerald-400" /> : <ArrowUpRight className="h-5 w-5 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-semibold ${t.amount >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    {t.amount >= 0 ? "+" : ""}{rupee(Math.abs(t.amount)).replace("₹", t.amount >= 0 ? "₹" : "-₹")}
                  </p>
                  <StatusBadge status={t.transaction_type} className="mt-1" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
