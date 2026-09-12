import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PortalLayout";
import { rupee, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [txns, setTxns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get("/students/me/transactions").then((r) => setTxns(r.data)).catch(() => {});
    api.get("/students/me/summary").then((r) => setSummary(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const topup = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/wallet/topup", { amount: Number(amount) });
      toast.success(`${rupee(data.amount)} added to your wallet`);
      setOpen(false); setAmount("100");
      await refreshUser();
      load();
    } catch (err) { toast.error(apiErrorMessage(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-5 w-full" data-testid="wallet-topup-btn"><Plus className="mr-2 h-4 w-4" />Add Money</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Top up your wallet</DialogTitle>
              <DialogDescription>Add money to pre-load container deposits. Simulated payment.</DialogDescription>
            </DialogHeader>
            <form onSubmit={topup} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 500].map((v) => (
                  <button type="button" key={v} onClick={() => setAmount(String(v))} data-testid={`topup-preset-${v}`}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold ${String(v) === amount ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50"}`}>
                    {rupee(v)}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amt">Amount (₹)</Label>
                <Input id="amt" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required data-testid="topup-amount" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-sky-400">
                <Smartphone className="h-4 w-4" /> Simulated UPI / card payment — no real money is charged.
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading} data-testid="topup-submit">{loading ? "Processing..." : `Add ${rupee(amount || 0)}`}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
