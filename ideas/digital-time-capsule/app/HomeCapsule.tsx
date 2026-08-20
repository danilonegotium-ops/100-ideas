"use client";

import dynamic from "next/dynamic";

// Scoped dynamic import so app/page.tsx stays a Server Component — the
// Canvas/WebGL scene can only run client-side. Purely decorative here (no
// letter data): sealed, ambient rotation, never opens.
const SealedCapsule = dynamic(
  () => import("@/components/three/SealedCapsule").then((mod) => mod.SealedCapsule),
  { ssr: false },
);

export function HomeCapsule() {
  return <SealedCapsule isOpen={false} className="h-full w-full" />;
}
