"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { configureDefaultMarkerIcon } from "@/lib/leaflet-icon";
import type { RentReport } from "@/lib/types";
import { roomLabel, isRoomOption } from "@/lib/rooms";

// Serbia's approximate centroid — default view when the map first loads.
const SERBIA_CENTER: [number, number] = [44.0165, 21.0059];
const DEFAULT_ZOOM = 7;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(report: RentReport): string {
  const rooms = isRoomOption(report.rooms) ? roomLabel(report.rooms) : report.rooms;
  const size = report.size_m2 ? `, ${report.size_m2} m²` : "";
  const note = report.note
    ? `<p style="margin:6px 0 0;color:#6b7280;">${escapeHtml(report.note)}</p>`
    : "";
  return `
    <div style="font-family:inherit;min-width:160px;">
      <strong>${escapeHtml(report.neighborhood)}, ${escapeHtml(report.city)}</strong>
      <p style="margin:4px 0 0;">€${report.rent_eur.toFixed(0)}/mo &middot; ${escapeHtml(rooms)}${size}</p>
      ${note}
    </div>
  `;
}

/**
 * Read-only map of rent reports. Vanilla Leaflet (no react-leaflet
 * dependency, so the whole integration is just this one file plus the icon
 * fix in `lib/leaflet-icon.ts`). This component is only ever rendered via
 * `next/dynamic({ ssr: false })` (see `RentMapLoader.tsx`), which is what
 * makes it safe to `import "leaflet"` at the top of the file — Leaflet
 * touches `window`/`document` at module-init time and would crash during
 * any server render, but `ssr: false` guarantees this module is only ever
 * loaded in the browser.
 */
export function RentMap({ reports }: { reports: RentReport[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Create the map once on mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    configureDefaultMarkerIcon(L);

    const map = L.map(containerRef.current).setView(SERBIA_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Sync markers whenever the (already server-filtered-or-not) report list
  // changes, without recreating the whole map.
  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;

    layer.clearLayers();
    for (const report of reports) {
      L.marker([report.lat, report.lng]).addTo(layer).bindPopup(popupHtml(report));
    }
  }, [reports]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full rounded-brand border border-border"
      role="img"
      aria-label="Map of reported rent prices"
    />
  );
}
