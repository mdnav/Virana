import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      nav(location.state?.from || "/my-virana");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={<>Welcome back to <span className="italic text-gold">Virana</span></>} subtitle="Continue your journey through India's living heritage.">
      <form onSubmit={submit} className="space-y-5" data-testid="login-form">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-500 text-sm px-4 py-3" data-testid="login-error">{error}</div>
        )}
        <div>
          <label className="caption block mb-1.5">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            data-testid="login-email-input" placeholder="you@example.com" autoComplete="email"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-colors"
          />
        </div>
        <div>
          <label className="caption block mb-1.5">Password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              data-testid="login-password-input" placeholder="••••••••" autoComplete="current-password"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-gold transition-colors"
            />
            <button type="button" onClick={() => setShow(!show)} data-testid="login-toggle-password" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} data-testid="login-remember-checkbox" className="accent-[#E89B17]" />
            Remember me
          </label>
          <Link to="/forgot-password" data-testid="forgot-password-link" className="text-gold hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} data-testid="login-submit-btn"
          className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Signing you in..." : "Sign In"}
        </button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>
        <button type="button" disabled data-testid="google-signin-btn"
          title="Google sign-in coming soon"
          className="w-full border border-border bg-card rounded-full py-3 font-semibold text-sm text-muted-foreground cursor-not-allowed flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81"/></svg>
          Continue with Google (coming soon)
        </button>

        <p className="text-sm text-center text-muted-foreground">
          Don't have an account? <Link to="/signup" data-testid="goto-signup-link" className="text-gold hover:underline font-semibold">Create one</Link>
        </p>
        <p className="text-xs text-center text-muted-foreground/70">Demo account: demo@virana.in · Virana@123</p>
      </form>
    </AuthShell>
  );
}
