import React from "react";
import { Link } from "react-router-dom";
import { MapPin, CalendarDays, ShieldCheck } from "lucide-react";
import SaveButton from "./SaveButton";

export const TYPE_META = {
  religious: { name: "Religious", color: "#E89B17" },
  harvest: { name: "Harvest", color: "#1B7A56" },
  cultural: { name: "Cultural", color: "#D4368A" },
  tribal: { name: "Tribal", color: "#8B4513" },
  national: { name: "National", color: "#2B3A67" },
  seasonal: { name: "Seasonal", color: "#3B5998" },
};

const FALLBACK = "https://static.prod-images.emergentagent.com/jobs/f4c46e26-5f92-4e0f-a80a-c173853e8734/images/011c85845d5dcc2dd156396a9147af852e82163dcb52bccdb5c42cf458d28c69.jpeg";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtRange(start, end) {
  if (start === end) return `${fmtDate(start)}, 2026`;
  return `${fmtDate(start)} – ${fmtDate(end)}, 2026`;
}

export function daysAway(start) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(start + "T00:00:00") - today) / 86400000);
}

export default function FestivalCard({ festival, testIdPrefix = "festival-card" }) {
  if (!festival) return null;
  const t = TYPE_META[festival.type] || { name: festival.type, color: "#F56A1E" };
  const days = daysAway(festival.start_date);
  const ongoing = days <= 0 && daysAway(festival.end_date) >= 0;

  return (
    <div className="group relative hover-lift rounded-2xl overflow-hidden border border-border bg-card" data-testid={`${testIdPrefix}-${festival.id}`}>
      <Link to={`/festival/${festival.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          <img src={festival.image} alt={festival.name} loading="lazy"
            onError={(e) => { e.currentTarget.src = FALLBACK; }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <span className="absolute top-3 left-3 caption bg-black/45 backdrop-blur px-2.5 py-1 rounded-full border border-white/10" style={{ color: t.color }}>
            {t.name}
          </span>
          {ongoing ? (
            <span className="absolute top-3 right-3 text-xs font-mono bg-emerald-600/90 text-white px-2 py-1 rounded-full">Happening now</span>
          ) : days > 0 && days <= 60 ? (
            <span className="absolute top-3 right-3 text-xs font-mono bg-gold text-background px-2 py-1 rounded-full">{days} days away</span>
          ) : null}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="font-display text-xl font-semibold leading-tight drop-shadow">{festival.name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-90 mt-1">
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {fmtRange(festival.start_date, festival.end_date)}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {festival.state}</span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{festival.description}</p>
          {festival.verification === "verified" && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified dates · 2026 Panchang
            </div>
          )}
        </div>
      </Link>
      <div className="absolute bottom-3 right-3">
        <SaveButton itemType="FESTIVAL" itemId={festival.id} label="" testId={`fest-save-${festival.id}`} className="!px-2.5 !py-2" />
      </div>
    </div>
  );
}

export function FestivalSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card animate-pulse" data-testid="festival-skeleton">
      <div className="aspect-[16/10] bg-secondary" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
    </div>
  );
}
