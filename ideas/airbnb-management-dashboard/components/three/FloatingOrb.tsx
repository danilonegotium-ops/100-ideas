"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, MeshDistortMaterial, Sphere } from "@react-three/drei";

export interface FloatingOrbProps {
  /** Any CSS color — hex or `rgb(...)`. Defaults to the shared accent. */
  color?: string;
  /** 0–1, how strongly the surface warps. */
  distort?: number;
  className?: string;
}

/**
 * Tier 3 building block: a real WebGL floating, slowly-distorting glass orb
 * — the generic "flagship hero visual" primitive for the ~6 showcase apps
 * (digital-time-capsule's sealed capsule, roommate-matcher's match glow,
 * ai-interior-decorator's ambient hero, etc.). It's deliberately abstract —
 * apps that need a *specific* 3D object (a room, a map pin, a card) should
 * build their own <Canvas> scene using this file as a starting template
 * rather than trying to reconfigure this one component into everything.
 *
 * Must be used inside a Client Component. If the page that renders it is a
 * Server Component, import it with `next/dynamic(() => import(...), { ssr:
 * false })` — react-three-fiber touches `window`/WebGL at module init and
 * will break server rendering otherwise. See DESIGN_SYSTEM.md.
 *
 * Renders nothing (not even a fallback box) if WebGL context creation
 * throws — Canvas's onCreated/error boundary is left to the consuming app
 * to wrap if a hard fallback is required for a specific product.
 */
export function FloatingOrb({ color = "#6ee7b7", distort = 0.4, className }: FloatingOrbProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
            <Sphere args={[1, 64, 64]}>
              <MeshDistortMaterial
                color={color}
                distort={distort}
                speed={1.5}
                roughness={0.15}
                metalness={0.1}
              />
            </Sphere>
          </Float>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
