"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { NodeId, NodeState } from "@/features/simulation/types";
import { formatNumber, formatPercent } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { DictionaryKey } from "@/lib/i18n/dictionary";

import { healthToColor } from "./health-color";
import type { NodePositionsRef } from "./node-positions";

export type NodeMeshProps = {
  id: NodeId;
  index: number;
  state: NodeState | null;
  positionsRef: NodePositionsRef;
  /** Month risk score 0..100 - drives pulse rate. */
  riskScore: number;
  reduceMotion: boolean;
  capacityUsed: number | null;
  customers: number | null;
};

let haloTexture: THREE.CanvasTexture | null = null;

function getHaloTexture(): THREE.CanvasTexture {
  if (haloTexture) {
    return haloTexture;
  }
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    haloTexture = new THREE.CanvasTexture(canvas);
    return haloTexture;
  }
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  haloTexture = new THREE.CanvasTexture(canvas);
  haloTexture.needsUpdate = true;
  return haloTexture;
}

function nodeLabelKey(id: NodeId): DictionaryKey {
  return `ui.nodes.${id}`;
}

/**
 * One spatial node: wireframe icosahedron, glowing core, soft halo sprite.
 */
export function NodeMesh({
  id,
  index,
  state,
  positionsRef,
  riskScore,
  reduceMotion,
  capacityUsed,
  customers,
}: NodeMeshProps) {
  const { t } = useLanguage();
  const groupRef = useRef<THREE.Group>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);

  const health = state?.[0] ?? 50;
  const color = useMemo(() => healthToColor(health), [health]);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);
  const map = useMemo(() => getHaloTexture(), []);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const target = positionsRef.current[index];
    if (target) {
      group.position.copy(target);
    }

    if (wireRef.current && !reduceMotion) {
      wireRef.current.rotation.y = clock.elapsedTime * 0.25;
      wireRef.current.rotation.x = clock.elapsedTime * 0.12;
    }

    const riskNorm = Math.max(0, Math.min(1, riskScore / 100));
    const pulseSpeed = reduceMotion ? 0 : 1.2 + riskNorm * 3.2;
    const pulse =
      reduceMotion || pulseSpeed === 0
        ? 1
        : 1 + Math.sin(clock.elapsedTime * pulseSpeed) * (0.06 + riskNorm * 0.08);

    if (coreRef.current) {
      coreRef.current.scale.setScalar(pulse);
    }
    if (haloRef.current) {
      const haloScale = 1.55 * pulse;
      haloRef.current.scale.set(haloScale, haloScale, 1);
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Wireframe icosahedral frame */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshBasicMaterial
          color={colorObj}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Glowing core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={2.4}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* Soft halo sprite */}
      <sprite ref={haloRef} scale={[1.55, 1.55, 1]}>
        <spriteMaterial
          map={map}
          color={colorObj}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Invisible hit volume for reliable hover */}
      <mesh visible={false}>
        <sphereGeometry args={[0.75, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      {hovered ? (
        <Html
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
          zIndexRange={[100, 0]}
        >
          <div
            className="min-w-[9.5rem] rounded-lg border border-primary/25 bg-[#070b14]/90 px-3 py-2 shadow-[0_0_24px_-12px_rgb(34_211_238_/_0.7)] backdrop-blur-md"
            role="tooltip"
          >
            <p className="text-[10px] tracking-[0.16em] text-primary/85 uppercase">
              {t(nodeLabelKey(id))}
            </p>
            <dl className="mt-1.5 space-y-1 font-mono text-[11px] tabular-nums text-foreground">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{t("ui.health")}</dt>
                <dd style={{ color }}>{formatNumber(health, 1)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{t("ui.risk")}</dt>
                <dd>{formatNumber(riskScore, 1)}</dd>
              </div>
              {capacityUsed !== null ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {t("ui.capacityUsed")}
                  </dt>
                  <dd>{formatPercent(capacityUsed, 0)}</dd>
                </div>
              ) : null}
              {customers !== null ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{t("ui.customers")}</dt>
                  <dd>{formatNumber(customers, 1)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Html>
      ) : null}
    </group>
  );
}
