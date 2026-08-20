"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshDistortMaterial } from "@react-three/drei";
import type { Group } from "three";
import type { RoomPalette } from "@/lib/interior/palette";

export interface RoomPreviewProps {
  /** Drives every material color in the scene — see lib/interior/palette.ts. */
  palette: RoomPalette;
  /** True once the AI has actually returned a suggestion — brightens/enlarges
   * the floating accent orb as a small "payoff" moment rather than a static
   * decoration, without altering any of the surrounding data flow. */
  revealed?: boolean;
  className?: string;
}

/**
 * Forked from components/three/FloatingOrb.tsx's <Canvas> scaffolding (see
 * DESIGN_SYSTEM.md, Tier 3) into a simplified abstract room: a floor + two
 * walls, a couple of floating furniture primitives (a "sofa" box, a "side
 * table + lamp" cylinder/sphere pair), and a distorting accent orb that
 * stands in for the AI-suggested color palette. Not photorealistic on
 * purpose — the point is to communicate "this is a spatial/room concept",
 * which a flat 2D before/after pair doesn't.
 */
function RoomScene({ palette, revealed }: { palette: RoomPalette; revealed: boolean }) {
  const groupRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      // Slow turntable rotation so the room reads as a 3D object, not a
      // static illustration — deliberately gentle, not disorienting.
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floor */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color={palette.floor} roughness={0.9} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0.5, -2.5]}>
        <boxGeometry args={[6, 3, 0.1]} />
        <meshStandardMaterial color={palette.wall} roughness={0.95} />
      </mesh>

      {/* Side wall, angled to read as a room corner */}
      <mesh position={[-3, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[5, 3, 0.1]} />
        <meshStandardMaterial color={palette.wall} roughness={0.95} transparent opacity={0.85} />
      </mesh>

      {/* "Sofa" primitive */}
      <Float speed={1.4} floatIntensity={0.5} rotationIntensity={0.15}>
        <mesh position={[-0.8, -0.55, -0.3]}>
          <boxGeometry args={[1.6, 0.6, 0.7]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} metalness={0.05} />
        </mesh>
      </Float>

      {/* "Side table + lamp" primitive */}
      <Float speed={1.8} floatIntensity={0.6} rotationIntensity={0.2}>
        <group position={[1.2, -0.4, 0.4]}>
          <mesh>
            <cylinderGeometry args={[0.28, 0.32, 0.5, 24]} />
            <meshStandardMaterial color={palette.secondary} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={palette.accent} roughness={0.3} />
          </mesh>
        </group>
      </Float>

      {/* Floating "palette swatch" orb — stands in for the AI-suggested
          color palette; brightens once a real suggestion has landed. */}
      <Float speed={2.2} floatIntensity={1.1} rotationIntensity={0.5}>
        <mesh position={[0, 1.1, 0.6]}>
          <sphereGeometry args={[revealed ? 0.34 : 0.26, 48, 48]} />
          <MeshDistortMaterial
            color={palette.accent}
            distort={revealed ? 0.5 : 0.25}
            speed={revealed ? 2.5 : 1}
            roughness={0.15}
            metalness={0.2}
          />
        </mesh>
        <pointLight
          position={[0, 1.1, 0.6]}
          color={palette.accent}
          intensity={revealed ? 1.6 : 0.5}
          distance={4}
        />
      </Float>
    </group>
  );
}

/**
 * Tier 3 flagship visual for ai-interior-decorator. Must be loaded via
 * `next/dynamic(() => import(...), { ssr: false })` from whatever page
 * renders it — react-three-fiber touches `window`/WebGL at module init (see
 * FloatingOrb's own doc comment / DESIGN_SYSTEM.md).
 */
export function RoomPreview({ palette, revealed = false, className }: RoomPreviewProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [3.4, 2.2, 4.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 3]} intensity={1.1} />
        <Suspense fallback={null}>
          <RoomScene palette={palette} revealed={revealed} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
