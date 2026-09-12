import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { rupee } from "@/components/StatusBadge";
import {
  LayoutDashboard, Package, Wallet, ArrowLeftRight, History, User, Recycle,
  PackagePlus, PackageCheck, Users, Droplets, BarChart3, Settings, LogOut, Menu, X, Monitor,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STUDENT_NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true, tid: "nav-dashboard" },
  { to: "/app/container", label: "My Container", icon: Package, tid: "nav-my-container" },
  { to: "/app/wallet", label: "Wallet", icon: Wallet, tid: "nav-wallet" },
  { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight, tid: "nav-transactions" },
  { to: "/app/returns", label: "Return History", icon: History, tid: "nav-returns" },
  { to: "/app/profile", label: "Profile", icon: User, tid: "nav-profile" },
];

const ADMIN_NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true, tid: "nav-dashboard" },
  { to: "/app/issue", label: "Issue Container", icon: PackagePlus, tid: "nav-issue" },
  { to: "/app/return", label: "Return Container", icon: PackageCheck, tid: "nav-return" },
  { to: "/app/containers", label: "Containers", icon: Package, tid: "nav-containers" },
  { to: "/app/students", label: "Students", icon: Users, tid: "nav-students" },
  { to: "/app/all-transactions", label: "Transactions", icon: ArrowLeftRight, tid: "nav-all-transactions" },
  { to: "/app/cleaning", label: "Cleaning", icon: Droplets, tid: "nav-cleaning" },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, tid: "nav-analytics" },
];

export function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isStudent = user?.role === "student";
  let nav = isStudent ? STUDENT_NAV : ADMIN_NAV;
  if (user?.role === "admin") nav = [...ADMIN_NAV, { to: "/app/settings", label: "Settings", icon: Settings, tid: "nav-settings" }];

  const handleLogout = async () => { await logout(); navigate("/"); };

  const NavItems = () => (
    <nav className="flex flex-col gap-1 px-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          data-testid={item.tid}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )
          }
        >
          <item.icon className="h-[18px] w-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-border bg-card/40 backdrop-blur-xl transition-transform lg:flex lg:translate-x-0",
          open ? "flex translate-x-0" : "hidden -translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <button onClick={() => navigate("/app")} className="flex items-center gap-2" data-testid="sidebar-logo">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Recycle className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight">ReLoop</span>
          </button>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <div className="mx-6 mb-4 rounded-xl border border-border bg-secondary/40 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{user?.role}</p>
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          {isStudent && (
            <p className="mt-1 font-mono text-sm text-primary" data-testid="sidebar-balance">{rupee(user?.wallet_balance)}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto pb-4"><NavItems /></div>
        <div className="border-t border-border p-3 space-y-1">
          <NavLink to="/kiosk" data-testid="nav-kiosk"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Monitor className="h-[18px] w-[18px]" /> Kiosk Simulator
          </NavLink>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" /> Log out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} data-testid="menu-toggle"><Menu className="h-5 w-5" /></Button>
          <span className="font-display font-extrabold">ReLoop</span>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
