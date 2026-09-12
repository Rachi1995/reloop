import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Save, IndianRupee, Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/settings").then((r) => setS(r.data)).catch(() => {}); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/settings", {
        deposit_amount: Number(s.deposit_amount),
        weight_tolerance: Number(s.weight_tolerance),
        disposable_cost: Number(s.disposable_cost),
      });
      setS(data);
      toast.success("Settings saved");
    } catch (err) { toast.error(apiErrorMessage(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  if (!s) return <div className="h-40 animate-pulse rounded-2xl bg-card/40" />;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });

  const fields = [
    { k: "deposit_amount", label: "Default refundable deposit (₹)", icon: IndianRupee, hint: "Amount held per container and refunded on return." },
    { k: "weight_tolerance", label: "Weight tolerance (± grams)", icon: Scale, hint: "Allowed deviation between measured and expected empty weight." },
    { k: "disposable_cost", label: "Single-use container cost (₹)", icon: Trash2, hint: "Used to compute packaging cost savings." },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure deposit, verification tolerance & cost model" />
      <form onSubmit={save} className="max-w-xl rounded-2xl border border-border bg-card/40 p-6" data-testid="settings-form">
        <div className="mb-5 flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-bold">System configuration</h2></div>
        <div className="space-y-5">
          {fields.map((f) => (
            <div key={f.k} className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><f.icon className="h-4 w-4" />{f.label}</Label>
              <Input type="number" step="0.01" value={s[f.k]} onChange={set(f.k)} data-testid={`setting-${f.k}`} />
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
          <Button type="submit" disabled={saving} data-testid="settings-save"><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save settings"}</Button>
        </div>
      </form>
    </div>
  );
}
