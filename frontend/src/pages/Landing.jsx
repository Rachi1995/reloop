import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Recycle, ArrowRight, Nfc, Scale, Wallet, Droplets, RotateCcw, Leaf,
  ShieldCheck, BarChart3, Monitor, TrendingDown, Boxes, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/14a4cdfd-b5ca-43ae-8f9e-0efc658275e8/images/f424b1e796e4ddba8c457fbf5303232ec643c9b8672126344d817e183a5bb001.jpeg";

const LOOP = [
  { icon: RotateCcw, label: "REUSE", desc: "Food served in an RFID-tagged reusable container" },
  { icon: Nfc, label: "RETURN", desc: "Drop it at the smart kiosk — RFID + weight verified" },
  { icon: Wallet, label: "REFUND", desc: "Deposit instantly credited to your digital wallet" },
  { icon: Droplets, label: "CLEAN", desc: "Sanitized and recirculated into the loop" },
];

const SDG = [
  { n: "12", title: "Responsible Consumption", color: "#BF8B2E", desc: "Closing the loop on single-use campus packaging." },
  { n: "13", title: "Climate Action", color: "#3F7E44", desc: "Cutting emissions from plastic production & disposal." },
  { n: "11", title: "Sustainable Cities", color: "#FD9D24", desc: "Circular campus ecosystems via IoT kiosks." },
];

const FEATURES = [
  { icon: Nfc, title: "RFID Container Tracking", desc: "Every container carries a unique RFID tag tracked across its full lifecycle." },
  { icon: Scale, title: "Weight Verification", desc: "Dual RFID + load-cell verification cuts false returns by ~70%." },
  { icon: Wallet, title: "Digital Deposit Wallet", desc: "Refundable ₹30 deposits credited instantly on verified return." },
  { icon: ShieldCheck, title: "Fraud-Resistant", desc: "Closed-loop validation prevents duplicate and invalid returns." },
  { icon: BarChart3, title: "Impact Analytics", desc: "Return rate, waste avoided, and ESG metrics in real time." },
  { icon: Monitor, title: "IoT Kiosk Simulator", desc: "Full hardware flow simulated end-to-end — no rig required." },
];

const STATS = [
  { icon: TrendingDown, value: "60–80%", label: "Single-use containers avoided" },
  { icon: Boxes, value: "10,000", label: "Fewer containers / month (500-meal canteen)" },
  { icon: Leaf, value: "40–50%", label: "Projected packaging cost savings" },
  { icon: ShieldCheck, value: "98%", label: "RFID identification accuracy" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Recycle className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight">ReLoop</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/kiosk"><Button variant="ghost" size="sm" data-testid="nav-kiosk-btn"><Monitor className="mr-1.5 h-4 w-4" />Kiosk Demo</Button></Link>
            <Link to="/login"><Button variant="ghost" size="sm" data-testid="nav-login-btn">Sign in</Button></Link>
            <Link to="/register"><Button size="sm" data-testid="nav-register-btn">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden reloop-grain">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-[130px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> YESIST12 2026 · Smart Reusable Container System
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Close the loop on <span className="text-primary">single-use</span> food packaging
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              ReLoop pairs RFID-tagged reusable containers with a smart return kiosk and an incentive-driven
              digital wallet — making sustainable campus dining automatic, trackable, and rewarding.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button size="lg" data-testid="hero-get-started">Start Reusing <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link to="/kiosk"><Button size="lg" variant="outline" data-testid="hero-kiosk">Try the Kiosk <Monitor className="ml-2 h-4 w-4" /></Button></Link>
            </motion.div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> ₹30 refundable deposit</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Instant refunds</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Real-time ESG data</span>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
            className="relative">
            <div className="reloop-glow overflow-hidden rounded-3xl border border-border">
              <img src={HERO_IMG} alt="Reusable food containers" className="h-full w-full object-cover" />
            </div>
            <div className="reloop-glass reloop-float absolute -bottom-5 -left-5 rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">This container</p>
              <p className="font-display text-lg font-bold text-primary">reused 42×</p>
            </div>
            <div className="reloop-glass absolute -right-4 top-6 rounded-2xl p-3">
              <Nfc className="h-6 w-6 text-primary" />
              <p className="mt-1 font-mono text-xs">RFID-8942</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Loop */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">The circular economy loop</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            REUSE → RETURN → REFUND → CLEAN
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="reloop-glass relative rounded-2xl p-6" data-testid={`loop-step-${s.label}`}>
              <span className="absolute right-5 top-5 font-display text-3xl font-extrabold text-primary/15">{i + 1}</span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold tracking-wide">{s.label}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <s.icon className="mx-auto mb-3 h-6 w-6 text-primary sm:mx-0" />
              <p className="font-display text-3xl font-extrabold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Platform</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Hardware automation meets a digital incentive system
          </h2>
          <p className="mt-3 text-muted-foreground">
            A closed-loop ecosystem combining IoT kiosks with a cloud platform for students, canteen staff and administrators.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card/40 p-6 transition-colors hover:border-primary/40">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SDG */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="reloop-glass rounded-3xl p-8 lg:p-12">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">UN Sustainable Development Goals</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Aligned with global sustainability targets</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {SDG.map((g) => (
              <div key={g.n} className="rounded-2xl border border-border bg-background/40 p-6" data-testid={`sdg-${g.n}`}>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl font-display text-xl font-extrabold text-white"
                  style={{ backgroundColor: g.color }}>{g.n}</div>
                <h3 className="font-display text-base font-bold">SDG {g.n} · {g.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 p-10 text-center lg:p-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
          <Recycle className="mx-auto mb-4 h-10 w-10 text-primary reloop-spin-slow" />
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl lg:text-4xl">Ready to join the loop?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sign in as a student, canteen staff, or administrator and explore the full ReLoop platform.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button size="lg" data-testid="cta-register">Create free account</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline" data-testid="cta-login">Explore demo accounts</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Recycle className="h-4 w-4 text-primary" />
            <span className="font-display font-bold text-foreground">ReLoop</span>
            <span>· Smart Reusable Container Return System</span>
          </div>
          <p>Circular economy for campus dining · YESIST12 2026</p>
        </div>
      </footer>
    </div>
  );
}
