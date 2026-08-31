import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ShieldCheck, Clock, User, Landmark, AlertTriangle, ArrowLeft, Share2 } from "lucide-react";
import { fetchHeritageById, trackView } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import HeritageCard from "@/components/HeritageCard";
import SaveButton from "@/components/SaveButton";
import { CATEGORY_META } from "@/data/constants";

export default function HeritageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [rec, setRec] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setRec(null); setErr(null);
    fetchHeritageById(id).then(setRec).catch(e => setErr(e?.response?.data?.detail || "Not found"));
  }, [id]);

  useEffect(() => {
    if (user) trackView("HERITAGE", id).catch(() => {});
  }, [user, id]);

  if (err) return (
    <div className="max-w-3xl mx-auto py-32 text-center" data-testid="detail-error">
      <div className="caption text-red-500">Error</div>
      <h1 className="font-display text-4xl mt-2">{err}</h1>
      <Link to="/explore" className="mt-6 inline-flex items-center gap-2 text-gold"><ArrowLeft className="w-4 h-4"/> Back to map</Link>
    </div>
  );
  if (!rec) return <div className="py-32 text-center text-muted-foreground" data-testid="detail-loading">Loading heritage story…</div>;

  const cat = CATEGORY_META[rec.category] || {};
  const atRisk = rec.preservation === "AT_RISK";

  return (
    <div data-testid={`detail-page-${rec.id}`}>
      {/* HERO */}
      <section className="relative h-[68vh] min-h-[440px] overflow-hidden">
        <img src={rec.image} alt={rec.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 grain" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16">
          <Link to="/explore" data-testid="back-to-explore" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-gold mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to map
          </Link>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="caption bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10" style={{ color: cat.color }}>
              {cat.name}
            </span>
            {rec.status === "verified" && (
              <span className="flex items-center gap-1 text-xs font-mono bg-emerald-600/80 text-white px-2 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {atRisk && (
              <span className="flex items-center gap-1 text-xs font-mono bg-red-600/90 text-white px-2 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Heritage at Risk
              </span>
            )}
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-none max-w-4xl">{rec.name}</h1>
          <div className="mt-4 text-white/85 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {rec.state}{rec.district ? ` · ${rec.district}` : ""}</span>
            {rec.era && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {rec.era}</span>}
            {rec.builder && <span className="flex items-center gap-1"><User className="w-4 h-4" /> {rec.builder}</span>}
            {rec.dynasty && <span className="flex items-center gap-1"><Landmark className="w-4 h-4" /> {rec.dynasty}</span>}
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-[1fr_320px] gap-10">
        <article className="space-y-10">
          <div>
            <div className="caption mb-2">Why it matters</div>
            <p className="text-lg leading-relaxed text-foreground/90">{rec.short}</p>
          </div>

          {rec.history && (
            <div>
              <h2 className="font-display text-3xl font-semibold mb-3">History</h2>
              <p className="text-foreground/85 leading-relaxed whitespace-pre-line">{rec.history}</p>
            </div>
          )}

          {rec.architecture && (
            <div>
              <h2 className="font-display text-3xl font-semibold mb-3">Architecture &amp; Form</h2>
              <p className="text-foreground/85 leading-relaxed">{rec.architecture}</p>
            </div>
          )}

          {rec.significance && (
            <div>
              <h2 className="font-display text-3xl font-semibold mb-3">Cultural Significance</h2>
              <p className="text-foreground/85 leading-relaxed">{rec.significance}</p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="caption mb-2">Sources & Trust</div>
            <p className="text-sm text-muted-foreground">
              This record is curated from Virana's open heritage archive combining public cultural sources
              such as UNESCO, the Archaeological Survey of India, state cultural departments, and
              community contributions. All records are marked with their verification status.
            </p>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="caption mb-3">Key facts</div>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Location</dt><dd className="mt-0.5">{rec.state}{rec.district ? `, ${rec.district}` : ""}</dd></div>
              {rec.era && <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Era</dt><dd className="mt-0.5">{rec.era}</dd></div>}
              {rec.dynasty && <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Dynasty</dt><dd className="mt-0.5">{rec.dynasty}</dd></div>}
              {rec.builder && <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Builder</dt><dd className="mt-0.5">{rec.builder}</dd></div>}
              <div><dt className="text-muted-foreground text-xs uppercase tracking-wider">Preservation</dt><dd className={`mt-0.5 font-mono text-xs ${atRisk ? "text-red-500" : "text-emerald-500"}`}>{rec.preservation}</dd></div>
            </dl>
          </div>

          <SaveButton itemType="HERITAGE" itemId={rec.id} label="Save to My Virana" testId="heritage-save-btn" className="w-full justify-center !py-2.5" />

          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
            data-testid="share-btn"
            className="w-full flex items-center justify-center gap-2 border border-border bg-card hover:border-gold hover:text-gold rounded-full py-2.5 text-sm font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share this heritage
          </button>

          <Link
            to={`/explore?q=${encodeURIComponent(rec.name)}`}
            data-testid="open-on-map"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <MapPin className="w-4 h-4" /> Open on map
          </Link>
        </aside>
      </section>

      {/* RELATED */}
      {rec.related?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" data-testid="related-section">
          <div className="caption mb-2">Related heritage</div>
          <h2 className="font-display text-3xl font-semibold mb-6">Continue the journey.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rec.related.map(r => <HeritageCard key={r.id} record={r} testIdPrefix="related-card" />)}
          </div>
        </section>
      )}
    </div>
  );
}
