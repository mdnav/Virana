import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle2, Copy } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { LANGUAGES } from "@/lib/i18n";
import { toast } from "sonner";

const HOLI_IMG = "https://static.prod-images.emergentagent.com/jobs/f4c46e26-5f92-4e0f-a80a-c173853e8734/images/99761208f39d86de1028b0a99753198a2d34f7071aaa24ee2c77a68ac1565b0a.jpeg";

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm_password: "", preferred_language: "en" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyToken, setVerifyToken] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const s = strength(form.password);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim()) { setError("Please enter your full name."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) { setError("Please enter a valid email address."); return; }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError("Password must be at least 8 characters and contain letters and numbers."); return;
    }
    if (form.password !== form.confirm_password) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const data = await register({ ...form, email: form.email.trim() });
      setVerifyToken(data.verification_token);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (verifyToken) {
    const link = `/verify-email?token=${verifyToken}`;
    return (
      <AuthShell image={HOLI_IMG} title="Account created" subtitle="One last step — verify your email to unlock your full Virana experience.">
        <div className="space-y-5" data-testid="signup-success">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-emerald-500">Welcome to Virana!</div>
              <p className="text-muted-foreground mt-1">
                In production this link is emailed to you. For this preview, your verification link is shown below.
              </p>
            </div>
          </div>
          <button
            onClick={() => nav(link)}
            data-testid="verify-email-now-btn"
            className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm hover:bg-primary/90 transition-colors">
            Verify my email now
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.origin + link); toast("Verification link copied"); }}
            data-testid="copy-verify-link-btn"
            className="w-full border border-border bg-card rounded-full py-3 text-sm flex items-center justify-center gap-2 hover:border-gold">
            <Copy className="w-4 h-4" /> Copy verification link
          </button>
          <button onClick={() => nav("/my-virana")} data-testid="skip-verify-btn" className="w-full text-sm text-muted-foreground hover:text-gold">
            Skip for now → My Virana
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell image={HOLI_IMG} title={<>Begin your <span className="italic text-gold">heritage journey</span></>} subtitle="Create a free account to save, contribute and preserve.">
      <form onSubmit={submit} className="space-y-4" data-testid="signup-form">
        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-500 text-sm px-4 py-3" data-testid="signup-error">{error}</div>}
        <div>
          <label className="caption block mb-1.5">Full Name</label>
          <input value={form.full_name} onChange={set("full_name")} data-testid="signup-name-input" placeholder="Rahul Kumar"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-colors" />
        </div>
        <div>
          <label className="caption block mb-1.5">Email Address</label>
          <input type="email" value={form.email} onChange={set("email")} data-testid="signup-email-input" placeholder="you@example.com"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-colors" />
        </div>
        <div>
          <label className="caption block mb-1.5">Password</label>
          <div className="relative">
            <input type={show ? "text" : "password"} value={form.password} onChange={set("password")} data-testid="signup-password-input" placeholder="At least 8 characters, letters + numbers"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-gold transition-colors" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold" data-testid="signup-toggle-password">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password && (
            <div className="flex gap-1 mt-2" data-testid="password-strength">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < s ? (s <= 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-border"}`} />
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="caption block mb-1.5">Confirm Password</label>
          <input type={show ? "text" : "password"} value={form.confirm_password} onChange={set("confirm_password")} data-testid="signup-confirm-input" placeholder="Repeat your password"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-colors" />
        </div>
        <div>
          <label className="caption block mb-1.5">Preferred Language</label>
          <select value={form.preferred_language} onChange={set("preferred_language")} data-testid="signup-language-select"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-colors">
            {LANGUAGES.filter(l => l.ready).map(l => <option key={l.code} value={l.code}>{l.native} · {l.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} data-testid="signup-submit-btn"
          className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating your account..." : "Create Account"}
        </button>
        <p className="text-sm text-center text-muted-foreground">
          Already exploring with us? <Link to="/login" data-testid="goto-login-link" className="text-gold hover:underline font-semibold">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
