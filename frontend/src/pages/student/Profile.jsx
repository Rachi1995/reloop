import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PortalLayout";
import { rupee } from "@/components/StatusBadge";
import { User, Mail, Phone, Hash, Wallet } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const rows = [
    { icon: User, label: "Full name", value: user?.name },
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Phone, label: "Phone", value: user?.phone || "—" },
    { icon: Hash, label: "Roll number", value: user?.student_code || "—" },
    { icon: Wallet, label: "Wallet balance", value: rupee(user?.wallet_balance) },
  ];
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your ReLoop account details" />
      <div className="max-w-xl rounded-2xl border border-border bg-card/40 p-6" data-testid="profile-card">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 font-display text-2xl font-extrabold text-primary">
            {user?.name?.[0]}
          </div>
          <div>
            <p className="font-display text-xl font-extrabold">{user?.name}</p>
            <p className="text-sm capitalize text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><r.icon className="h-4 w-4" />{r.label}</span>
              <span className="font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
