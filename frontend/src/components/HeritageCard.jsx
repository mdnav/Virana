import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, AlertTriangle } from "lucide-react";
import { CATEGORY_META } from "@/data/constants";

export default function HeritageCard({ record, testIdPrefix = "heritage-card" }) {
  if (!record) return null;
  const cat = CATEGORY_META[record.category] || { name: record.category, color: "#F56A1E" };
  const atRisk = record.preservation === "AT_RISK";

  return (
    <Link
      to={`/heritage/${record.id}`}
      data-testid={`${testIdPrefix}-${record.id}`}
      className="group block hover-lift rounded-2xl overflow-hidden border border-border bg-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={record.image}
          alt={record.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1526711657229-e7e080ed7aa1?q=80&w=1200"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className="caption bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10 text-white"
            style={{ color: cat.color }}
          >
            {cat.name}
          </span>
        </div>
        {atRisk && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-mono bg-red-600/90 text-white px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" /> AT RISK
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-display text-xl font-semibold leading-tight drop-shadow">{record.name}</h3>
          <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
            <MapPin className="w-3 h-3" />
            {record.state}{record.district ? ` · ${record.district}` : ""}
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{record.short}</p>
        {record.status === "verified" && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Heritage
          </div>
        )}
      </div>
    </Link>
  );
}
