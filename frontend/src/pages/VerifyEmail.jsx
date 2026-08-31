import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { authVerifyEmail, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const token = params.get("token") || "";
  const [state, setState] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setMessage("This verification link is missing its token."); return; }
    authVerifyEmail(token)
      .then(() => { setState("success"); refreshUser(); })
      .catch(e => { setState("error"); setMessage(apiError(e)); });
  }, [token, refreshUser]);

  return (
    <AuthShell title={state === "success" ? "Email verified" : state === "error" ? "Verification failed" : "Verifying..."}>
      <div className="space-y-5" data-testid="verify-email-page">
        {state === "verifying" && (
          <div className="flex items-center gap-3 text-muted-foreground" data-testid="verify-loading">
            <Loader2 className="w-5 h-5 animate-spin text-gold" /> Verifying your email...
          </div>
        )}
        {state === "success" && (
          <>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 flex items-start gap-3" data-testid="verify-success">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm">Your account is now verified. Welcome to the Virana community.</p>
            </div>
            <Link to="/my-virana" data-testid="goto-dashboard-btn"
              className="block text-center w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm hover:bg-primary/90 transition-colors">
              Go to My Virana
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-4 flex items-start gap-3" data-testid="verify-error">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm">{message}</p>
            </div>
            <Link to="/login" className="block text-center text-sm text-gold hover:underline">Back to Sign In</Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
