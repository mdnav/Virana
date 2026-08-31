import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List, GanttChartSquare, Heart, CalendarClock } from "lucide-react";
import { fetchFestivals, fetchStates, fetchSaved } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/lib/i18n";
import FestivalCard, { FestivalSkeleton, TYPE_META, fmtRange, daysAway } from "@/components/FestivalCard";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthGrid({ month, festivals }) {
  const first = new Date(2026, month - 1, 1);
  const daysInMonth = new Date(2026, month, 0).getDate();
  const offset = first.getDay();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const byDay = {};
  festivals.forEach(f => {
    const s = new Date(f.start_date + "T00:00:00");
    const e = new Date(f.end_date + "T00:00:00");
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(2026, month - 1, d);
      if (cur >= s && cur <= e) (byDay[d] = byDay[d] || []).push(f);
    }
  });

  const today = new Date();
  const isThisMonth = today.getFullYear() === 2026 && today.getMonth() === month - 1;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden" data-testid="calendar-month-grid">
      <div className="grid grid-cols-7 border-b border-border/60">
        {WEEKDAYS.map(w => <div key={w} className="caption text-center py-2.5">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => (
          <div key={i} className={`min-h-24 border-b border-r border-border/40 p-1.5 ${d === null ? "bg-secondary/30" : ""}`}>
            {d && (
              <>
                <div className={`text-xs font-mono mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isThisMonth && today.getDate() === d ? "bg-gold text-background font-bold" : "text-muted-foreground"}`}>{d}</div>
                <div className="space-y-1">
                  {(byDay[d] || []).slice(0, 2).map(f => (
                    <Link key={f.id} to={`/festival/${f.id}`} data-testid={`grid-fest-${f.id}-${d}`}
                      className="block text-[10px] leading-tight px-1.5 py-1 rounded truncate text-white hover:opacity-80"
                      style={{ backgroundColor: (TYPE_META[f.type]?.color || "#F56A1E") + "CC" }}>
                      {f.name}
                    </Link>
                  ))}
                  {(byDay[d] || []).length > 2 && <div className="text-[9px] text-muted-foreground px-1">+{byDay[d].length - 2} more</div>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Timeline({ festivals }) {
  const byMonth = {};
  festivals.forEach(f => {
    const m = parseInt(f.start_date.slice(5, 7), 10);
    (byMonth[m] = byMonth[m] || []).push(f);
  });
  return (
    <div className="relative pl-8" data-testid="calendar-timeline">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
      {Object.keys(byMonth).sort((a, b) => a - b).map(m => (
        <div key={m} className="mb-10">
          <div className="relative mb-4">
            <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-gold text-background text-[10px] font-bold flex items-center justify-center">{MONTHS[m - 1]}</div>
            <h3 className="font-display text-2xl font-semibold">{MONTHS_FULL[m - 1]} 2026</h3>
          </div>
          <div className="space-y-3">
            {byMonth[m].map(f => (
              <Link key={f.id} to={`/festival/${f.id}`} data-testid={`timeline-fest-${f.id}`}
                className="flex gap-4 items-center rounded-2xl border border-border bg-card p-3 hover-lift">
                <img src={f.image} alt="" className="w-20 h-14 rounded-xl object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="font-display text-lg font-semibold truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtRange(f.start_date, f.end_date)} · {f.state}</div>
                </div>
                <span className="ml-auto caption shrink-0" style={{ color: TYPE_META[f.type]?.color }}>{TYPE_META[f.type]?.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Calendar() {
  const { user } = useAuth();
  const { t } = useLang();
  const [festivals, setFestivals] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [month, setMonth] = useState(null);
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([fetchFestivals({ limit: 300 }), fetchStates()])
      .then(([f, s]) => { setFestivals(f.festivals || []); setStates(s || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    fetchSaved("FESTIVAL").then(d => setSavedIds(new Set((d.items || []).map(i => i.item_id)))).catch(() => {});
  }, [user]);

  const filtered = useMemo(() => festivals.filter(f => {
    if (month !== null && !f.months.includes(month)) return false;
    if (stateFilter && f.state !== stateFilter && f.state !== "Pan-India") return false;
    if (typeFilter && f.type !== typeFilter) return false;
    if (upcomingOnly && daysAway(f.end_date) < 0) return false;
    if (savedOnly && !savedIds.has(f.id)) return false;
    return true;
  }), [festivals, month, stateFilter, typeFilter, upcomingOnly, savedOnly, savedIds]);

  const gridMonth = month !== null ? month : (new Date().getFullYear() === 2026 ? new Date().getMonth() + 1 : 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="calendar-page">
      <div className="mb-8">
        <div className="caption">{t("culturalCalendar")}</div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-1">The rhythm of the sacred year.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {festivals.length}+ festivals with verified 2026 dates, regional variations and living traditions — from Pongal's kolam to Hornbill's log drums.
        </p>
      </div>

      {/* View switcher + toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex rounded-full border border-border bg-card p-1" data-testid="view-switcher">
          {[["month", LayoutGrid, "Month"], ["list", List, "List"], ["timeline", GanttChartSquare, "Timeline"]].map(([v, Icon, label]) => (
            <button key={v} onClick={() => setView(v)} data-testid={`view-${v}`}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full transition-colors ${view === v ? "bg-gold text-background font-semibold" : "text-muted-foreground hover:text-gold"}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
        <button onClick={() => setUpcomingOnly(!upcomingOnly)} data-testid="filter-upcoming"
          className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border transition-colors ${upcomingOnly ? "bg-gold text-background border-transparent font-semibold" : "bg-card border-border hover:border-gold"}`}>
          <CalendarClock className="w-3.5 h-3.5" /> Upcoming
        </button>
        {user && (
          <button onClick={() => setSavedOnly(!savedOnly)} data-testid="filter-saved"
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border transition-colors ${savedOnly ? "bg-rose-600 text-white border-transparent font-semibold" : "bg-card border-border hover:border-rose-500"}`}>
            <Heart className="w-3.5 h-3.5" /> Saved
          </button>
        )}
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} data-testid="filter-state"
          className="text-xs px-3 py-2 rounded-full border border-border bg-card outline-none focus:border-gold">
          <option value="">All states</option>
          {states.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* Month chips */}
      <div className="flex flex-wrap gap-2 mb-4" data-testid="month-filters">
        <button onClick={() => setMonth(null)} data-testid="month-all"
          className={`text-xs px-3 py-1.5 rounded-full border ${month === null ? "bg-gold text-background border-transparent" : "bg-secondary/50 border-border hover:border-gold"}`}>All year</button>
        {MONTHS.map((m, i) => (
          <button key={m} onClick={() => setMonth(i + 1)} data-testid={`month-${m.toLowerCase()}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${month === i + 1 ? "bg-gold text-background border-transparent" : "bg-secondary/50 border-border hover:border-gold"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2 mb-8" data-testid="type-filters">
        {Object.entries(TYPE_META).map(([id, meta]) => (
          <button key={id} onClick={() => setTypeFilter(typeFilter === id ? null : id)} data-testid={`type-${id}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === id ? "text-white border-transparent" : "bg-secondary/50 border-border hover:border-gold"}`}
            style={typeFilter === id ? { backgroundColor: meta.color } : {}}>
            {meta.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <FestivalSkeleton key={i} />)}
        </div>
      ) : view === "month" ? (
        <>
          <h2 className="font-display text-2xl font-semibold mb-4">{MONTHS_FULL[gridMonth - 1]} 2026</h2>
          <MonthGrid month={gridMonth} festivals={filtered.filter(f => f.months.includes(gridMonth))} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {filtered.filter(f => f.months.includes(gridMonth)).map(f => <FestivalCard key={f.id} festival={f} />)}
          </div>
        </>
      ) : view === "timeline" ? (
        <Timeline festivals={filtered} />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm" data-testid="calendar-empty">No festivals match these filters yet. Try widening your search.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="calendar-list">
          {filtered.map(f => <FestivalCard key={f.id} festival={f} />)}
        </div>
      )}
    </div>
  );
}
