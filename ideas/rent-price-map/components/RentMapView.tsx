"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { StatTile } from "@/components/motion/StatTile";
import { RentMapLoader } from "@/components/RentMapLoader";
import { roomLabel, isRoomOption } from "@/lib/rooms";
import type { RentReport } from "@/lib/types";

const ALL_CITIES = "__all__";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Client-side filtering, deliberately: the whole dataset is small (seed +
 * organic MVP-stage growth), so fetching it all once server-side and
 * filtering in the browser is both simpler and snappier than a
 * server round-trip per filter change. A future pass with a much larger
 * dataset would move this filter to a server-side query
 * (`.eq("city", selectedCity)`) with pagination instead.
 */
export function RentMapView({ reports }: { reports: RentReport[] }) {
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES);

  const cities = useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.city))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [reports]);

  const filtered = useMemo(() => {
    if (selectedCity === ALL_CITIES) return reports;
    return reports.filter((r) => r.city === selectedCity);
  }, [reports, selectedCity]);

  // Area-level stats are scoped to whatever's actually visible in the map's
  // current viewport, not just the city filter — narrowed further by
  // `RentMap` (via `onVisibleReportsChange`) whenever the user pans/zooms.
  // Seeded with the city-filtered set so stats don't flash to zero the
  // moment the filter changes, before the map reports back its bounds.
  const [visibleReports, setVisibleReports] = useState<RentReport[]>(filtered);

  useEffect(() => {
    setVisibleReports(filtered);
  }, [filtered]);

  const handleVisibleReportsChange = useCallback((visible: RentReport[]) => {
    setVisibleReports(visible);
  }, []);

  const stats = useMemo(() => {
    if (visibleReports.length === 0) return null;
    const prices = visibleReports.map((r) => r.rent_eur);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    return { count: prices.length, avg, median: median(prices) };
  }, [visibleReports]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="city-filter" className="mb-0 shrink-0">
          Filter by city
        </label>
        <select
          id="city-filter"
          value={selectedCity}
          onChange={(event) => setSelectedCity(event.target.value)}
          className="w-auto"
        >
          <option value={ALL_CITIES}>All cities ({reports.length})</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city} ({reports.filter((r) => r.city === city).length})
            </option>
          ))}
        </select>
      </div>

      {stats ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="In view" value={stats.count} />
          <StatTile label="Avg rent" value={stats.avg} prefix="€" suffix="/mo" />
          <StatTile label="Median rent" value={stats.median} prefix="€" suffix="/mo" />
        </div>
      ) : null}

      <RentMapLoader reports={filtered} onVisibleReportsChange={handleVisibleReportsChange} />

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No reports for this city yet"
          description="Try a different city, or be the first to add one here."
        />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map((report, index) => (
            <AnimatedCard key={report.id} index={index}>
              <p className="text-sm font-semibold text-fg">
                {report.neighborhood}, {report.city}
              </p>
              <p className="text-sm text-muted">
                €{report.rent_eur.toFixed(0)}/mo &middot;{" "}
                {isRoomOption(report.rooms) ? roomLabel(report.rooms) : report.rooms}
                {report.size_m2 ? `, ${report.size_m2} m²` : ""}
              </p>
              {report.note && <p className="mt-1 text-xs text-muted">{report.note}</p>}
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
