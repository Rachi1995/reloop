import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Nfc, Scale, CheckCircle2, PackageCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function ReturnContainer() {
  const [issued, setIssued] = useState([]);
  const [rfid, setRfid] = useState("");
  const [scan, setScan] = useState(null);
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => { api.get("/kiosk/available-returns").then((r) => setIssued(r.data)).catch(() => {}); };
  useEffect(load, []);

  const doScan = async (uid) => {
    setResult(null); setScan(null);
    try {
      const { data } = await api.post("/rfid/scan", { rfid_uid: uid });
      setScan(data);
      setWeight(String(data.expected_weight));
      toast.success(`${data.container.container_code} verified via RFID`);
    } catch (e) { toast.error(apiErrorMessage(e.response?.data?.detail)); }
  };

  const doVerify = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/weight/verify", { container_id: scan.container.id, measured_weight: Number(weight) });
      setResult(data);
      if (data.verified) { toast.success(`Refunded ${rupee(data.refund_amount)}`); setScan(null); setRfid(""); load(); }
      else toast.error(data.message);
    } catch (e) { toast.error(apiErrorMessage(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Return Container" subtitle="Process a return manually — RFID scan then weight verification" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Nfc className="h-5 w-5 text-primary" /> Step 1 · Scan RFID</h2>
          <div className="space-y-1.5">
            <Label>Issued container</Label>
            <Select value={rfid} onValueChange={(v) => { setRfid(v); doScan(v); }}>
              <SelectTrigger data-testid="return-rfid-select"><SelectValue placeholder="Select issued container" /></SelectTrigger>
              <SelectContent>
                {issued.map((i) => (
                  <SelectItem key={i.rfid_uid} value={i.rfid_uid} data-testid={`return-opt-${i.rfid_uid}`}>{i.container_code} · {i.student_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {issued.length === 0 && <p className="text-xs text-muted-foreground">No issued containers awaiting return.</p>}
          </div>

          {scan && (
            <div className="mt-6" data-testid="return-scan-result">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-400"><CheckCircle2 className="h-4 w-4" /> RFID matched</p>
                <p className="mt-2 text-sm">{scan.container.container_code} · held by {scan.student_name}</p>
                <p className="font-mono text-xs text-muted-foreground">Expected empty weight: {scan.expected_weight} g · Deposit {rupee(scan.deposit_amount)}</p>
              </div>
              <h2 className="mb-3 mt-6 flex items-center gap-2 font-display text-lg font-bold"><Scale className="h-5 w-5 text-primary" /> Step 2 · Weight (g)</h2>
              <div className="flex gap-2">
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono" data-testid="return-weight-input" />
                <Button onClick={doVerify} disabled={busy} data-testid="return-verify"><PackageCheck className="mr-2 h-4 w-4" />Verify</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Tip: enter a value within ±tolerance of {scan.expected_weight} g to pass.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Result</h2>
          {!result ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Scan and verify a container to see the outcome
            </div>
          ) : result.verified ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center" data-testid="return-success">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
              <p className="font-display text-xl font-bold text-emerald-400">Return verified</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span className="font-mono font-semibold text-emerald-400">{rupee(result.refund_amount)} refunded to {result.student_name}</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Container moved to washing queue.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center" data-testid="return-failed">
              <Scale className="mx-auto mb-3 h-12 w-12 text-amber-400" />
              <p className="font-display text-lg font-bold text-amber-400">Weight mismatch</p>
              <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
