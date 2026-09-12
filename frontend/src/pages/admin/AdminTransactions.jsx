import { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee, StatusBadge } from "@/components/StatusBadge";

export default function AdminTransactions() {
  const [txns, setTxns] = useState([]);
  useEffect(() => { api.get("/transactions").then((r) => setTxns(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader title="Transactions" subtitle="System-wide container issue & return ledger" />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
        <table className="w-full min-w-[720px] text-sm" data-testid="admin-transactions-table">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Container</th>
              <th className="px-5 py-3">Issued</th>
              <th className="px-5 py-3">Returned</th>
              <th className="px-5 py-3">Deposit</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {txns.map((t) => (
              <tr key={t.id} className="hover:bg-secondary/30">
                <td className="px-5 py-3 font-medium">{t.student_name}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{t.container_code}</td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(t.issued_at).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3 text-muted-foreground">{t.returned_at ? new Date(t.returned_at).toLocaleDateString("en-IN") : "—"}</td>
                <td className="px-5 py-3 font-mono">{rupee(t.deposit_amount)}</td>
                <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
            {txns.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
