"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { RentMapLoader } from "@/components/RentMapLoader";
import { roomLabel, isRoomOption } from "@/lib/rooms";
import type { RentReport } from "@/lib/types";

const ALL_CITIES = "__all__";

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

      <RentMapLoader reports={filtered} />

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No reports for this city yet.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map((report) => (
            <Card key={report.id}>
              <p className="text-sm font-semibold text-fg">
                {report.neighborhood}, {report.city}
              </p>
              <p className="text-sm text-muted">
                €{report.rent_eur.toFixed(0)}/mo &middot;{" "}
                {isRoomOption(report.rooms) ? roomLabel(report.rooms) : report.rooms}
                {report.size_m2 ? `, ${report.size_m2} m²` : ""}
              </p>
              {report.note && <p className="mt-1 text-xs text-muted">{report.note}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
