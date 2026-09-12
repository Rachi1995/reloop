import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PackagePlus, User, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function IssueContainer() {
  const [students, setStudents] = useState([]);
  const [containers, setContainers] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [containerId, setContainerId] = useState("");
  const [deposit, setDeposit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const load = () => {
    api.get("/students").then((r) => setStudents(r.data)).catch(() => {});
    Promise.all([api.get("/containers?status=Available"), api.get("/containers?status=Ready")])
      .then(([a, b]) => setContainers([...a.data, ...b.data])).catch(() => {});
    api.get("/settings").then((r) => setDeposit(r.data.deposit_amount)).catch(() => {});
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/containers/issue", { student_id: studentId, container_id: containerId, deposit_amount: Number(deposit) });
      setDone(data);
      toast.success(`Container ${data.container_code} issued`);
      setStudentId(""); setContainerId("");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err.response?.data?.detail));
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Issue Container" subtitle="Assign a reusable container and record the refundable deposit" />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card/40 p-6" data-testid="issue-form">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><User className="h-4 w-4" /> Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger data-testid="issue-student-select"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} data-testid={`student-opt-${s.id}`}>{s.name} · {s.student_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Package className="h-4 w-4" /> Available container</Label>
              <Select value={containerId} onValueChange={setContainerId}>
                <SelectTrigger data-testid="issue-container-select"><SelectValue placeholder="Select container" /></SelectTrigger>
                <SelectContent>
                  {containers.map((c) => (
                    <SelectItem key={c.id} value={c.id} data-testid={`container-opt-${c.id}`}>{c.container_code} · {c.rfid_uid}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {containers.length === 0 && <p className="text-xs text-amber-400">No available containers. Clean some from the washing queue.</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Refundable deposit (₹)</Label>
              <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" data-testid="issue-deposit" />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !studentId || !containerId} data-testid="issue-submit">
              <PackagePlus className="mr-2 h-4 w-4" /> {loading ? "Issuing..." : "Issue Container"}
            </Button>
          </div>
        </form>

        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="mb-4 font-display text-lg font-bold">How it works</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {["Student orders a meal at the canteen", "Staff selects student + scans/selects an RFID container",
              "₹" + deposit + " refundable deposit is recorded", "Container status becomes Issued",
              "Deposit is refunded automatically on verified kiosk return"].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          {done && (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4" data-testid="issue-success">
              <p className="flex items-center gap-2 font-semibold text-emerald-400"><CheckCircle2 className="h-5 w-5" /> Issued successfully</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>{done.student_name} · {done.container_code}</span>
                <StatusBadge status="Issued" />
              </div>
              <p className="mt-1 font-mono text-sm text-muted-foreground">Deposit held: {rupee(done.deposit_amount)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
