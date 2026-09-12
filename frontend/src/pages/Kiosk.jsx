import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "@/lib/api";
import { rupee } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Recycle, ArrowLeft, Nfc, Scale, CheckCircle2, Wallet, RotateCcw, Droplets, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["welcome", "select", "placing", "rfid", "weight", "success", "failed"];

export default function Kiosk() {
  const [step, setStep] = useState("welcome");
  const [returns, setReturns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scan, setScan] = useState(null);
  const [weight, setWeight] = useState(null);
  const [result, setResult] = useState(null);
  const [emptyMode, setEmptyMode] = useState(true);

  const loadReturns = async () => {
    try {
      const { data } = await api.get("/kiosk/available-returns");
      setReturns(data);
    } catch { setReturns([]); }
  };

  useEffect(() => { loadReturns(); }, []);

  const reset = () => {
    setStep("welcome"); setSelected(null); setScan(null); setWeight(null); setResult(null); setEmptyMode(true);
    loadReturns();
  };

  const chooseReturn = async (item) => {
    setSelected(item);
    setStep("placing");
    setTimeout(() => runRfid(item), 1400);
  };

  const runRfid = async (item) => {
    setStep("rfid");
    try {
      const { data } = await api.post("/rfid/scan", { rfid_uid: item.rfid_uid });
      setScan(data);
      setTimeout(() => setStep("weight"), 1600);
    } catch (e) {
      toast.error(apiErrorMessage(e.response?.data?.detail));
      reset();
    }
  };

  const runWeight = async () => {
    const container = scan.container;
    // simulate strain gauge reading: empty -> near expected, not empty -> heavier
    const measured = emptyMode
      ? Math.round((container.empty_weight + (Math.random() * 16 - 8)) * 10) / 10
      : Math.round((container.empty_weight + 120 + Math.random() * 60) * 10) / 10;
    setWeight(measured);
    setStep("verifying");
    try {
      const { data } = await api.post("/weight/verify", { container_id: container.id, measured_weight: measured });
      setResult(data);
      if (data.verified) {
        setStep("success");
        toast.success(`Deposit refunded ${rupee(data.refund_amount)}`);
      } else {
        setStep("failed");
      }
    } catch (e) {
      toast.error(apiErrorMessage(e.response?.data?.detail));
      reset();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060d0a] reloop-grain text-foreground">
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-[120px]" />

      <div className="absolute left-4 top-4 z-20">
        <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground" data-testid="kiosk-back">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit kiosk
        </Link>
      </div>
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> IoT Kiosk · Simulation
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Recycle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">ReLoop Return Kiosk</h1>
            <p className="text-sm text-muted-foreground">Smart Reusable Container Return System</p>
          </div>

          <div className="reloop-glass reloop-glow min-h-[420px] rounded-3xl p-8" data-testid="kiosk-screen">
            <AnimatePresence mode="wait">
              {step === "welcome" && (
                <Screen key="welcome">
                  <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
                    <span className="reloop-pulse-ring absolute inset-0 rounded-full border-2 border-primary/50" />
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15">
                      <Nfc className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h2 className="mb-2 text-center font-display text-2xl font-bold">Tap your Student ID</h2>
                  <p className="mb-6 text-center text-sm text-muted-foreground">Place your reusable container on the return platform to begin</p>
                  <Button className="w-full" size="lg" onClick={() => setStep("select")} data-testid="kiosk-start">
                    Start Return
                  </Button>
                </Screen>
              )}

              {step === "select" && (
                <Screen key="select">
                  <h2 className="mb-1 font-display text-xl font-bold">Select a container to return</h2>
                  <p className="mb-4 text-sm text-muted-foreground">Simulating currently issued RFID containers</p>
                  {returns.length === 0 ? (
                    <div className="rounded-xl border border-border bg-secondary/30 p-6 text-center text-sm text-muted-foreground" data-testid="kiosk-no-returns">
                      No issued containers to return right now. Issue one from the Canteen portal first.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {returns.map((r) => (
                        <button key={r.rfid_uid} onClick={() => chooseReturn(r)} data-testid={`kiosk-return-${r.rfid_uid}`}
                          className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 p-3 text-left hover:border-primary/50">
                          <div>
                            <p className="font-semibold">{r.container_code}</p>
                            <p className="font-mono text-xs text-muted-foreground">{r.rfid_uid} · {r.student_name}</p>
                          </div>
                          <span className="font-mono text-sm text-primary">{rupee(r.deposit_amount)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Screen>
              )}

              {step === "placing" && (
                <Screen key="placing">
                  <Center>
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                    <h2 className="font-display text-xl font-bold">Place container on the platform…</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selected?.container_code}</p>
                  </Center>
                </Screen>
              )}

              {step === "rfid" && (
                <Screen key="rfid">
                  <Center>
                    <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
                      <span className="reloop-pulse-ring absolute inset-0 rounded-full border-2 border-primary/50" />
                      <Nfc className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold">Reading RFID tag…</h2>
                    {scan && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-400" data-testid="kiosk-rfid-detected">
                        <CheckCircle2 className="h-4 w-4" /> {scan.container.container_code} detected
                      </p>
                    )}
                  </Center>
                </Screen>
              )}

              {step === "weight" && (
                <Screen key="weight">
                  <Center>
                    <Scale className="mb-3 h-12 w-12 text-primary" />
                    <h2 className="font-display text-xl font-bold">Weight verification</h2>
                    <p className="mb-1 mt-1 text-sm text-muted-foreground">
                      Expected empty weight: <span className="font-mono text-foreground">{scan?.expected_weight} g</span>
                    </p>
                    <div className="my-4 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2">
                      <label className="text-sm text-muted-foreground">Container is</label>
                      <button onClick={() => setEmptyMode(true)} data-testid="kiosk-empty-yes"
                        className={`rounded-lg px-3 py-1 text-sm font-semibold ${emptyMode ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>Empty ✓</button>
                      <button onClick={() => setEmptyMode(false)} data-testid="kiosk-empty-no"
                        className={`rounded-lg px-3 py-1 text-sm font-semibold ${!emptyMode ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground"}`}>Not empty</button>
                    </div>
                    <Button className="w-full" size="lg" onClick={runWeight} data-testid="kiosk-measure">
                      Measure & Verify
                    </Button>
                  </Center>
                </Screen>
              )}

              {step === "verifying" && (
                <Screen key="verifying">
                  <Center>
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                    <h2 className="font-display text-xl font-bold">Verifying…</h2>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">Measured: {weight} g</p>
                  </Center>
                </Screen>
              )}

              {step === "success" && (
                <Screen key="success">
                  <Center>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                      className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15">
                      <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                    </motion.div>
                    <h2 className="font-display text-2xl font-extrabold text-emerald-400">Return Successful</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Weight verified · {weight} g</p>
                    <div className="my-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3">
                      <Wallet className="h-5 w-5 text-emerald-400" />
                      <span className="font-display text-xl font-bold text-emerald-400" data-testid="kiosk-refund-amount">
                        {rupee(result?.refund_amount)} refunded
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Droplets className="h-3.5 w-3.5" /> Container sent to sanitization queue
                    </p>
                    <p className="mt-4 text-sm font-medium">Thank you for choosing ReLoop 🌱</p>
                    <Button variant="outline" className="mt-5 w-full" onClick={reset} data-testid="kiosk-done">
                      <RotateCcw className="mr-2 h-4 w-4" /> New Return
                    </Button>
                  </Center>
                </Screen>
              )}

              {step === "failed" && (
                <Screen key="failed">
                  <Center>
                    <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/15">
                      <Scale className="h-12 w-12 text-amber-400" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-amber-400">Weight mismatch</h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground" data-testid="kiosk-failed-msg">
                      Measured {weight} g vs expected {scan?.expected_weight} g. Please empty the container and retry.
                    </p>
                    <div className="mt-5 flex w-full gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setEmptyMode(true); setStep("weight"); }} data-testid="kiosk-retry">Retry</Button>
                      <Button variant="ghost" className="flex-1" onClick={reset}>Cancel</Button>
                    </div>
                  </Center>
                </Screen>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {["REUSE", "RETURN", "REFUND", "CLEAN"].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className={step === "success" ? "text-primary" : ""}>{s}</span>
                {i < 3 && <span>→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  );
}
function Center({ children }) {
  return <div className="flex flex-col items-center justify-center py-6 text-center">{children}</div>;
}
