"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { configureDefaultMarkerIcon } from "@/lib/leaflet-icon";

const SERBIA_CENTER: [number, number] = [44.0165, 21.0059];
const DEFAULT_ZOOM = 7;

/**
 * Click-to-place map picker for the submission form. A single draggable
 * marker follows clicks (and drags); `onChange` reports the rounded-free
 * raw coordinates back to the parent form, which is responsible for
 * displaying/submitting them (the actual privacy-preserving rounding to
 * ~1.1km happens server-side in `app/api/reports/route.ts`, not here, so
 * this component just reports what the user actually clicked).
 *
 * Same `ssr: false`-only-via-loader requirement as `RentMap.tsx` — see
 * `LocationPickerLoader.tsx`.
 */
export function LocationPicker({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    configureDefaultMarkerIcon(L);

    const map = L.map(containerRef.current).setView(SERBIA_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    function placeMarker(lat: number, lng: number) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLatLng();
          onChangeRef.current(pos.lat, pos.lng);
        });
      }
      onChangeRef.current(lat, lng);
    }

    map.on("click", (event: L.LeafletMouseEvent) => {
      placeMarker(event.latlng.lat, event.latlng.lng);
    });

    return () => {
      map.remove();
      markerRef.current = null;
    };
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        className="h-[320px] w-full rounded-brand border border-border"
      />
      <p className="mt-2 text-xs text-muted">
        Click (or drag the pin) to mark roughly where the apartment is — a
        neighborhood-level pin is enough, you don&apos;t need to be exact.
      </p>
    </div>
  );
}
