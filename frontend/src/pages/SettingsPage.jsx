import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, KeyRound, Languages, Palette, Bell, Lock, Link2, Database, Loader2, Download, Trash2, CheckCircle2, Monitor, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { useLang, LANGUAGES } from "@/lib/i18n";
import { updateMe, fetchSettings, updateSettings, changePassword, fetchSessions, clearSessions, exportMyData, deleteMe, authResendVerification, apiError } from "@/lib/api";
import { toast } from "sonner";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Shield },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "language", label: "Language", icon: Languages },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "connected", label: "Connected Accounts", icon: Link2 },
  { id: "data", label: "Data & Account", icon: Database },
];

const NOTIF_KEYS = [
  ["festival_reminders", "Festival reminders"],
  ["new_heritage", "New heritage discoveries"],
  ["contribution_updates", "Contribution updates"],
  ["comment_replies", "Comment replies"],
  ["community_activity", "Community activity"],
  ["recommendations", "Recommendations"],
  ["announcements", "Product announcements"],
];

function Toggle({ checked, onChange, testId }) {
  return (
    <button onClick={() => onChange(!checked)} data-testid={testId} aria-pressed={checked}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-gold" : "bg-secondary border border-border"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

const Field = ({ label, children }) => (
  <div>
    <label className="caption block mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLang();
  const nav = useNavigate();
  const [section, setSection] = useState("profile");
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState({ display_name: "", bio: "", location: "", profile_image: "", interests: "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [sessions, setSessions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deletePw, setDeletePw] = useState("");

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
    if (user) setProfile({
      display_name: user.display_name || "", bio: user.bio || "", location: user.location || "",
      profile_image: user.profile_image || "", interests: (user.interests || []).join(", "),
    });
  }, [user]);

  useEffect(() => {
    if (section === "security") fetchSessions().then(d => setSessions(d.sessions || [])).catch(() => {});
  }, [section]);

  const saveProfile = async () => {
    setBusy(true);
    try {
      await updateMe({
        display_name: profile.display_name, bio: profile.bio, location: profile.location,
        profile_image: profile.profile_image || null,
        interests: profile.interests.split(",").map(s => s.trim()).filter(Boolean),
      });
      await refreshUser();
      toast.success("Profile saved");
    } catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };

  const savePassword = async () => {
    if (pw.next !== pw.confirm) { toast.error("New passwords do not match"); return; }
    setBusy(true);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    } catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };

  const saveLanguage = async (code) => {
    setLang(code);
    try {
      await updateSettings({ language: code });
      await refreshUser();
      toast.success("Language updated");
    } catch { }
  };

  const saveTheme = async (t) => {
    setTheme(t);
    try { await updateSettings({ theme: t }); } catch {}
    toast(`Theme: ${t}`);
  };

  const toggleNotif = async (key, val) => {
    const next = { ...settings.notifications, [key]: val };
    setSettings(s => ({ ...s, notifications: next }));
    try { await updateSettings({ notifications: next }); } catch {}
  };

  const setPrivacy = async (key, val) => {
    const next = { ...settings.privacy, [key]: val };
    setSettings(s => ({ ...s, privacy: next }));
    try { await updateSettings({ privacy: next }); } catch {}
  };

  const download = async () => {
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "virana-my-data.json";
      a.click();
      toast.success("Your data export has been downloaded");
    } catch { toast.error("Export failed"); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteMe(deletePw);
      toast("Your account has been deleted. Farewell, explorer.");
      await logout();
      nav("/");
    } catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };

  const resendVerify = async () => {
    try {
      const d = await authResendVerification();
      if (d.verification_token) nav(`/verify-email?token=${d.verification_token}`);
      else toast(d.message);
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="settings-page">
      <div className="caption">Account</div>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-1 mb-8">Settings</h1>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-1" data-testid="settings-sidebar">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} data-testid={`settings-nav-${s.id}`}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                section === s.id ? "bg-gold/15 text-gold font-semibold" : "hover:bg-secondary/60 text-foreground/80"}`}>
              <s.icon className="w-4 h-4" /> {s.label}
            </button>
          ))}
        </aside>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8" data-testid={`settings-panel-${section}`}>
          {section === "profile" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="font-display text-2xl font-semibold">Profile</h2>
              <Field label="Display Name"><input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} data-testid="settings-name-input" className={inputCls} /></Field>
              <Field label="Bio"><textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} data-testid="settings-bio-input" rows={3} className={inputCls} placeholder="A line about your heritage journey..." /></Field>
              <Field label="Location (optional)"><input value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} data-testid="settings-location-input" className={inputCls} placeholder="City, State" /></Field>
              <Field label="Profile picture URL (optional)"><input value={profile.profile_image} onChange={e => setProfile(p => ({ ...p, profile_image: e.target.value }))} data-testid="settings-image-input" className={inputCls} placeholder="https://..." /></Field>
              <Field label="Cultural interests (comma separated)"><input value={profile.interests} onChange={e => setProfile(p => ({ ...p, interests: e.target.value }))} data-testid="settings-interests-input" className={inputCls} placeholder="temples, folk music, cuisine" /></Field>
              <div className="flex gap-3">
                <button onClick={saveProfile} disabled={busy} data-testid="settings-save-profile-btn" className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </button>
                <button onClick={() => nav(-1)} className="border border-border rounded-full px-6 py-2.5 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {section === "account" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="font-display text-2xl font-semibold">Account</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/60 pb-3"><span className="text-muted-foreground">Email</span><span data-testid="account-email">{user?.email}</span></div>
                <div className="flex justify-between border-b border-border/60 pb-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-mono text-xs px-2 py-1 rounded-full ${user?.email_verified ? "bg-emerald-600/20 text-emerald-500" : "bg-amber-600/20 text-amber-500"}`} data-testid="account-status">
                    {user?.status || "UNVERIFIED"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-3"><span className="text-muted-foreground">Member since</span><span>{user?.created_at?.slice(0, 10)}</span></div>
              </div>
              {!user?.email_verified && (
                <button onClick={resendVerify} data-testid="resend-verification-btn" className="flex items-center gap-2 text-sm font-semibold text-gold hover:underline">
                  <CheckCircle2 className="w-4 h-4" /> Verify my email now
                </button>
              )}
            </div>
          )}

          {section === "security" && (
            <div className="space-y-8 max-w-lg">
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-semibold">Change Password</h2>
                <Field label="Current Password"><input type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} data-testid="security-current-pw" className={inputCls} /></Field>
                <Field label="New Password"><input type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} data-testid="security-new-pw" className={inputCls} /></Field>
                <Field label="Confirm New Password"><input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} data-testid="security-confirm-pw" className={inputCls} /></Field>
                <button onClick={savePassword} disabled={busy} data-testid="security-save-pw-btn" className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60">Update Password</button>
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-xl font-semibold">Active Sessions</h3>
                {sessions.map(s => (
                  <div key={s.id} className="rounded-xl border border-border px-4 py-3 text-xs flex justify-between">
                    <span className="truncate max-w-[60%] text-muted-foreground">{s.user_agent?.slice(0, 60) || "Unknown device"}</span>
                    <span className="font-mono">{s.created_at?.slice(0, 16).replace("T", " ")}</span>
                  </div>
                ))}
                <button onClick={async () => { await clearSessions(); setSessions([]); toast("Signed out of all devices"); }} data-testid="clear-sessions-btn"
                  className="text-sm text-red-500 hover:underline">Sign out of all devices</button>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mt-1">2FA support is coming soon. Your account architecture is already prepared for it.</p>
              </div>
            </div>
          )}

          {section === "language" && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold">Language</h2>
              <p className="text-sm text-muted-foreground">Choose the language Virana speaks to you in.</p>
              <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
                {LANGUAGES.map(l => (
                  <button key={l.code} disabled={!l.ready} onClick={() => saveLanguage(l.code)} data-testid={`lang-${l.code}`}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                      lang === l.code ? "border-gold bg-gold/10 text-gold font-semibold" :
                      l.ready ? "border-border hover:border-gold" : "border-border/50 text-muted-foreground/50 cursor-not-allowed"}`}>
                    <span>{l.native} <span className="text-xs opacity-70">· {l.name}</span></span>
                    {!l.ready && <span className="text-[10px] uppercase tracking-wider">Soon</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === "appearance" && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold">Appearance</h2>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]].map(([t, Icon, label]) => (
                  <button key={t} onClick={() => saveTheme(t)} data-testid={`theme-${t}`}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm transition-colors ${
                      theme === t ? "border-gold bg-gold/10 text-gold font-semibold" : "border-border hover:border-gold"}`}>
                    <Icon className="w-5 h-5" /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === "notifications" && settings && (
            <div className="space-y-4 max-w-lg">
              <h2 className="font-display text-2xl font-semibold">Notifications</h2>
              {NOTIF_KEYS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between border-b border-border/50 py-3">
                  <span className="text-sm">{label}</span>
                  <Toggle checked={(settings.notifications || {})[key] ?? true} onChange={v => toggleNotif(key, v)} testId={`notif-${key}`} />
                </div>
              ))}
            </div>
          )}

          {section === "privacy" && settings && (
            <div className="space-y-4 max-w-lg">
              <h2 className="font-display text-2xl font-semibold">Privacy</h2>
              <div className="flex items-center justify-between border-b border-border/50 py-3">
                <div><div className="text-sm">Profile visibility</div><div className="text-xs text-muted-foreground">Who can see your profile</div></div>
                <select value={(settings.privacy || {}).profile_visibility || "public"} data-testid="privacy-visibility-select"
                  onChange={e => setPrivacy("profile_visibility", e.target.value)}
                  className="bg-background border border-border rounded-full px-3 py-1.5 text-xs outline-none">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              {[["contribution_attribution", "Show my name on contributions"],
                ["activity_visibility", "Make my activity visible", true],
                ["personalized_recommendations", "Personalized recommendations"],
                ["location_access", "Location access (always optional)"]].map(([key, label, isVis]) => (
                <div key={key} className="flex items-center justify-between border-b border-border/50 py-3">
                  <span className="text-sm">{label}</span>
                  <Toggle
                    checked={isVis ? (settings.privacy || {})[key] === "public" : !!(settings.privacy || {})[key]}
                    onChange={v => setPrivacy(key, isVis ? (v ? "public" : "private") : v)}
                    testId={`privacy-${key}`} />
                </div>
              ))}
            </div>
          )}

          {section === "connected" && (
            <div className="space-y-4 max-w-lg">
              <h2 className="font-display text-2xl font-semibold">Connected Accounts</h2>
              <div className="rounded-xl border border-border px-4 py-4 flex items-center justify-between">
                <div className="text-sm">Google</div>
                <span className="text-xs text-muted-foreground">Not connected · coming soon</span>
              </div>
            </div>
          )}

          {section === "data" && (
            <div className="space-y-8 max-w-lg">
              <div>
                <h2 className="font-display text-2xl font-semibold">Download My Data</h2>
                <p className="text-sm text-muted-foreground mt-1">Export your profile, saved items, collections and activity as JSON.</p>
                <button onClick={download} data-testid="download-data-btn" className="mt-3 flex items-center gap-2 border border-border rounded-full px-5 py-2.5 text-sm font-semibold hover:border-gold hover:text-gold">
                  <Download className="w-4 h-4" /> Download My Data
                </button>
              </div>
              <div className="rounded-2xl border border-red-500/40 p-5">
                <h2 className="font-display text-2xl font-semibold text-red-500">Delete Account</h2>
                {deleteStep === 0 && (
                  <>
                    <p className="text-sm text-muted-foreground mt-1">This permanently deletes your account, saved items and activity. Published cultural contributions remain public but are anonymized.</p>
                    <button onClick={() => setDeleteStep(1)} data-testid="delete-account-btn" className="mt-3 flex items-center gap-2 bg-red-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-red-700">
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                  </>
                )}
                {deleteStep === 1 && (
                  <div className="mt-3 space-y-3" data-testid="delete-confirm-step">
                    <p className="text-sm font-semibold text-red-500">Are you absolutely sure? This cannot be undone.</p>
                    <input type="password" value={deletePw} onChange={e => setDeletePw(e.target.value)} data-testid="delete-password-input"
                      placeholder="Enter your password to confirm" className={inputCls} />
                    <div className="flex gap-3">
                      <button onClick={confirmDelete} disabled={busy || !deletePw} data-testid="delete-confirm-btn"
                        className="bg-red-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
                        {busy ? "Deleting..." : "Permanently delete"}
                      </button>
                      <button onClick={() => { setDeleteStep(0); setDeletePw(""); }} className="border border-border rounded-full px-5 py-2.5 text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
