import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { layerColorExpr } from "@/data/mapLayers";

const INDIA_CENTER = [80.5, 22.6];
const INDIA_ZOOM = 3.9;

// compute [minLng,minLat,maxLng,maxLat] from a GeoJSON geometry
function geomBBox(geom) {
  let mnx = 180, mny = 90, mxx = -180, mxy = -90;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      mnx = Math.min(mnx, c[0]); mxx = Math.max(mxx, c[0]);
      mny = Math.min(mny, c[1]); mxy = Math.max(mxy, c[1]);
    } else c.forEach(walk);
  };
  walk(geom.coordinates);
  return [mnx, mny, mxx, mxy];
}

const MapCanvas = forwardRef(function MapCanvas(
  { styleUrl, geojson, selectedState, isDark,
    onSelectRecord, onSelectRegion, onHoverRegion }, ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const geojsonRef = useRef(geojson);
  const statesRef = useRef(null);
  const hoverIdRef = useRef(null);
  const readyRef = useRef(false);
  const cbRef = useRef({});
  cbRef.current = { onSelectRecord, onSelectRegion, onHoverRegion };

  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat, zoom = 9) =>
      mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1400, essential: true }),
    resetView: () =>
      mapRef.current?.flyTo({ center: INDIA_CENTER, zoom: INDIA_ZOOM, duration: 1200 }),
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    fitState: (name) => fitState(name),
    locate: (cb) => {
      if (!navigator.geolocation) return cb && cb(null);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const { longitude, latitude } = p.coords;
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 8, duration: 1600 });
          cb && cb({ lat: latitude, lng: longitude });
        },
        () => cb && cb(null),
        { timeout: 8000 }
      );
    },
  }));

  function fitState(name) {
    const fc = statesRef.current;
    if (!fc || !mapRef.current) return;
    const f = fc.features.find((x) => x.properties.name === name);
    if (!f) return;
    const [mnx, mny, mxx, mxy] = geomBBox(f.geometry);
    mapRef.current.fitBounds([[mnx, mny], [mxx, mxy]], { padding: 80, duration: 1400 });
  }

  // ---- add all custom sources + layers (also re-run after setStyle) ----
  function addLayers() {
    const map = mapRef.current;
    if (!map) return;

    if (!map.getSource("states")) {
      map.addSource("states", { type: "geojson", data: "/geo/states.geojson", generateId: true });
    }
    if (!map.getSource("districts")) {
      map.addSource("districts", { type: "geojson", data: "/geo/districts.geojson" });
    }
    if (!map.getSource("records")) {
      map.addSource("records", {
        type: "geojson", data: geojsonRef.current || { type: "FeatureCollection", features: [] },
        cluster: true, clusterRadius: 46, clusterMaxZoom: 9,
      });
    }

    const gold = "#E89B17";
    const lineColor = isDark ? "rgba(232,155,23,0.55)" : "rgba(43,58,103,0.35)";

    // state fill (hover + selection)
    map.addLayer({
      id: "state-fill", type: "fill", source: "states",
      paint: {
        "fill-color": gold,
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false], 0.14,
          0,
        ],
      },
    });
    // dim everything except selected state
    map.addLayer({
      id: "state-dim", type: "fill", source: "states",
      paint: { "fill-color": isDark ? "#0b1020" : "#1a1f2e", "fill-opacity": 0 },
      filter: ["==", ["get", "name"], "___none___"],
    });
    map.addLayer({
      id: "state-line", type: "line", source: "states",
      paint: { "line-color": lineColor, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 7, 1.8] },
    });
    map.addLayer({
      id: "state-label", type: "symbol", source: "states",
      layout: {
        "text-field": ["get", "name"], "text-size": ["interpolate", ["linear"], ["zoom"], 4, 9, 6, 13],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": isDark ? "#E8C877" : "#2B3A67",
        "text-halo-color": isDark ? "#0b1020" : "#ffffff", "text-halo-width": 1.4,
      },
      maxzoom: 7,
    });
    // districts
    map.addLayer({
      id: "district-line", type: "line", source: "districts", minzoom: 6,
      paint: { "line-color": isDark ? "rgba(232,155,23,0.3)" : "rgba(43,58,103,0.22)", "line-width": 0.7, "line-dasharray": [2, 2] },
    });
    map.addLayer({
      id: "district-label", type: "symbol", source: "districts", minzoom: 7.5,
      layout: { "text-field": ["get", "name"], "text-size": 11, "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"] },
      paint: { "text-color": isDark ? "#c9b98f" : "#5b6478", "text-halo-color": isDark ? "#0b1020" : "#fff", "text-halo-width": 1 },
    });

    // clusters
    map.addLayer({
      id: "clusters", type: "circle", source: "records", filter: ["has", "point_count"],
      paint: {
        "circle-color": ["step", ["get", "point_count"], "#E89B17", 10, "#D98A12", 30, "#C77A0C"],
        "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 30, 30],
        "circle-opacity": 0.92,
        "circle-stroke-width": 3, "circle-stroke-color": isDark ? "rgba(11,16,32,0.9)" : "rgba(255,255,255,0.9)",
      },
    });
    map.addLayer({
      id: "cluster-count", type: "symbol", source: "records", filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"] },
      paint: { "text-color": "#1a1305" },
    });
    // unclustered points — soft halo + solid + risk ring
    map.addLayer({
      id: "points-halo", type: "circle", source: "records", filter: ["!", ["has", "point_count"]],
      paint: { "circle-color": layerColorExpr(), "circle-radius": 14, "circle-opacity": 0.18 },
    });
    map.addLayer({
      id: "points", type: "circle", source: "records", filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": layerColorExpr(), "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 9, 8],
        "circle-stroke-width": 2, "circle-stroke-color": "#ffffff",
      },
    });
    map.addLayer({
      id: "points-risk", type: "circle", source: "records",
      filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "risk"], true]],
      paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": 12, "circle-stroke-width": 2, "circle-stroke-color": "#DC2626" },
    });

    wireEvents();
    applySelection();
    readyRef.current = true;
  }

  function wireEvents() {
    const map = mapRef.current;
    const setCursor = (c) => (map.getCanvas().style.cursor = c);

    map.on("mousemove", "state-fill", (e) => {
      if (!e.features.length) return;
      const f = e.features[0];
      if (hoverIdRef.current !== null) map.setFeatureState({ source: "states", id: hoverIdRef.current }, { hover: false });
      hoverIdRef.current = f.id;
      map.setFeatureState({ source: "states", id: f.id }, { hover: true });
      setCursor("pointer");
      cbRef.current.onHoverRegion?.(f.properties.name, { x: e.point.x, y: e.point.y });
    });
    map.on("mouseleave", "state-fill", () => {
      if (hoverIdRef.current !== null) map.setFeatureState({ source: "states", id: hoverIdRef.current }, { hover: false });
      hoverIdRef.current = null;
      setCursor("");
      cbRef.current.onHoverRegion?.(null);
    });
    map.on("click", "state-fill", (e) => {
      const name = e.features[0]?.properties?.name;
      if (name) { cbRef.current.onSelectRegion?.(name); fitState(name); }
    });

    ["points", "points-risk"].forEach((id) => {
      map.on("click", id, (e) => {
        const p = e.features[0].properties;
        cbRef.current.onSelectRecord?.(p);
      });
      map.on("mouseenter", id, () => setCursor("pointer"));
      map.on("mouseleave", id, () => setCursor(""));
    });

    map.on("click", "clusters", async (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
      const src = map.getSource("records");
      const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id);
      map.easeTo({ center: f.geometry.coordinates, zoom });
    });
    map.on("mouseenter", "clusters", () => setCursor("pointer"));
    map.on("mouseleave", "clusters", () => setCursor(""));
  }

  function applySelection() {
    const map = mapRef.current;
    if (!map || !map.getLayer("state-dim")) return;
    if (selectedState) {
      map.setFilter("state-dim", ["!=", ["get", "name"], selectedState]);
      map.setPaintProperty("state-dim", "fill-opacity", isDark ? 0.55 : 0.4);
      if (map.getLayer("district-line")) map.setFilter("district-line", ["==", ["get", "state"], selectedState]);
      if (map.getLayer("district-label")) map.setFilter("district-label", ["==", ["get", "state"], selectedState]);
    } else {
      map.setFilter("state-dim", ["==", ["get", "name"], "___none___"]);
      map.setPaintProperty("state-dim", "fill-opacity", 0);
      if (map.getLayer("district-line")) map.setFilter("district-line", null);
      if (map.getLayer("district-label")) map.setFilter("district-label", null);
    }
  }

  // init map once
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      attributionControl: { compact: true },
      maxBounds: [[60, 2], [100, 40]],
    });
    mapRef.current = map;
    map.on("load", addLayers);
    fetch("/geo/states.geojson").then((r) => r.json()).then((d) => (statesRef.current = d)).catch(() => {});
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // style switch → re-add custom layers after new style loads
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    readyRef.current = false;
    map.setStyle(styleUrl);
    map.once("styledata", () => { addLayers(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl, isDark]);

  // records data update
  useEffect(() => {
    geojsonRef.current = geojson;
    const src = mapRef.current?.getSource("records");
    if (src) src.setData(geojson);
  }, [geojson]);

  // selection update
  useEffect(() => { applySelection(); /* eslint-disable-next-line */ }, [selectedState]);

  return <div ref={containerRef} className="w-full h-full" data-testid="maplibre-canvas" />;
});

export default MapCanvas;
