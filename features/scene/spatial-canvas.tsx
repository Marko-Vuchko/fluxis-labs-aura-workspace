"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Histogram,
  MonthSnapshot,
  NodeId,
  NodeState,
} from "@/features/simulation/types";
import { NODE_ORDER } from "@/features/simulation/types";

import { HistogramBars } from "./histogram-bars";
import { LinkFlow } from "./link-flow";
import { NodeMesh } from "./node-mesh";
import { useNodePositions } from "./node-positions";
import { ParticleField } from "./particle-field";
import { ProjectionCurve } from "./projection-curve";
import {
  DEFAULT_SCENE_QUALITY,
  QualityManager,
} from "./quality-manager";
import type { SceneQuality } from "./scene-quality";
import { SceneBackground } from "./scene-background";
import {
  isUsableWebGL2Context,
  WEBGL_CONTEXT_ATTRIBUTES,
} from "./webgl-support";
import { useOrbitControlsEnabled } from "@/features/hud/orbit-gate";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    __AURA_LOCK_NODE?: (id: NodeId | null) => void;
  }
}

export type SpatialCanvasProps = {
  nodes: readonly NodeState[] | null;
  month: MonthSnapshot | null;
  months?: readonly MonthSnapshot[] | null;
  histogram?: Histogram | null;
  selectedMonth?: number;
  currency?: string;
  reduceMotion?: boolean;
  className?: string;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  stale?: boolean;
};

const CAMERA_DISTANCE = 11;
const CAMERA_ELEVATION_DEG = 20;
const CAMERA_INTRO_MS = 900;
const CAMERA_INTRO_DISTANCE = 16.5;
const CAMERA_INTRO_AZIMUTH_DEG = 22;

function cameraPositionAt(
  distance: number,
  azimuthDeg = 0,
): [number, number, number] {
  const elev = (CAMERA_ELEVATION_DEG * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;
  const horiz = Math.cos(elev) * distance;
  return [
    Math.sin(az) * horiz,
    Math.sin(elev) * distance,
    Math.cos(az) * horiz,
  ];
}

function CameraIntro({ onComplete }: { onComplete: () => void }) {
  const { camera } = useThree();
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useFrame((_, delta) => {
    if (doneRef.current) {
      return;
    }
    elapsedRef.current += delta * 1000;
    const t = Math.min(1, elapsedRef.current / CAMERA_INTRO_MS);
    const eased = 1 - (1 - t) ** 3;
    const distance =
      CAMERA_INTRO_DISTANCE + (CAMERA_DISTANCE - CAMERA_INTRO_DISTANCE) * eased;
    const azimuth = CAMERA_INTRO_AZIMUTH_DEG * (1 - eased);
    const [x, y, z] = cameraPositionAt(distance, azimuth);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    if (t >= 1) {
      doneRef.current = true;
      queueMicrotask(() => {
        onCompleteRef.current();
      });
    }
  });

  return null;
}

function CameraRig({ reduceMotion }: { reduceMotion: boolean }) {
  const [userStopped, setUserStopped] = useState(false);
  const [introDone, setIntroDone] = useState(reduceMotion);
  const orbitEnabled = useOrbitControlsEnabled();
  const autoRotate = !reduceMotion && !userStopped && orbitEnabled && introDone;

  return (
    <>
      {reduceMotion || introDone ? null : (
        <CameraIntro onComplete={() => setIntroDone(true)} />
      )}
      <OrbitControls
        makeDefault
        enabled={orbitEnabled && introDone}
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
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
    </>
  );
}

function SceneContent({
  nodes,
  month,
  months,
  histogram,
  selectedMonth,
  currency,
  quality,
  reduceMotion,
  lockedNodeId,
  effectsEnabled,
  onToggleLock,
}: {
  nodes: readonly NodeState[] | null;
  month: MonthSnapshot | null;
  months: readonly MonthSnapshot[] | null;
  histogram: Histogram | null;
  selectedMonth: number;
  currency: string;
  quality: SceneQuality;
  reduceMotion: boolean;
  lockedNodeId: NodeId | null;
  effectsEnabled: boolean;
  onToggleLock: (id: NodeId) => void;
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

      <HistogramBars histogram={histogram} quality={quality} />

      <ProjectionCurve
        months={months}
        selectedMonth={selectedMonth}
        quality={quality}
      />

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
          month={month}
          currency={currency}
          locked={lockedNodeId === id}
          onToggleLock={onToggleLock}
        />
      ))}

      <CameraRig reduceMotion={reduceMotion} />

      {quality.bloomEnabled && effectsEnabled ? (
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
  months = null,
  histogram = null,
  selectedMonth = 12,
  currency = "USD",
  reduceMotion = false,
  className,
  onContextLost,
  onContextRestored,
  stale = false,
}: SpatialCanvasProps) {
  const [quality, setQuality] = useState<SceneQuality>(DEFAULT_SCENE_QUALITY);
  const [lockedNodeId, setLockedNodeId] = useState<NodeId | null>(null);
  const [effectsEnabled, setEffectsEnabled] = useState(false);
  const cameraPosition = useMemo(
    () =>
      cameraPositionAt(
        reduceMotion ? CAMERA_DISTANCE : CAMERA_INTRO_DISTANCE,
        reduceMotion ? 0 : CAMERA_INTRO_AZIMUTH_DEG,
      ),
    [reduceMotion],
  );
  const contextCleanupRef = useRef<(() => void) | null>(null);
  const onContextLostRef = useRef(onContextLost);
  const onContextRestoredRef = useRef(onContextRestored);

  useEffect(() => {
    onContextLostRef.current = onContextLost;
    onContextRestoredRef.current = onContextRestored;
  }, [onContextLost, onContextRestored]);

  useEffect(() => {
    return () => {
      contextCleanupRef.current?.();
      contextCleanupRef.current = null;
    };
  }, []);

  const handleToggleLock = useCallback((id: NodeId) => {
    setLockedNodeId((current) => (current === id ? null : id));
  }, []);

  const handleClearLock = useCallback(() => {
    setLockedNodeId(null);
  }, []);

  useEffect(() => {
    if (!lockedNodeId) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClearLock();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lockedNodeId, handleClearLock]);

  useEffect(() => {
    window.__AURA_LOCK_NODE = (id) => {
      setLockedNodeId(id);
    };
    return () => {
      delete window.__AURA_LOCK_NODE;
    };
  }, []);

  return (
    <div
      className={cn(
        className ?? "h-full w-full",
        "transition-[filter] duration-500",
        stale && "brightness-[0.78] saturate-[0.55]",
      )}
    >
      <Canvas
        dpr={quality.dpr}
        camera={{
          position: cameraPosition,
          fov: 42,
          near: 0.1,
          far: 120,
        }}
        gl={{ ...WEBGL_CONTEXT_ATTRIBUTES }}
        resize={{ scroll: false }}
        style={{ width: "100%", height: "100%", display: "block" }}
        onCreated={({ gl }) => {
          if (!isUsableWebGL2Context(gl.getContext())) {
            onContextLostRef.current?.();
            return;
          }

          setEffectsEnabled(true);
          gl.setClearColor("#05070D", 1);
          const canvas = gl.domElement;

          contextCleanupRef.current?.();

          const handleLost = (event: Event) => {
            event.preventDefault();
            onContextLostRef.current?.();
          };
          const handleRestored = () => {
            onContextRestoredRef.current?.();
          };

          canvas.addEventListener("webglcontextlost", handleLost, false);
          canvas.addEventListener("webglcontextrestored", handleRestored, false);

          contextCleanupRef.current = () => {
            canvas.removeEventListener("webglcontextlost", handleLost, false);
            canvas.removeEventListener(
              "webglcontextrestored",
              handleRestored,
              false,
            );
          };
        }}
        onPointerMissed={() => {
          handleClearLock();
        }}
      >
        <color attach="background" args={["#05070D"]} />
        <fog attach="fog" args={["#05070D", 16, 40]} />

        <QualityManager onQualityChange={setQuality} />

        <SceneContent
          nodes={nodes}
          month={month}
          months={months}
          histogram={histogram}
          selectedMonth={selectedMonth}
          currency={currency}
          quality={quality}
          reduceMotion={reduceMotion}
          lockedNodeId={lockedNodeId}
          effectsEnabled={effectsEnabled}
          onToggleLock={handleToggleLock}
        />
      </Canvas>
    </div>
  );
}
