import { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/students").then((r) => setStudents(r.data)).catch(() => {}); }, []);

  const shown = students.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    (s.student_code || "").toLowerCase().includes(q.toLowerCase()) ||
    s.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Students" subtitle={`${students.length} registered students`} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="pl-9" data-testid="student-search" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
        <table className="w-full text-sm" data-testid="students-table">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Roll No.</th>
              <th className="px-5 py-3 hidden sm:table-cell">Email</th>
              <th className="px-5 py-3 text-right">Wallet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((s) => (
              <tr key={s.id} className="hover:bg-secondary/30" data-testid={`student-row-${s.id}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-display font-bold text-primary">{s.name[0]}</span>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-muted-foreground">{s.student_code || "—"}</td>
                <td className="px-5 py-3 hidden text-muted-foreground sm:table-cell">{s.email}</td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-primary">{rupee(s.wallet_balance)}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No students found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
