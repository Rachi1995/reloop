import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { rupee } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BellRing, Clock, Send, PackageX, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function Alerts() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");

  const load = () => { api.get("/alerts/overdue").then((r) => setData(r.data)).catch(() => {}); };
  useEffect(load, []);

  const remind = async (t) => {
    setBusy(t.id);
    try { const { data } = await api.post("/alerts/remind", { transaction_id: t.id }); toast.success(`Reminder sent to ${data.student_name}`); load(); }
    catch (e) { toast.error(apiErrorMessage(e.response?.data?.detail)); }
    finally { setBusy(""); }
  };

  const markLost = async (t) => {
    setBusy(t.id);
    try { await api.post(`/containers/${t.container_id}/mark-lost`); toast.success(`${t.container_code} marked as lost`); load(); }
    catch (e) { toast.error(apiErrorMessage(e.response?.data?.detail)); }
    finally { setBusy(""); }
  };

  const overdue = data?.overdue || [];

  return (
    <div>
      <PageHeader
        title="Lost Container Alerts"
        subtitle={`Containers not returned within ${data?.threshold_hours ?? 48}h — nudge students or flag as lost`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MiniStat icon={ShieldAlert} label="Overdue containers" value={overdue.length} tint="text-amber-400" />
        <MiniStat icon={BellRing} label="Reminders sent" value={overdue.filter((o) => o.reminded).length} tint="text-sky-400" />
        <MiniStat icon={Clock} label="Threshold" value={`${data?.threshold_hours ?? 48}h`} tint="text-primary" />
      </div>

      {overdue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center" data-testid="alerts-empty">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
          <p className="font-display text-lg font-semibold">All clear</p>
          <p className="mt-1 text-sm text-muted-foreground">No containers are overdue right now.</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="alerts-list">
          {overdue.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5" data-testid={`alert-${t.id}`}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-display font-bold">{t.container_code} <span className="font-mono text-xs font-normal text-muted-foreground">{t.rfid_uid}</span></p>
                  <p className="text-sm text-muted-foreground">{t.student_name} · held {rupee(t.deposit_amount)} deposit</p>
                  <p className="mt-0.5 text-xs font-semibold text-amber-400">{t.hours_overdue}h overdue · issued {new Date(t.issued_at).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {t.reminded && <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400">Reminded</span>}
                <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => remind(t)} data-testid={`remind-${t.id}`}>
                  <Send className="mr-1.5 h-4 w-4" /> Remind
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" data-testid={`lost-${t.id}`}>
                      <PackageX className="mr-1.5 h-4 w-4" /> Mark Lost
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark {t.container_code} as lost?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This flags the container as Lost and closes its active transaction. The {rupee(t.deposit_amount)} deposit stays forfeited. This can't be undone here.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => markLost(t)} data-testid={`confirm-lost-${t.id}`}>Mark Lost</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tint }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <Icon className={`mb-2 h-5 w-5 ${tint}`} />
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
