import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Filter, Search, X } from "lucide-react";
import { fetchHeritage, searchHeritage, fetchStates } from "@/lib/api";
import { CATEGORY_META, CATEGORY_ORDER } from "@/data/constants";
import { useTheme } from "@/components/ThemeProvider";

// Custom pin icon per category
const makeIcon = (color) =>
  L.divIcon({
    className: "virana-pin",
    html: `<div style="width:22px;height:22px;background:${color};border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.35);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom || 7, { duration: 1.2 });
  }, [target, map]);
  return null;
}

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const { theme } = useTheme();
  const [records, setRecords] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCats, setSelectedCats] = useState(new Set());
  const [selectedState, setSelectedState] = useState(null);
  const [query, setQuery] = useState(params.get("q") || "");
  const [target, setTarget] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);

  const paramCat = params.get("category");
  const paramLat = params.get("lat");
  const paramLabel = params.get("label");

  useEffect(() => {
    if (paramCat) setSelectedCats(new Set([paramCat]));
  }, [paramCat]);

  useEffect(() => {
    if (paramLat) {
      const lat = parseFloat(params.get("lat"));
      const lng = parseFloat(params.get("lng"));
      const zoom = parseFloat(params.get("zoom")) || 9;
      if (!isNaN(lat) && !isNaN(lng)) setTarget({ lat, lng, zoom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramLat]);

  useEffect(() => {
    fetchStates().then(setStates).catch(() => {});
    fetchHeritage({ limit: 500 }).then(d => setRecords(d.records || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const q = params.get("q");
    if (q) {
      searchHeritage(q).then(d => {
        setRecords(d.records || []);
        if (d.records && d.records[0]) {
          setTarget({ lat: d.records[0].lat, lng: d.records[0].lng, zoom: 8 });
          setSelectedRec(d.records[0]);
        }
      }).catch(() => {});
    }
  }, [params]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (selectedCats.size > 0 && !selectedCats.has(r.category)) return false;
      if (selectedState && r.state !== selectedState.name) return false;
      return true;
    });
  }, [records, selectedCats, selectedState]);

  const toggleCat = (id) => {
    const next = new Set(selectedCats);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedCats(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setParams(query.trim() ? { q: query.trim() } : {});
  };

  const selectState = (s) => {
    setSelectedState(s);
    setTarget({ lat: s.lat, lng: s.lng, zoom: 7 });
  };

  const tileLayer = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="explore-page">
      <div className="mb-6">
        <div className="caption">Explore India</div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-1">The Cultural Map.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Filter by category, drill down by state, and open any pin to enter its living heritage story.
        </p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* SIDEBAR */}
        <aside className="space-y-5" data-testid="explore-sidebar">
          <form onSubmit={submitSearch} className="flex items-center bg-card border border-border rounded-full pl-4 pr-1 py-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              data-testid="explore-search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search heritage..."
              className="bg-transparent flex-1 py-2 px-2 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button type="submit" data-testid="explore-search-submit" className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-semibold">Go</button>
          </form>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="caption flex items-center gap-1"><Filter className="w-3 h-3" /> Categories</div>
              {selectedCats.size > 0 && (
                <button onClick={() => setSelectedCats(new Set())} className="text-xs text-muted-foreground hover:text-gold" data-testid="clear-categories">Clear</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ORDER.map(id => {
                const c = CATEGORY_META[id];
                const active = selectedCats.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleCat(id)}
                    data-testid={`filter-cat-${id}`}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active ? "text-white border-transparent" : "bg-secondary/50 border-border text-foreground/80 hover:border-gold"
                    }`}
                    style={active ? { backgroundColor: c.color } : {}}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="caption">States</div>
              {selectedState && (
                <button onClick={() => { setSelectedState(null); setTarget({ lat: 22.5, lng: 79, zoom: 4.4 }); }} className="text-xs text-muted-foreground hover:text-gold" data-testid="clear-state">
                  <X className="w-3 h-3 inline" /> Reset
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-52 overflow-auto">
              {states.map(s => (
                <button
                  key={s.code}
                  onClick={() => selectState(s)}
                  data-testid={`state-btn-${s.code}`}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedState?.code === s.code ? "bg-gold text-background border-transparent" : "bg-secondary/40 border-border hover:border-gold"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="caption mb-2">Results ({filtered.length})</div>
            <div className="space-y-2 max-h-96 overflow-auto pr-1">
              {filtered.slice(0, 30).map(r => (
                <button
                  key={r.id}
                  onClick={() => { setTarget({ lat: r.lat, lng: r.lng, zoom: 9 }); setSelectedRec(r); }}
                  data-testid={`result-${r.id}`}
                  className="w-full text-left flex gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                >
                  <img src={r.image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {r.state}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider mt-0.5" style={{ color: CATEGORY_META[r.category]?.color }}>
                      {CATEGORY_META[r.category]?.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAP */}
        <div className="rounded-2xl border border-border overflow-hidden heritage-glow" style={{ height: "76vh" }} data-testid="map-container">
          <MapContainer center={[22.5, 79]} zoom={4.4} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='© OpenStreetMap contributors, © CARTO'
              url={tileLayer}
            />
            {filtered.map(r => (
              <Marker
                key={r.id}
                position={[r.lat, r.lng]}
                icon={makeIcon(CATEGORY_META[r.category]?.color || "#F56A1E")}
                eventHandlers={{ click: () => setSelectedRec(r) }}
              >
                <Popup>
                  <div className="min-w-48">
                    <img src={r.image} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />
                    <div style={{ fontWeight: 700, marginTop: 6 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{r.state}</div>
                    <Link to={`/heritage/${r.id}`} data-testid={`popup-open-${r.id}`} style={{ display: "inline-block", marginTop: 8, color: "#F56A1E", fontWeight: 600, fontSize: 13 }}>
                      Open full story →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
            {paramLat && !isNaN(parseFloat(paramLat)) && (
              <Marker
                position={[parseFloat(paramLat), parseFloat(params.get("lng"))]}
                icon={makeIcon("#E89B17")}
              >
                <Popup>
                  <div style={{ fontWeight: 700 }}>{paramLabel || "Festival location"}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>Festival epicentre — nearby heritage shown on the map</div>
                </Popup>
              </Marker>
            )}
            <FlyTo target={target} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
