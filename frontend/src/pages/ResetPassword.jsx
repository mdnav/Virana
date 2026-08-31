import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { authResetPassword, apiError } from "@/lib/api";
import { toast } from "sonner";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) { setError("Password must be at least 8 characters and contain letters and numbers."); return; }
    if (pw !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await authResetPassword(token, pw);
      toast.success("Password updated. Sign in with your new password.");
      nav("/login");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing or malformed.">
        <Link to="/forgot-password" className="text-gold hover:underline text-sm" data-testid="request-new-link">Request a new reset link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password to secure your Virana account.">
      <form onSubmit={submit} className="space-y-5" data-testid="reset-form">
        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-500 text-sm px-4 py-3" data-testid="reset-error">{error}</div>}
        <div>
          <label className="caption block mb-1.5">New Password</label>
          <div className="relative">
            <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} data-testid="reset-password-input"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-gold transition-colors" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="caption block mb-1.5">Confirm New Password</label>
          <input type={show ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} data-testid="reset-confirm-input"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-colors" />
        </div>
        <button type="submit" disabled={loading} data-testid="reset-submit-btn"
          className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Password
        </button>
      </form>
    </AuthShell>
  );
}
