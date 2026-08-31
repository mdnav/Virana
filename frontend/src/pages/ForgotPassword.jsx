import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { authForgotPassword, apiError } from "@/lib/api";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const data = await authForgotPassword(email.trim());
      setResult(data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <AuthShell title="Check your inbox" subtitle={result.message}>
        <div className="space-y-5" data-testid="forgot-success">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 flex items-start gap-3">
            <MailCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              In production the reset link is emailed. For this preview, use the button below to continue.
            </p>
          </div>
          {result.reset_token && (
            <button onClick={() => nav(`/reset-password?token=${result.reset_token}`)} data-testid="open-reset-link-btn"
              className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm hover:bg-primary/90 transition-colors">
              Open my reset link
            </button>
          )}
          <Link to="/login" className="block text-center text-sm text-gold hover:underline" data-testid="back-to-login-link">Back to Sign In</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll generate a secure reset link.">
      <form onSubmit={submit} className="space-y-5" data-testid="forgot-form">
        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-500 text-sm px-4 py-3" data-testid="forgot-error">{error}</div>}
        <div>
          <label className="caption block mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} data-testid="forgot-email-input" placeholder="you@example.com"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-colors" />
        </div>
        <button type="submit" disabled={loading} data-testid="forgot-submit-btn"
          className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send Reset Link
        </button>
        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-gold" data-testid="forgot-back-link">Back to Sign In</Link>
      </form>
    </AuthShell>
  );
}
