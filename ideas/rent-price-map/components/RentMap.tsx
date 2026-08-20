"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AnimatePresence, motion } from "framer-motion";
import { configureDefaultMarkerIcon } from "@/lib/leaflet-icon";
import { GlassPanel } from "@/components/motion/GlassPanel";
import type { RentReport } from "@/lib/types";
import { roomLabel, isRoomOption } from "@/lib/rooms";

// Serbia's approximate centroid — default view when the map first loads.
const SERBIA_CENTER: [number, number] = [44.0165, 21.0059];
const DEFAULT_ZOOM = 7;

/**
 * Custom price-tag `L.divIcon` instead of Leaflet's default pin. Leaflet
 * markers are plain DOM (an HTML string), not React, so the "marker reveal"
 * animation lives in CSS (`.rpm-marker` / `@keyframes rpm-marker-pop` in
 * `app/globals.css`) rather than Framer Motion — each marker gets a small
 * staggered `animation-delay` so a filtered/reloaded set of pins pops in as
 * a cluster instead of appearing all at once.
 */
function priceIcon(report: RentReport, index: number, active: boolean): L.DivIcon {
  const price = Math.round(report.rent_eur);
  const delay = Math.min(index * 35, 450);
  return L.divIcon({
    html: `<span class="rpm-marker${active ? " rpm-marker-active" : ""}" style="animation-delay:${delay}ms">€${price}</span>`,
    className: "", // override Leaflet's default `leaflet-div-icon` box styling entirely
    iconSize: [52, 26],
    iconAnchor: [26, 13],
  });
}

interface PopupPosition {
  x: number;
  y: number;
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
 *
 * Design-system v2 (Tier 3 flagship) pass: markers are an animated
 * price-tag `divIcon` instead of Leaflet's default pin, and the popup is a
 * real React tree (a `GlassPanel` inside a `motion.div`, animated in/out via
 * `AnimatePresence`) positioned over the map by converting the report's
 * lat/lng to a container pixel point, instead of Leaflet's built-in
 * `bindPopup`/HTML-string popup. Data flow is unchanged: markers are still
 * built from the exact same `reports` prop passed in from the server-fetched
 * data in `app/page.tsx`.
 */
export function RentMap({
  reports,
  onVisibleReportsChange,
}: {
  reports: RentReport[];
  /** Called whenever the set of reports currently within the map's viewport
   * changes (pan, zoom, or the `reports` prop itself changing) — lets the
   * parent show area-level stats (avg/median rent) for what's on screen. */
  onVisibleReportsChange?: (visible: RentReport[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const reportsRef = useRef<RentReport[]>(reports);
  const onVisibleChangeRef = useRef(onVisibleReportsChange);

  const [activeReport, setActiveReport] = useState<RentReport | null>(null);
  const [popupPos, setPopupPos] = useState<PopupPosition | null>(null);

  // Keep the latest props available to map event handlers registered once
  // on mount, without needing to re-register them on every render.
  reportsRef.current = reports;
  onVisibleChangeRef.current = onVisibleReportsChange;

  const computeVisible = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const visible = reportsRef.current.filter((r) => bounds.contains([r.lat, r.lng]));
    onVisibleChangeRef.current?.(visible);
  }, []);

  const closePopup = useCallback(() => {
    setActiveReport(null);
    setPopupPos(null);
  }, []);

  const openPopup = useCallback((report: RentReport) => {
    const map = mapRef.current;
    if (!map) return;
    const point = map.latLngToContainerPoint([report.lat, report.lng]);
    setActiveReport(report);
    setPopupPos({ x: point.x, y: point.y });
  }, []);

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
    const markerLayer = L.layerGroup().addTo(map);
    markersRef.current = markerLayer;
    // Captured here (effect-setup time) rather than read fresh inside the
    // cleanup closure below, per the exhaustive-deps rule's own guidance —
    // `markersByIdRef.current` is the same Map instance for this map's
    // whole lifetime (only its *contents* are mutated by the marker-sync
    // effect), so this is also just correct: always clears the right Map.
    const markersById = markersByIdRef.current;

    // The popup is a positioned React overlay, not Leaflet's own popup, so
    // it needs to be repositioned (or dismissed) whenever the map view
    // changes. Recomputing continuously during a drag/zoom animation would
    // be both noisy and imprecise, so pan/zoom simply dismisses the popup —
    // the open/close animation is the point here, not live drag-tracking.
    map.on("movestart zoomstart", closePopup);
    map.on("moveend zoomend", computeVisible);
    map.on("click", closePopup);
    computeVisible();

    return () => {
      map.off("movestart zoomstart", closePopup);
      map.off("moveend zoomend", computeVisible);
      map.off("click", closePopup);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      markersById.clear();
    };
  }, [closePopup, computeVisible]);

  // Dismiss the popup on Escape, in addition to the close button / map click.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePopup();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closePopup]);

  // Rebuild markers whenever the (already server-filtered-or-not) report
  // list changes, without recreating the whole map. Any open popup refers
  // to a marker that's about to be destroyed, so close it first.
  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;

    closePopup();
    layer.clearLayers();
    markersByIdRef.current.clear();

    reports.forEach((report, index) => {
      const marker = L.marker([report.lat, report.lng], {
        icon: priceIcon(report, index, false),
      }).addTo(layer);
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        openPopup(report);
      });
      markersByIdRef.current.set(report.id, marker);
    });

    computeVisible();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closePopup/computeVisible/openPopup are stable (useCallback, empty deps)
  }, [reports]);

  // Toggle the "active" styling on the selected marker's icon without
  // rebuilding the whole layer (re-triggers that marker's pop-in CSS
  // animation as a little confirmation bounce, which reads as intentional).
  useEffect(() => {
    markersByIdRef.current.forEach((marker, id) => {
      const report = reports.find((r) => r.id === id);
      if (!report) return;
      const index = reports.indexOf(report);
      marker.setIcon(priceIcon(report, index, activeReport?.id === id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when selection changes, not on every reports identity change
  }, [activeReport]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[420px] w-full overflow-hidden rounded-brand border border-border"
        role="img"
        aria-label="Map of reported rent prices"
      />
      <AnimatePresence>
        {activeReport && popupPos ? (
          <motion.div
            key={activeReport.id}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: popupPos.x,
              top: popupPos.y,
              transform: "translate(-50%, calc(-100% - 16px))",
            }}
            className="z-[1000] pointer-events-none"
          >
            <GlassPanel glow className="relative w-56 pointer-events-auto text-left">
              <button
                type="button"
                onClick={closePopup}
                aria-label="Close"
                className="absolute right-2 top-2 leading-none text-muted transition-colors hover:text-fg"
              >
                ×
              </button>
              <p className="pr-4 text-sm font-semibold text-fg">
                {activeReport.neighborhood}, {activeReport.city}
              </p>
              <p className="mt-1 text-lg font-bold text-accent-strong">
                €{activeReport.rent_eur.toFixed(0)}
                <span className="text-xs font-normal text-muted"> /mo</span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {isRoomOption(activeReport.rooms)
                  ? roomLabel(activeReport.rooms)
                  : activeReport.rooms}
                {activeReport.size_m2 ? `, ${activeReport.size_m2} m²` : ""}
              </p>
              {activeReport.note ? (
                <p className="mt-2 text-xs text-muted">{activeReport.note}</p>
              ) : null}
              <span
                aria-hidden
                className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[var(--glass-border)] bg-[var(--glass-bg)]"
              />
            </GlassPanel>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
