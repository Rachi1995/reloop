import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Droplets, CheckCircle2, Sparkles, PackageOpen } from "lucide-react";
import { toast } from "sonner";

export default function Cleaning() {
  const [pending, setPending] = useState([]);
  const [ready, setReady] = useState([]);
  const [busy, setBusy] = useState("");

  const load = () => {
    api.get("/cleaning/pending").then((r) => setPending(r.data)).catch(() => {});
    api.get("/containers?status=Ready").then((r) => setReady(r.data)).catch(() => {});
  };
  useEffect(load, []);

  const clean = async (id) => {
    setBusy(id);
    try { await api.post(`/cleaning/${id}/complete`); toast.success("Container sanitized & ready"); load(); }
    catch (e) { toast.error(apiErrorMessage(e.response?.data?.detail)); }
    finally { setBusy(""); }
  };

  const makeAvailable = async (id) => {
    setBusy(id);
    try { await api.post(`/containers/${id}/mark-available`); toast.success("Container back in circulation"); load(); }
    catch (e) { toast.error(apiErrorMessage(e.response?.data?.detail)); }
    finally { setBusy(""); }
  };

  return (
    <div>
      <PageHeader title="Cleaning & Sanitization" subtitle="Wash returned containers and recirculate them into the loop" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Droplets className="h-5 w-5 text-purple-400" /> Washing queue ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground" data-testid="washing-empty">Queue is clear. Nothing to wash.</p>
          ) : (
            <div className="space-y-2" data-testid="washing-queue">
              {pending.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-3">
                  <div>
                    <p className="font-semibold">{c.container_code}</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.rfid_uid}</p>
                  </div>
                  <Button size="sm" disabled={busy === c.id} onClick={() => clean(c.id)} data-testid={`clean-${c.id}`}>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Mark Clean
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><CheckCircle2 className="h-5 w-5 text-teal-400" /> Ready to recirculate ({ready.length})</h2>
          {ready.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground" data-testid="ready-empty">No cleaned containers waiting.</p>
          ) : (
            <div className="space-y-2" data-testid="ready-queue">
              {ready.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-3">
                  <div>
                    <p className="font-semibold">{c.container_code}</p>
                    <p className="font-mono text-xs text-muted-foreground">Cleaned · {c.usage_count} cycles</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => makeAvailable(c.id)} data-testid={`available-${c.id}`}>
                    <PackageOpen className="mr-1.5 h-4 w-4" /> Set Available
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
