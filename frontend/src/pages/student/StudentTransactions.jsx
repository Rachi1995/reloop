import { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee, StatusBadge } from "@/components/StatusBadge";

export default function StudentTransactions() {
  const [txns, setTxns] = useState([]);
  useEffect(() => { api.get("/students/me/transactions").then((r) => setTxns(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Every deposit and refund on your account" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
        <table className="w-full text-sm" data-testid="transactions-table">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {txns.map((t) => (
              <tr key={t.id} className="hover:bg-secondary/30">
                <td className="px-5 py-3"><StatusBadge status={t.transaction_type} /></td>
                <td className="px-5 py-3 text-muted-foreground">{t.description}</td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                <td className={`px-5 py-3 text-right font-mono font-semibold ${t.amount >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {t.amount >= 0 ? "+" : "-"}{rupee(Math.abs(t.amount))}
                </td>
              </tr>
            ))}
            {txns.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
