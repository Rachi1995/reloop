import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recycle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const DEMO = [
  { role: "Admin", email: "admin@reloop.io", password: "Admin@123" },
  { role: "Staff", email: "staff@reloop.io", password: "Staff@123" },
  { role: "Student", email: "arjun@campus.edu", password: "Student@123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate("/app");
    } catch (err) {
      setError(apiErrorMessage(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quick = (d) => { setEmail(d.email); setPassword(d.password); };

  return (
    <div className="flex min-h-screen items-center justify-center reloop-grain px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="back-home">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="reloop-glass reloop-glow rounded-3xl p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Recycle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold">Sign in to ReLoop</h1>
              <p className="text-xs text-muted-foreground">Smart Reusable Container System</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu" required data-testid="login-email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required data-testid="login-password" />
            </div>
            {error && <p className="text-sm text-destructive" data-testid="login-error">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New student?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline" data-testid="link-register">Create account</Link>
          </p>

          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Quick demo login</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <button key={d.role} onClick={() => quick(d)} data-testid={`demo-${d.role.toLowerCase()}`}
                  className="rounded-lg border border-border bg-secondary/40 px-2 py-2 text-xs font-semibold hover:border-primary/50 hover:text-primary">
                  {d.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
