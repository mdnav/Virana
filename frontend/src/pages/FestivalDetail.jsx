import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, CalendarDays, ArrowLeft, Bell, BellRing, ShieldCheck, ExternalLink, Utensils, Music2, Sparkles, Flame } from "lucide-react";
import { fetchFestivalById, toggleReminder, reminderStatus, trackView } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import HeritageCard from "@/components/HeritageCard";
import SaveButton from "@/components/SaveButton";
import { TYPE_META, fmtRange } from "@/components/FestivalCard";
import { toast } from "sonner";

export default function FestivalDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [fest, setFest] = useState(null);
  const [err, setErr] = useState(null);
  const [reminded, setReminded] = useState(false);

  useEffect(() => {
    setFest(null); setErr(null);
    fetchFestivalById(id).then(setFest).catch(e => setErr(e?.response?.data?.detail || "Festival not found"));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    trackView("FESTIVAL", id).catch(() => {});
    reminderStatus(id).then(d => setReminded(d.reminded)).catch(() => {});
  }, [user, id]);

  const onRemind = async () => {
    if (!user) {
      toast("Sign in to get festival reminders");
      nav("/login", { state: { from: `/festival/${id}` } });
      return;
    }
    try {
      const d = await toggleReminder(id);
      setReminded(d.reminded);
      toast(d.reminded ? `We'll remind you before ${fest.name}` : "Reminder removed");
    } catch { toast.error("Could not update reminder"); }
  };

  if (err) return (
    <div className="max-w-3xl mx-auto py-32 text-center" data-testid="festival-error">
      <div className="caption text-red-500">Error</div>
      <h1 className="font-display text-4xl mt-2">{err}</h1>
      <Link to="/calendar" className="mt-6 inline-flex items-center gap-2 text-gold"><ArrowLeft className="w-4 h-4" /> Back to calendar</Link>
    </div>
  );
  if (!fest) return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse" data-testid="festival-loading">
      <div className="h-[50vh] bg-secondary rounded-3xl" />
      <div className="h-6 bg-secondary rounded w-1/3 mt-8" />
      <div className="h-4 bg-secondary rounded w-2/3 mt-4" />
    </div>
  );

  const t = TYPE_META[fest.type] || {};
  const days = fest.days_away;

  const section = (title, content, icon) => content ? (
    <div>
      <h2 className="font-display text-3xl font-semibold mb-3 flex items-center gap-2">{icon}{title}</h2>
      <p className="text-foreground/85 leading-relaxed">{content}</p>
    </div>
  ) : null;

  const chips = (title, items, Icon) => items?.length > 0 ? (
    <div>
      <div className="caption mb-2 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map(x => <span key={x} className="text-xs bg-secondary/60 border border-border rounded-full px-3 py-1.5">{x}</span>)}
      </div>
    </div>
  ) : null;

  return (
    <div data-testid={`festival-page-${fest.id}`}>
      {/* HERO */}
      <section className="relative h-[62vh] min-h-[420px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={fest.image} alt={fest.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 grain" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-14">
          <Link to="/calendar" data-testid="back-to-calendar" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-gold mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to calendar
          </Link>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="caption bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10" style={{ color: t.color }}>{t.name}</span>
            {fest.verification === "verified" && (
              <span className="flex items-center gap-1 text-xs font-mono bg-emerald-600/80 text-white px-2 py-1 rounded-full"><ShieldCheck className="w-3 h-3" /> Verified 2026 dates</span>
            )}
            {days > 0 && days < 90 && <span className="text-xs font-mono bg-gold text-background px-2 py-1 rounded-full">{days} days away</span>}
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-none max-w-4xl">{fest.name}</h1>
          <div className="mt-4 text-white/85 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {fest.state}{fest.district ? ` · ${fest.district}` : ""} · {fest.region}</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {fmtRange(fest.start_date, fest.end_date)}</span>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-[1fr_320px] gap-10">
        <article className="space-y-10">
          <div>
            <div className="caption mb-2">About</div>
            <p className="text-lg leading-relaxed text-foreground/90">{fest.description}</p>
          </div>
          {section("Cultural Significance", fest.significance)}
          {section("History", fest.history)}
          {section("How It Is Celebrated", fest.celebrated)}

          {fest.variations?.length > 0 && (
            <div data-testid="regional-variations">
              <h2 className="font-display text-3xl font-semibold mb-4">Regional Variations</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {fest.variations.map(v => (
                  <div key={v.name} className="rounded-2xl border border-border bg-card p-4">
                    <div className="caption text-gold">{v.region}</div>
                    <div className="font-display text-lg font-semibold mt-1">{v.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">{v.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            {chips("Traditional Food", fest.foods, Utensils)}
            {chips("Traditions", fest.traditions, Sparkles)}
            {chips("Rituals", fest.rituals, Flame)}
            {(fest.music || fest.dance) && (
              <div>
                <div className="caption mb-2 flex items-center gap-1.5"><Music2 className="w-3.5 h-3.5" /> Music & Dance</div>
                <div className="flex flex-wrap gap-2">
                  {fest.music && <span className="text-xs bg-secondary/60 border border-border rounded-full px-3 py-1.5">🎵 {fest.music}</span>}
                  {fest.dance && <span className="text-xs bg-secondary/60 border border-border rounded-full px-3 py-1.5">💃 {fest.dance}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6" data-testid="festival-sources">
            <div className="caption mb-2">Sources & Attribution</div>
            <p className="text-sm text-muted-foreground">
              Dates verified against standard Panchang sources for 2026 (lunar festivals shift yearly).
              Imagery: {fest.image_source}.
            </p>
            <a href={fest.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-gold hover:underline mt-2">
              <ExternalLink className="w-3 h-3" /> Date source
            </a>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="caption mb-3">Quick facts</div>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">When</dt><dd className="mt-0.5">{fmtRange(fest.start_date, fest.end_date)}</dd></div>
              <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Where</dt><dd className="mt-0.5">{fest.state}{fest.district ? `, ${fest.district}` : ""}</dd></div>
              <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Region</dt><dd className="mt-0.5">{fest.region}</dd></div>
              <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Type</dt><dd className="mt-0.5 capitalize">{fest.type}</dd></div>
            </dl>
          </div>

          <SaveButton itemType="FESTIVAL" itemId={fest.id} label="Save Festival" testId="festival-save-btn" className="w-full justify-center !py-2.5" />

          <button onClick={onRemind} data-testid="festival-remind-btn"
            className={`w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold border transition-colors ${
              reminded ? "bg-gold text-background border-transparent" : "bg-card border-border hover:border-gold hover:text-gold"}`}>
            {reminded ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {reminded ? "Reminder on" : "Remind Me"}
          </button>

          <Link
            to={`/explore?lat=${fest.lat}&lng=${fest.lng}&zoom=9&label=${encodeURIComponent(fest.name)}`}
            data-testid="festival-explore-map-btn"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
            <MapPin className="w-4 h-4" /> Explore on Map
          </Link>
        </aside>
      </section>

      {/* RELATED HERITAGE */}
      {fest.related_heritage_records?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" data-testid="festival-related-heritage">
          <div className="caption mb-2">Related heritage</div>
          <h2 className="font-display text-3xl font-semibold mb-6">Where this festival lives.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fest.related_heritage_records.map(r => <HeritageCard key={r.id} record={r} testIdPrefix="fest-related" />)}
          </div>
        </section>
      )}
    </div>
  );
}
