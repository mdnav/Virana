import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Sun, Moon, Menu, X, Sparkles, Bell, User, Heart, FolderHeart, ListChecks, Settings, HelpCircle, LogOut, LayoutDashboard, CalendarDays } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/lib/i18n";
import { fetchNotifications } from "@/lib/api";

function Avatar({ user, size = "w-8 h-8" }) {
  if (user?.profile_image) {
    return <img src={user.profile_image} alt={user.display_name} className={`${size} rounded-full object-cover border border-gold/50`} />;
  }
  const initial = (user?.display_name || user?.email || "?").charAt(0).toUpperCase();
  return (
    <div className={`${size} rounded-full gradient-royal flex items-center justify-center text-white text-sm font-bold border border-gold/40`}>
      {initial}
    </div>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { resolved, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const menuRef = useRef(null);
  const bellRef = useRef(null);

  const LINKS = [
    { to: "/", label: t("home") },
    { to: "/explore", label: t("explore") },
    { to: "/ask", label: t("ask") },
    { to: "/lens", label: t("lens") },
    { to: "/calendar", label: t("calendar") },
    { to: "/at-risk", label: t("atRisk") },
  ];

  useEffect(() => {
    if (!user) { setNotifs([]); return; }
    fetchNotifications().then(d => setNotifs(d.notifications || [])).catch(() => {});
  }, [user, pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/explore?q=${encodeURIComponent(q.trim())}`);
  };

  const doLogout = async () => {
    setMenuOpen(false);
    await logout();
    nav("/");
  };

  const dropdownItems = [
    { to: "/my-virana", icon: LayoutDashboard, label: t("myVirana"), testid: "menu-my-virana" },
    { to: "/my-virana?tab=saved", icon: Heart, label: t("savedHeritage"), testid: "menu-saved" },
    { to: "/my-virana?tab=contributions", icon: ListChecks, label: t("myContributions"), testid: "menu-contributions" },
    { to: "/my-virana?tab=collections", icon: FolderHeart, label: t("collections"), testid: "menu-collections" },
    { to: "/my-virana?tab=activity", icon: CalendarDays, label: t("activity"), testid: "menu-activity" },
    { to: "/settings", icon: Settings, label: t("settings"), testid: "menu-settings" },
    { to: "/ask", icon: HelpCircle, label: t("help"), testid: "menu-help" },
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60" data-testid="site-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-9 h-9 rounded-full gradient-royal flex items-center justify-center heritage-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-cinzel text-lg font-bold tracking-widest">VIRANA</div>
              <div className="font-devanagari text-[10px] text-gold -mt-1">विराना · Living Heritage</div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            {LINKS.map(l => (
              <Link key={l.to} to={l.to}
                data-testid={`nav-link-${l.to === "/" ? "home" : l.to.slice(1)}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === l.to ? "text-gold bg-primary/10" : "text-foreground/80 hover:text-gold hover:bg-primary/5"
                }`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <form onSubmit={submit} className="hidden md:flex items-center bg-secondary/60 border border-border rounded-full px-3 py-1.5">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input data-testid="global-search-input" value={q} onChange={e => setQ(e.target.value)} placeholder={t("search")}
                className="bg-transparent outline-none pl-2 w-32 text-sm placeholder:text-muted-foreground/70" />
            </form>

            <button onClick={toggle} className="p-2 rounded-full hover:bg-secondary transition-colors" data-testid="theme-toggle" aria-label="Toggle theme">
              {resolved === "dark" ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                <div className="relative" ref={bellRef}>
                  <button onClick={() => setBellOpen(!bellOpen)} data-testid="notifications-bell" className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Notifications">
                    <Bell className="w-4 h-4" />
                    {notifs.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center" data-testid="notifications-count">{notifs.length}</span>
                    )}
                  </button>
                  {bellOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden" data-testid="notifications-dropdown">
                      <div className="caption px-4 py-3 border-b border-border/60">Notifications</div>
                      {notifs.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-muted-foreground" data-testid="notifications-empty">No upcoming reminders. Save a festival and tap "Remind Me".</div>
                      ) : notifs.map((n, i) => (
                        <Link key={i} to={`/festival/${n.festival_id}`} onClick={() => setBellOpen(false)}
                          data-testid={`notification-item-${n.festival_id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors">
                          <img src={n.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <div className="text-sm">🔔 {n.message}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} data-testid="profile-avatar-btn" className="flex items-center gap-1.5 p-1 rounded-full hover:bg-secondary transition-colors">
                    <Avatar user={user} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card shadow-xl overflow-hidden" data-testid="profile-dropdown">
                      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
                        <Avatar user={user} size="w-10 h-10" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{user.display_name || "Explorer"}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                      {dropdownItems.map(item => (
                        <Link key={item.testid} to={item.to} onClick={() => setMenuOpen(false)} data-testid={item.testid}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" /> {item.label}
                        </Link>
                      ))}
                      <button onClick={doLogout} data-testid="menu-signout" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors border-t border-border/60">
                        <LogOut className="w-4 h-4" /> {t("signOut")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" data-testid="nav-signin-btn"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-border hover:border-gold hover:text-gold transition-colors">
                  {t("signIn")}
                </Link>
                <Link to="/signup" data-testid="nav-signup-btn"
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  {t("signUp")}
                </Link>
              </div>
            )}

            <button onClick={() => setOpen(!open)} className="xl:hidden p-2 rounded-full hover:bg-secondary transition-colors" data-testid="mobile-menu-toggle" aria-label="Toggle menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="xl:hidden py-3 border-t border-border/60 space-y-1" data-testid="mobile-menu">
            {LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-sm hover:bg-secondary">
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 px-3 pt-2">
                <Link to="/login" onClick={() => setOpen(false)} data-testid="mobile-signin-btn" className="flex-1 text-center px-4 py-2 rounded-full text-sm font-semibold border border-border">{t("signIn")}</Link>
                <Link to="/signup" onClick={() => setOpen(false)} data-testid="mobile-signup-btn" className="flex-1 text-center px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground">{t("signUp")}</Link>
              </div>
            )}
            {user && (
              <Link to="/my-virana" onClick={() => setOpen(false)} data-testid="mobile-my-virana" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary">
                <User className="w-4 h-4" /> {t("myVirana")}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
