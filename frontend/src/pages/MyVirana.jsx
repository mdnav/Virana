import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Compass, Heart, ListChecks, FolderHeart, CalendarDays, Activity as ActivityIcon, Plus, Trash2, MapPin, BellRing } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchMe, fetchRecentlyExplored, fetchSaved, fetchContributions, fetchCollections, createCollection, deleteCollection, fetchActivity, fetchReminders } from "@/lib/api";
import HeritageCard from "@/components/HeritageCard";
import FestivalCard, { fmtRange, daysAway } from "@/components/FestivalCard";
import { toast } from "sonner";

const TABS = [
  { id: "recent", label: "Recently Explored", icon: Compass },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "contributions", label: "My Contributions", icon: ListChecks },
  { id: "collections", label: "Collections", icon: FolderHeart },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "activity", label: "Activity", icon: ActivityIcon },
];

function Empty({ text, cta, to }) {
  return (
    <div className="py-16 text-center" data-testid="tab-empty-state">
      <p className="text-muted-foreground text-sm">{text}</p>
      {cta && <Link to={to} className="inline-block mt-4 text-sm font-semibold text-gold hover:underline">{cta}</Link>}
    </div>
  );
}

function ItemGrid({ items }) {
  if (!items?.length) return null;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(it => it.kind === "FESTIVAL"
        ? <FestivalCard key={`f-${it.id}`} festival={{ ...it, months: [], description: "", type: it.type }} testIdPrefix="mv-festival" />
        : <HeritageCard key={`h-${it.id}`} record={it} testIdPrefix="mv-heritage" />)}
    </div>
  );
}

export default function MyVirana() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "recent";
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newCollection, setNewCollection] = useState("");

  useEffect(() => { fetchMe().then(setMe).catch(() => {}); }, [tab]);

  useEffect(() => {
    setLoading(true); setData(null);
    const load = {
      recent: () => fetchRecentlyExplored(),
      saved: () => fetchSaved(),
      contributions: () => fetchContributions(),
      collections: () => fetchCollections(),
      calendar: () => fetchReminders().then(async r => ({ reminders: r.reminders, saved: (await fetchSaved("FESTIVAL")).items })),
      activity: () => fetchActivity(),
    }[tab];
    load().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [tab]);

  const addCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.trim()) return;
    try {
      await createCollection(newCollection.trim());
      setNewCollection("");
      toast("Collection created");
      fetchCollections().then(setData);
    } catch { toast.error("Could not create collection"); }
  };

  const removeCollection = async (id) => {
    try {
      await deleteCollection(id);
      toast("Collection deleted");
      fetchCollections().then(setData);
    } catch { toast.error("Could not delete collection"); }
  };

  const stats = me?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="my-virana-page">
      {/* PROFILE HEADER */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden mb-8">
        <div className="h-24 gradient-royal opacity-80" />
        <div className="px-6 sm:px-8 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          {user?.profile_image ? (
            <img src={user.profile_image} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-card" />
          ) : (
            <div className="w-20 h-20 rounded-full gradient-royal border-4 border-card flex items-center justify-center text-white text-2xl font-bold">
              {(user?.display_name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-3xl font-semibold" data-testid="profile-name">{user?.display_name || "Explorer"}</h1>
            <div className="caption text-gold mt-0.5">Heritage Explorer</div>
            {user?.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
          </div>
          <div className="flex gap-6 text-center" data-testid="profile-stats">
            {[["explored", "Explored"], ["saved", "Saved"], ["contributions", "Contributions"]].map(([k, l]) => (
              <div key={k}>
                <div className="font-display text-2xl text-gold">{stats[k] ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-8" data-testid="my-virana-tabs">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setParams({ tab: t.id })} data-testid={`tab-${t.id}`}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border transition-colors ${
              tab === t.id ? "bg-gold text-background border-transparent font-semibold" : "bg-card border-border hover:border-gold"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card h-64 animate-pulse" />)}
        </div>
      ) : (
        <div data-testid={`tab-content-${tab}`}>
          {tab === "recent" && (data?.items?.length ? <ItemGrid items={data.items} /> :
            <Empty text="You haven't explored anything yet. Every journey begins with a single step." cta="Explore the map →" to="/explore" />)}

          {tab === "saved" && (data?.items?.length ? <ItemGrid items={data.items.map(i => i.item)} /> :
            <Empty text="No saved heritage yet. Tap the ♡ on any heritage or festival to keep it here." cta="Discover heritage →" to="/explore" />)}

          {tab === "contributions" && (data?.contributions?.length ? (
            <div className="space-y-3">
              {data.contributions.map(c => (
                <div key={c.id} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{c.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.created_at?.slice(0, 10)}</div>
                  </div>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-full ${
                    c.status === "PUBLISHED" ? "bg-emerald-600/20 text-emerald-500" :
                    c.status === "REJECTED" ? "bg-red-600/20 text-red-500" : "bg-amber-600/20 text-amber-500"}`}>
                    {c.status || "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          ) : <Empty text="No contributions yet. Community contributions are opening soon — you'll be able to document heritage from your own region." />)}

          {tab === "collections" && (
            <div>
              <form onSubmit={addCollection} className="flex gap-2 mb-6 max-w-md">
                <input value={newCollection} onChange={e => setNewCollection(e.target.value)} data-testid="new-collection-input"
                  placeholder="Name a new collection (e.g. Temple Trail 2026)"
                  className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-gold" />
                <button type="submit" data-testid="create-collection-btn" className="bg-primary text-primary-foreground rounded-full px-4 py-2.5 text-sm font-semibold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Create
                </button>
              </form>
              {data?.collections?.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.collections.map(c => (
                    <div key={c.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`collection-${c.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-display text-lg font-semibold">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.item_count} items</div>
                        </div>
                        <button onClick={() => removeCollection(c.id)} data-testid={`delete-collection-${c.id}`} className="text-muted-foreground hover:text-red-500 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {c.preview?.length ? c.preview.map(p => (
                          <img key={p.id} src={p.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        )) : <div className="text-xs text-muted-foreground">Empty — add items from any heritage page.</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Empty text="No collections yet. Create one above to curate your own heritage journeys." />}
            </div>
          )}

          {tab === "calendar" && (
            <div className="space-y-10">
              <div>
                <h3 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><BellRing className="w-5 h-5 text-gold" /> Festival reminders</h3>
                {data?.reminders?.length ? (
                  <div className="space-y-3">
                    {data.reminders.map(f => (
                      <Link key={f.id} to={`/festival/${f.id}`} data-testid={`reminder-${f.id}`} className="flex gap-4 items-center rounded-2xl border border-border bg-card p-3 hover-lift">
                        <img src={f.image} alt="" className="w-16 h-12 rounded-xl object-cover" />
                        <div>
                          <div className="font-semibold text-sm">{f.name}</div>
                          <div className="text-xs text-muted-foreground">{fmtRange(f.start_date, f.end_date)} · {f.state}</div>
                        </div>
                        {daysAway(f.start_date) >= 0 && <span className="ml-auto text-xs font-mono text-gold">{daysAway(f.start_date)} days</span>}
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No reminders set. Open any festival and tap "Remind Me".</p>}
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> Saved festivals</h3>
                {data?.saved?.length ? <ItemGrid items={data.saved.map(i => i.item)} /> :
                  <p className="text-sm text-muted-foreground">No saved festivals yet. <Link to="/calendar" className="text-gold hover:underline">Browse the cultural calendar →</Link></p>}
              </div>
            </div>
          )}

          {tab === "activity" && (data?.activity?.length ? (
            <div className="space-y-2" data-testid="activity-list">
              {data.activity.map(a => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                  <span className="capitalize font-semibold text-gold">{a.action.replace("_", " ")}</span>
                  {a.item ? (
                    <Link to={a.item.kind === "FESTIVAL" ? `/festival/${a.item.id}` : `/heritage/${a.item.id}`} className="hover:text-gold flex items-center gap-1">
                      {a.item.name} <MapPin className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{a.item.state}</span>
                    </Link>
                  ) : <span className="text-muted-foreground">{a.meta?.name || ""}</span>}
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{a.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          ) : <Empty text="No activity yet. Your exploration story will be written here." cta="Start exploring →" to="/explore" />)}
        </div>
      )}
    </div>
  );
}
