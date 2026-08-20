"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, MeshDistortMaterial, Sparkles, Sphere } from "@react-three/drei";
import type { Mesh, PointLight } from "three";

export interface MatchOrbsProps {
  /** CSS color for the "you" orb — defaults to the shared accent. */
  colorA?: string;
  /** CSS color for the "them" orb — defaults to the secondary accent hue. */
  colorB?: string;
  className?: string;
}

/**
 * The mutual-match payoff moment: forked from `components/three/FloatingOrb.tsx`
 * into something specific to roommate-matcher's concept — two distinct
 * glass orbs (one per person) drift together, merge into a single bright
 * pulsing sphere, and throw off a sparkle burst. Rendered only inside
 * `MatchCelebration`, and only for the few seconds the "It's a match!"
 * overlay is on screen — see MatchCelebration for the ssr:false boundary.
 */
export function MatchOrbs({ colorA = "#6ee7b7", colorB = "#a78bfa", className }: MatchOrbsProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 3]} intensity={1.3} />
        <Suspense fallback={null}>
          <MergingSpheres colorA={colorA} colorB={colorB} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

function MergingSpheres({ colorA, colorB }: { colorA: string; colorB: string }) {
  const leftRef = useRef<Mesh>(null);
  const rightRef = useRef<Mesh>(null);
  const burstRef = useRef<PointLight>(null);
  const startTime = useRef<number | null>(null);

  useFrame((state) => {
    if (startTime.current === null) startTime.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startTime.current;

    // Drift together over the first ~0.9s (eased out), then settle into a
    // single pulsing glow — the "merge" reads as the two profiles becoming
    // one match, not just two shapes touching.
    const mergeProgress = Math.min(1, t / 0.9);
    const eased = 1 - Math.pow(1 - mergeProgress, 3);
    const offset = 1.15 * (1 - eased);

    if (leftRef.current) leftRef.current.position.x = -offset;
    if (rightRef.current) rightRef.current.position.x = offset;

    const merged = mergeProgress >= 1;
    const pulse = merged ? 1 + Math.sin(t * 4) * 0.08 : 1;
    if (leftRef.current) leftRef.current.scale.setScalar(pulse);
    if (rightRef.current) rightRef.current.scale.setScalar(pulse);

    if (burstRef.current) {
      burstRef.current.intensity = merged ? 2.6 + Math.sin(t * 4) * 1.1 : 0.5 + mergeProgress * 1.5;
    }
  });

  return (
    <>
      <pointLight ref={burstRef} position={[0, 0, 1.5]} color="#ffffff" intensity={0.5} distance={7} />
      <Sphere ref={leftRef} args={[0.78, 64, 64]} position={[-1.15, 0, 0]}>
        <MeshDistortMaterial color={colorA} distort={0.35} speed={2} roughness={0.12} metalness={0.15} />
      </Sphere>
      <Sphere ref={rightRef} args={[0.78, 64, 64]} position={[1.15, 0, 0]}>
        <MeshDistortMaterial color={colorB} distort={0.35} speed={2} roughness={0.12} metalness={0.15} />
      </Sphere>
      <Sparkles count={70} scale={3.4} size={3.5} speed={0.6} color="#ffffff" />
    </>
  );
}
