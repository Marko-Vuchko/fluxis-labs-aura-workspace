"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useState } from "react";

import type { MonthSnapshot, NodeState } from "@/features/simulation/types";
import { NODE_ORDER } from "@/features/simulation/types";

import { LinkFlow } from "./link-flow";
import { NodeMesh } from "./node-mesh";
import { useNodePositions } from "./node-positions";
import { ParticleField } from "./particle-field";
import {
  DEFAULT_SCENE_QUALITY,
  QualityManager,
} from "./quality-manager";
import type { SceneQuality } from "./scene-quality";
import { SceneBackground } from "./scene-background";

export type SpatialCanvasProps = {
  nodes: readonly NodeState[] | null;
  month: MonthSnapshot | null;
  reduceMotion?: boolean;
  className?: string;
};

const CAMERA_DISTANCE = 11;
const CAMERA_ELEVATION_DEG = 20;

function initialCameraPosition(): [number, number, number] {
  const elev = (CAMERA_ELEVATION_DEG * Math.PI) / 180;
  return [
    0,
    Math.sin(elev) * CAMERA_DISTANCE,
    Math.cos(elev) * CAMERA_DISTANCE,
  ];
}

function CameraRig({ reduceMotion }: { reduceMotion: boolean }) {
  const [userStopped, setUserStopped] = useState(false);
  const autoRotate = !reduceMotion && !userStopped;

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      minPolarAngle={Math.PI * 0.18}
      maxPolarAngle={Math.PI * 0.52}
      minDistance={7}
      maxDistance={26}
      autoRotate={autoRotate}
      autoRotateSpeed={0.35}
      onStart={() => {
        setUserStopped(true);
      }}
    />
  );
}

function SceneContent({
  nodes,
  month,
  quality,
  reduceMotion,
}: {
  nodes: readonly NodeState[] | null;
  month: MonthSnapshot | null;
  quality: SceneQuality;
  reduceMotion: boolean;
}) {
  const positionsRef = useNodePositions(nodes);
  const riskScore = month?.risk.score ?? 0;
  const capacityUsed = month?.capacity_used ?? null;
  const customers = month?.customers ?? null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight
        position={[0, 9, 5]}
        intensity={1.1}
        color="#22D3EE"
        distance={40}
      />
      <pointLight
        position={[-6, 4, -4]}
        intensity={0.45}
        color="#A855F7"
        distance={30}
      />

      <SceneBackground />

      <LinkFlow positionsRef={positionsRef} />

      <ParticleField
        positionsRef={positionsRef}
        nodes={nodes}
        particleCount={quality.particleCount}
        reduceMotion={reduceMotion}
      />

      {NODE_ORDER.map((id, index) => (
        <NodeMesh
          key={id}
          id={id}
          index={index}
          state={nodes?.[index] ?? null}
          positionsRef={positionsRef}
          riskScore={riskScore}
          reduceMotion={reduceMotion}
          capacityUsed={capacityUsed}
          customers={customers}
        />
      ))}

      <CameraRig reduceMotion={reduceMotion} />

      {quality.bloomEnabled ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            luminanceThreshold={0.85}
            intensity={1.2}
            mipmapBlur
            luminanceSmoothing={0.2}
          />
        </EffectComposer>
      ) : null}
    </>
  );
}

/**
 * Full-screen R3F spatial graph. Load via next/dynamic with { ssr: false }.
 */
export function SpatialCanvas({
  nodes,
  month,
  reduceMotion = false,
  className,
}: SpatialCanvasProps) {
  const [quality, setQuality] = useState<SceneQuality>(DEFAULT_SCENE_QUALITY);
  const cameraPosition = useMemo(() => initialCameraPosition(), []);

  return (
    <div className={className ?? "h-full w-full"}>
      <Canvas
        dpr={quality.dpr}
        camera={{
          position: cameraPosition,
          fov: 42,
          near: 0.1,
          far: 120,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#05070D", 1);
        }}
      >
        <color attach="background" args={["#05070D"]} />
        <fog attach="fog" args={["#05070D", 16, 40]} />

        <QualityManager onQualityChange={setQuality} />

        <SceneContent
          nodes={nodes}
          month={month}
          quality={quality}
          reduceMotion={reduceMotion}
        />
      </Canvas>
    </div>
  );
}
