"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import type { Group } from "three";

export interface SealedCapsuleProps {
  /** Any CSS color — hex or `rgb(...)`. Defaults to the shared accent. */
  color?: string;
  /**
   * Purely visual switch — the caller still owns the real unlock-date
   * comparison (see `letter.delivered`, set by the cron job in
   * `app/api/cron/deliver/route.ts` / read in `app/capsule/page.tsx`). This
   * component just reacts to that boolean: `false` renders a sealed,
   * near-zero-distort orb slowly rotating in place; `true` plays a
   * one-time crack-open animation and settles into an opened resting pose.
   */
  isOpen?: boolean;
  className?: string;
}

/** MeshDistortMaterial forwards a ref to its internal THREE material
 * instance, which has a live `distort` getter/setter (see
 * `@react-three/drei/core/MeshDistortMaterial`) — but that internal class
 * (`DistortMaterialImpl`) isn't exported for import, so the ref below is
 * untyped and only ever read/written through its `.distort` property. */

const SEAL_ROTATION_SPEED = 0.12; // rad/s while sealed — slow, ambient, calm
const OPEN_LERP_SPEED = 1.4; // eases the crack-open toward its target pose

/**
 * Two hemisphere shells that read as one sealed orb-capsule while closed
 * (distort ~0.05, slow ambient rotation) and split apart into a
 * cracked-open pose once `isOpen` flips true, with a brief distort/emissive
 * pulse standing in for light escaping the capsule.
 */
function CapsuleShells({ color, isOpen }: { color: string; isOpen: boolean }) {
  const group = useRef<Group>(null);
  const topGroup = useRef<Group>(null);
  const bottomGroup = useRef<Group>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topMat = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bottomMat = useRef<any>(null);
  const progress = useRef(0); // 0 = sealed, 1 = fully cracked open

  useFrame((_state, delta) => {
    const target = isOpen ? 1 : 0;
    progress.current += (target - progress.current) * Math.min(delta * OPEN_LERP_SPEED, 1);
    const p = progress.current;

    if (group.current) {
      // Slow ambient rotation while sealed; settles once opened.
      group.current.rotation.y += delta * SEAL_ROTATION_SPEED * (1 - p * 0.85);
    }

    if (topGroup.current && bottomGroup.current) {
      // Halves separate and tilt apart as p goes 0 -> 1.
      topGroup.current.position.y = p * 0.55;
      bottomGroup.current.position.y = -p * 0.55;
      topGroup.current.rotation.z = p * 0.35;
      bottomGroup.current.rotation.z = -p * 0.35;
    }

    // Distort spikes right as the crack begins (mid-transition), then
    // relaxes — reads as a brief burst rather than a smooth morph.
    const burst = Math.sin(Math.min(p, 1) * Math.PI) * 0.9;
    const restingDistort = 0.05 + p * 0.05;
    const distort = restingDistort + burst * 0.6;
    if (topMat.current) topMat.current.distort = distort;
    if (bottomMat.current) bottomMat.current.distort = distort;
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.25} floatIntensity={0.6}>
        <group ref={topGroup}>
          <Sphere args={[1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]}>
            <MeshDistortMaterial
              ref={topMat}
              color={color}
              distort={0.05}
              speed={1.5}
              roughness={0.15}
              metalness={0.15}
              emissive={color}
              emissiveIntensity={0.05}
            />
          </Sphere>
        </group>
        <group ref={bottomGroup}>
          <Sphere args={[1, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}>
            <MeshDistortMaterial
              ref={bottomMat}
              color={color}
              distort={0.05}
              speed={1.5}
              roughness={0.15}
              metalness={0.15}
              emissive={color}
              emissiveIntensity={0.05}
            />
          </Sphere>
        </group>
      </Float>
    </group>
  );
}

/**
 * Tier 3 flagship visual, forked from `components/three/FloatingOrb.tsx`
 * for digital-time-capsule: "the concept is literally an object sealed
 * until a future date" (DESIGN_SYSTEM.md). Distort is pinned near zero and
 * the orb only rotates gently while sealed; when `isOpen` becomes true it
 * plays a one-time crack-open/reveal animation and settles into an opened
 * pose, driven entirely by the boolean the caller passes in — this
 * component never reads a clock or compares dates itself.
 *
 * Must be rendered inside a Client Component. Because react-three-fiber
 * touches `window`/WebGL at module init, load it via
 * `next/dynamic(() => import(...), { ssr: false })` from wherever it's
 * used, even if the page rendering it is otherwise a Server Component.
 */
export function SealedCapsule({ color = "#6ee7b7", isOpen = false, className }: SealedCapsuleProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        <pointLight position={[0, 0.5, 2]} intensity={isOpen ? 1.4 : 0} color={color} />
        <CapsuleShells color={color} isOpen={isOpen} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
