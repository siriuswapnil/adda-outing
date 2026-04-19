"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map, Marker, LngLatLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapPin = { lat: number; lng: number; name: string };
export type MapSuggestion = {
  lat: number;
  lng: number;
  name: string;
  rank: number;
};

type Props = {
  pins: MapPin[];
  midpoint: { lat: number; lng: number } | null;
  suggestions: MapSuggestion[];
  onMapClick: (lat: number, lng: number) => void;
  clickEnabled: boolean;
  // Used to trigger map.resize() after container width animation
  resizeKey: string | number;
};

// Free OSM raster tiles via the MapLibre demo style (no key)
const STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
    },
  ],
};

const BANGALORE_CENTER: LngLatLike = [77.59, 12.97];

export default function LiveMap({
  pins,
  midpoint,
  suggestions,
  onMapClick,
  clickEnabled,
  resizeKey,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const clickEnabledRef = useRef(clickEnabled);
  const onClickRef = useRef(onMapClick);

  // Keep refs in sync so we can read latest values inside the map's click handler
  useEffect(() => {
    clickEnabledRef.current = clickEnabled;
    onClickRef.current = onMapClick;
  }, [clickEnabled, onMapClick]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const m = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: BANGALORE_CENTER,
      zoom: 11.2,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("click", (e) => {
      if (!clickEnabledRef.current) return;
      onClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });
    mapRef.current = m;
    return () => {
      m.remove();
      mapRef.current = null;
    };
  }, []);

  // Resize when parent container changes (post-animation)
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    // Poll resizes across a 700ms window to cover the flex-basis transition
    const t1 = setTimeout(() => m.resize(), 50);
    const t2 = setTimeout(() => m.resize(), 350);
    const t3 = setTimeout(() => m.resize(), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [resizeKey]);

  // Re-render markers on any pin/suggestion change
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    // Clear old markers
    for (const mk of markersRef.current) mk.remove();
    markersRef.current = [];

    // Friend pins
    for (const p of pins) {
      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;pointer-events:none;";
      el.innerHTML = `
        <div style="background:#1f1410;color:#fff;font-size:11px;font-weight:500;padding:2px 8px;border-radius:6px;white-space:nowrap;">${p.name}</div>
        <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid #1f1410;"></div>
      `;
      const mk = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .addTo(m);
      markersRef.current.push(mk);
    }

    // Midpoint
    if (midpoint) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #1f1410;box-shadow:0 1px 2px rgba(0,0,0,.2);";
      const mk = new maplibregl.Marker({ element: el })
        .setLngLat([midpoint.lng, midpoint.lat])
        .addTo(m);
      markersRef.current.push(mk);
    }

    // Suggestion pins
    for (const s of suggestions) {
      const isTop = s.rank === 1;
      const bg = isTop ? "#c2410c" : "rgba(31,20,16,0.85)";
      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;pointer-events:none;";
      el.innerHTML = `
        <div style="background:${bg};color:#fff;font-size:11px;font-weight:500;padding:3px 10px;border-radius:8px;white-space:nowrap;display:flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(0,0,0,.18);">
          <span style="font-weight:700;">#${s.rank}</span>
          <span>${s.name}</span>
        </div>
        <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid ${bg};"></div>
      `;
      const mk = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([s.lng, s.lat])
        .addTo(m);
      markersRef.current.push(mk);
    }

    // If we have suggestions, fit bounds around pins + suggestions
    if (suggestions.length && pins.length) {
      const bounds = new maplibregl.LngLatBounds();
      for (const p of pins) bounds.extend([p.lng, p.lat]);
      for (const s of suggestions) bounds.extend([s.lng, s.lat]);
      m.fitBounds(bounds, { padding: 60, duration: 700 });
    }
  }, [pins, midpoint, suggestions]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${clickEnabled ? "cursor-crosshair" : ""}`}
    />
  );
}
