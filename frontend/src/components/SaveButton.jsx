import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { toggleSave, checkSaved } from "@/lib/api";

export default function SaveButton({ itemType, itemId, label = "Save", className = "", testId }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { setSaved(false); return; }
    checkSaved(itemType, itemId).then(d => setSaved(d.saved)).catch(() => {});
  }, [user, itemType, itemId]);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast("Sign in to save to your Virana", { description: "Create a free account to build your personal heritage archive." });
      nav("/login", { state: { from: location.pathname } });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const d = await toggleSave(itemType, itemId);
      setSaved(d.saved);
      toast(d.saved ? "Saved to My Virana" : "Removed from saved");
    } catch {
      toast.error("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      data-testid={testId || `save-btn-${itemId}`}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
        saved ? "bg-rose-600 text-white border-transparent" : "bg-card border-border hover:border-rose-500 hover:text-rose-500"
      } ${className}`}
      aria-pressed={saved}
    >
      <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved" : label}
    </button>
  );
}
