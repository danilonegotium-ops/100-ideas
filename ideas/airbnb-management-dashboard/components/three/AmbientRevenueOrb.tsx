"use client";

import dynamic from "next/dynamic";

// Client-side lazy-load wrapper. `ssr: false` is only permitted for
// next/dynamic calls made from inside a Client Component ("use client" at
// the top of this file) — Next.js 14's App Router throws a build error if a
// Server Component page calls dynamic(..., { ssr: false }) directly. Routing
// through this tiny wrapper lets `app/page.tsx` stay a Server Component
// while still never attempting to server-render the WebGL canvas.
const AmbientRevenueOrbInner = dynamic(() => import("./AmbientRevenueOrbInner"), {
  ssr: false,
});

export default function AmbientRevenueOrb() {
  return <AmbientRevenueOrbInner />;
}
