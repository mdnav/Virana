// Cultural layer taxonomy — mirrors backend map_service.LAYER_META.
// Icons from lucide-react.
import {
  Landmark, Sparkles, Music, Utensils, Palette, Languages,
  BookOpen, AlertTriangle, PartyPopper,
} from "lucide-react";

export const LAYERS = [
  { id: "heritage",  name: "Heritage & Monuments", color: "#E89B17", Icon: Landmark },
  { id: "festivals", name: "Festivals",            color: "#D4368A", Icon: PartyPopper },
  { id: "dance",     name: "Dance",                color: "#C85A32", Icon: Sparkles },
  { id: "music",     name: "Music & Instruments",  color: "#3B5998", Icon: Music },
  { id: "food",      name: "Food & Spices",        color: "#B8433E", Icon: Utensils },
  { id: "crafts",    name: "Arts & Crafts",        color: "#1B7A56", Icon: Palette },
  { id: "languages", name: "Languages",            color: "#6E4C9E", Icon: Languages },
  { id: "rituals",   name: "Rituals & Stories",    color: "#7A6C48", Icon: BookOpen },
  { id: "at_risk",   name: "Heritage at Risk",     color: "#DC2626", Icon: AlertTriangle },
];

export const LAYER_MAP = LAYERS.reduce((a, l) => ((a[l.id] = l), a), {});

// MapLibre "match" expression for marker fill color by layer property.
export const layerColorExpr = () => {
  const expr = ["match", ["get", "layer"]];
  LAYERS.forEach((l) => { if (l.id !== "at_risk") { expr.push(l.id, l.color); } });
  expr.push("#E89B17");
  return expr;
};

// Keyless CARTO vector basemap styles (work natively with MapLibre GL).
export const MAP_STYLES = {
  heritage: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  standard: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark:     "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};
