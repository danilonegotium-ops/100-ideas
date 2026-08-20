"use client";

import dynamic from "next/dynamic";
import type { RentReport } from "@/lib/types";

/**
 * `next/dynamic` with `ssr: false` is the documented Next.js way to load a
 * browser-only library (Leaflet needs `window`/`document` at module-init
 * time). `ssr: false` is only allowed inside a Client Component, which is
 * why this thin wrapper exists — it lets `app/page.tsx` stay a Server
 * Component (so it can fetch reports server-side) while still safely
 * lazy-loading the map on the client.
 */
const RentMap = dynamic(() => import("./RentMap").then((mod) => mod.RentMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full animate-pulse items-center justify-center rounded-brand border border-border text-sm text-muted">
      Loading map…
    </div>
  ),
});

export function RentMapLoader({
  reports,
  onVisibleReportsChange,
}: {
  reports: RentReport[];
  onVisibleReportsChange?: (visible: RentReport[]) => void;
}) {
  return <RentMap reports={reports} onVisibleReportsChange={onVisibleReportsChange} />;
}
