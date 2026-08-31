import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Compass, Camera, Sparkles, ArrowRight, AlertTriangle, ShieldCheck, MapPin, CalendarDays } from "lucide-react";
import HeritageCard from "@/components/HeritageCard";
import FestivalCard from "@/components/FestivalCard";
import { fetchHeritage, fetchStats, fetchUpcomingFestivals } from "@/lib/api";
import { CATEGORY_META, CATEGORY_ORDER } from "@/data/constants";

const HERO_IMG = "https://images.unsplash.com/photo-1526711657229-e7e080ed7aa1?crop=entropy&cs=srgb&fm=jpg&q=90&w=2000";
const HERO_IMG_2 = "https://images.unsplash.com/photo-1715181751269-2c8325468b73?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";
const HERO_IMG_3 = "https://images.unsplash.com/photo-1546702005-7f8e5aeab4a6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    fetchHeritage({ limit: 200 }).then(d => {
      setFeatured((d.records || []).slice(0, 8));
    }).catch(() => {});
    fetchHeritage({ preservation: "AT_RISK", limit: 6 }).then(d => setAtRisk(d.records || [])).catch(() => {});
    fetchStats().then(setStats).catch(() => {});
    fetchUpcomingFestivals(3).then(d => setUpcoming(d.festivals || [])).catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/explore?q=${encodeURIComponent(q.trim())}`);
    else nav("/explore");
  };

  const heroStats = [
    { v: stats ? `${stats.total_records}+` : "3,690+", l: "Heritage records mapped" },
    { v: stats ? `${stats.states_covered}` : "28", l: "States & territories" },
    { v: stats ? `${stats.at_risk}` : "48", l: "At-risk traditions" },
    { v: "100% Free", l: "Open Heritage Archive" },
  ];

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Taj Mahal" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          <div className="absolute inset-0 grain" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="caption mb-4" data-testid="hero-tagline">Explore · Experience · Preserve</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl leading-[1.02] font-semibold text-foreground">
              Discover the <span className="italic text-gold">Living Heritage</span> of India
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              An AI-powered, community-rooted sanctuary mapping ancient monuments, endangered oral dialects,
              performing arts, sacred rituals, and centuries of culinary alchemy.
            </p>

            <form onSubmit={submit} className="mt-8 flex items-center gap-2 bg-card/80 backdrop-blur border border-border rounded-full pl-5 pr-1 py-1 max-w-2xl heritage-glow">
              <Search className="w-4 h-4 text-gold shrink-0" />
              <input
                data-testid="hero-search-input"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search temples, festivals, folk ragas, spices, or endangered scripts..."
                className="bg-transparent outline-none flex-1 py-3 text-sm sm:text-base placeholder:text-muted-foreground/70"
              />
              <button
                type="submit"
                data-testid="hero-search-submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 sm:px-5 py-2.5 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                Explore <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Hampi Virupaksha", "Kathakali Mudras", "Kashmir Pashmina", "Konark Sun Temple", "Toda Embroidery"].map(t => (
                <button
                  key={t}
                  data-testid={`suggestion-${t.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => nav(`/explore?q=${encodeURIComponent(t)}`)}
                  className="text-xs font-mono bg-secondary/60 border border-border rounded-full px-3 py-1 hover:border-gold hover:text-gold transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/explore" data-testid="cta-explore-map" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors">
                <Compass className="w-4 h-4" /> Explore Interactive Map
              </Link>
              <Link to="/ask" data-testid="cta-ask-ai" className="inline-flex items-center gap-2 bg-card border border-border px-5 py-3 rounded-full font-semibold text-sm hover:border-gold hover:text-gold transition-colors">
                <Sparkles className="w-4 h-4" /> Ask Virana AI
              </Link>
              <Link to="/lens" data-testid="cta-lens" className="inline-flex items-center gap-2 border border-gold text-gold px-5 py-3 rounded-full font-semibold text-sm hover:bg-gold hover:text-background transition-colors">
                <Camera className="w-4 h-4" /> HeritageLens
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {heroStats.map(s => (
              <div key={s.l} className="rounded-2xl bg-card/60 backdrop-blur border border-border p-5">
                <div className="font-display text-3xl text-gold">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" data-testid="categories-section">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="caption mb-2">Traverse the Archive</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">Every category is a doorway.</h2>
          </div>
          <Link to="/explore" className="text-sm text-gold hover:underline flex items-center gap-1">
            View all on map <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORY_ORDER.map((id) => {
            const c = CATEGORY_META[id];
            return (
              <Link
                key={id}
                to={`/explore?category=${id}`}
                data-testid={`category-card-${id}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card hover-lift p-5 h-40 flex flex-col justify-between"
                style={{ backgroundImage: `linear-gradient(135deg, ${c.color}22, transparent)` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="font-display text-lg font-semibold group-hover:text-gold transition-colors">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">Discover →</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="featured-section">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="caption mb-2">Featured Heritage</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">The masterpieces & the living traditions.</h2>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map(r => <HeritageCard key={r.id} record={r} />)}
        </div>
      </section>

      {/* COMING UP — upcoming festivals */}
      {upcoming.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="coming-up-section">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <div className="caption mb-2 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Coming Up</div>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold">The next celebrations on India's calendar.</h2>
            </div>
            <Link to="/calendar" data-testid="see-full-calendar" className="text-sm text-gold hover:underline flex items-center gap-1">
              Full cultural calendar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map(f => <FestivalCard key={f.id} festival={f} testIdPrefix="upcoming-fest" />)}
          </div>
        </section>
      )}

      {/* WHAT WE COULD LOSE */}
      <section className="relative py-24 my-16 border-y border-border/60 overflow-hidden" data-testid="preservation-section">
        <div className="absolute inset-0">
          <img src={HERO_IMG_3} alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="caption text-red-500 mb-3">The Vanishing Archive</div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold">What we could lose.</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Every decade, dozens of indigenous dialects vanish, ancient weave patterns are forgotten, and centuries of
              oral medicinal wisdom disappear with their elders. Virana lets communities digitize and immortalize their
              living culture before it is gone.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {atRisk.map(r => (
              <Link
                key={r.id}
                to={`/heritage/${r.id}`}
                data-testid={`at-risk-card-${r.id}`}
                className="group block rounded-2xl border border-red-500/30 bg-card/80 backdrop-blur p-6 hover-lift"
              >
                <div className="flex items-center gap-2 caption text-red-500">
                  <AlertTriangle className="w-3.5 h-3.5" /> {r.preservation.replace("_", " ")}
                </div>
                <h3 className="font-display text-xl font-semibold mt-3 group-hover:text-gold">{r.name}</h3>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {r.state}
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{r.short}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/at-risk" className="inline-flex items-center gap-2 border border-red-500/60 text-red-500 px-5 py-3 rounded-full font-semibold text-sm hover:bg-red-500 hover:text-white transition-colors" data-testid="see-all-at-risk">
              See all heritage at risk <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="caption mb-4">A final invocation</div>
        <h2 className="font-display text-4xl sm:text-6xl font-semibold max-w-3xl mx-auto leading-tight">
          Heritage survives when it is <span className="italic text-gold">remembered</span>.
        </h2>
        <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
          Every place has a story. Every community has a tradition. Every language carries a memory.
          Every generation has something worth preserving.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/explore" className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors" data-testid="final-cta-explore">
            Explore Virana
          </Link>
          <Link to="/ask" className="border border-border px-6 py-3 rounded-full text-sm font-semibold hover:border-gold hover:text-gold transition-colors" data-testid="final-cta-ask">
            Ask a question
          </Link>
        </div>
      </section>
    </div>
  );
}
