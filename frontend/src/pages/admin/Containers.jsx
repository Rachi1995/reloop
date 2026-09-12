import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Nfc, Trash2 } from "lucide-react";
import { toast } from "sonner";

const FILTERS = ["All", "Available", "Issued", "Washing", "Ready", "Lost", "Damaged"];

export default function Containers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [containers, setContainers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ container_code: "", rfid_uid: "", capacity: "500ml", material: "Food-grade PP", empty_weight: 240 });

  const load = () => { api.get("/containers").then((r) => setContainers(r.data)).catch(() => {}); };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/containers", { ...form, empty_weight: Number(form.empty_weight) });
      toast.success("Container registered");
      setOpen(false); setForm({ container_code: "", rfid_uid: "", capacity: "500ml", material: "Food-grade PP", empty_weight: 240 });
      load();
    } catch (err) { toast.error(apiErrorMessage(err.response?.data?.detail)); }
  };

  const remove = async (id) => {
    try { await api.delete(`/containers/${id}`); toast.success("Container deleted"); load(); }
    catch (err) { toast.error(apiErrorMessage(err.response?.data?.detail)); }
  };

  const shown = filter === "All" ? containers : containers.filter((c) => c.status === filter);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader
        title="Containers"
        subtitle={`${containers.length} RFID-tagged reusable containers in circulation`}
        action={isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="add-container-btn"><Plus className="mr-2 h-4 w-4" />Register</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register container</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-4">
                <div className="space-y-1.5"><Label>Container code</Label><Input value={form.container_code} onChange={set("container_code")} placeholder="GreenBowl-9001" required data-testid="new-code" /></div>
                <div className="space-y-1.5"><Label>RFID UID</Label><Input value={form.rfid_uid} onChange={set("rfid_uid")} placeholder="RFID-9001" required data-testid="new-rfid" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Capacity</Label><Input value={form.capacity} onChange={set("capacity")} data-testid="new-capacity" /></div>
                  <div className="space-y-1.5"><Label>Empty weight (g)</Label><Input type="number" value={form.empty_weight} onChange={set("empty_weight")} data-testid="new-weight" /></div>
                </div>
                <div className="space-y-1.5"><Label>Material</Label><Input value={form.material} onChange={set("material")} data-testid="new-material" /></div>
                <DialogFooter><Button type="submit" data-testid="new-submit">Register</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === f ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="containers-grid">
        {shown.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Nfc className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="font-display font-bold">{c.container_code}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.rfid_uid}</p>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{c.capacity} · {c.empty_weight}g</span>
              <span className="font-mono">{c.usage_count} cycles</span>
            </div>
            {c.current_holder_name && <p className="mt-2 text-xs text-amber-400">Held by {c.current_holder_name}</p>}
            {isAdmin && c.status === "Available" && (
              <Button variant="ghost" size="sm" className="mt-3 text-destructive hover:text-destructive" onClick={() => remove(c.id)} data-testid={`delete-${c.id}`}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        ))}
        {shown.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No containers in this status.</p>}
      </div>
    </div>
  );
}
