"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { NodeState } from "@/features/simulation/types";
import { NODE_ORDER } from "@/features/simulation/types";

import type { NodePositionsRef } from "./node-positions";
import { LINK_COUNT, SEMANTIC_LINKS } from "./semantic-links";

export type ParticleFieldProps = {
  positionsRef: NodePositionsRef;
  nodes: readonly NodeState[] | null;
  particleCount: number;
  reduceMotion: boolean;
};

function nodeIndex(
  id: (typeof SEMANTIC_LINKS)[number]["from"] | (typeof SEMANTIC_LINKS)[number]["to"],
): number {
  return NODE_ORDER.indexOf(id);
}

function linkFlowSpeed(
  nodes: readonly NodeState[] | null,
  linkIndex: number,
): number {
  if (!nodes || nodes.length !== NODE_ORDER.length) {
    return 0.35;
  }
  const link = SEMANTIC_LINKS[linkIndex]!;
  const fromHealth = nodes[nodeIndex(link.from)]?.[0] ?? 50;
  const toHealth = nodes[nodeIndex(link.to)]?.[0] ?? 50;
  const avg = (fromHealth + toHealth) / 200;
  return 0.2 + avg * 0.9;
}

/**
 * All particles in ONE InstancedMesh (single draw call).
 * Positions follow link curves; speed scales with semantic flow.
 */
export function ParticleField({
  positionsRef,
  nodes,
  particleCount,
  reduceMotion,
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const phasesRef = useRef<Float32Array>(new Float32Array(0));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color("#22D3EE"), []);
  const scratchRef = useRef({
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    mid: new THREE.Vector3(),
    point: new THREE.Vector3(),
    curve: new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ),
  });

  useLayoutEffect(() => {
    const phases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i += 1) {
      phases[i] = (i * 0.6180339887) % 1;
    }
    phasesRef.current = phases;

    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < particleCount; i += 1) {
      dummy.position.set(0, -10, 0);
      dummy.scale.setScalar(0.05);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [particleCount, dummy, color]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || reduceMotion || particleCount <= 0) {
      return;
    }

    const phases = phasesRef.current;
    if (phases.length !== particleCount) {
      return;
    }

    const { from, to, mid, point, curve } = scratchRef.current;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < particleCount; i += 1) {
      const linkIndex = i % LINK_COUNT;
      const link = SEMANTIC_LINKS[linkIndex]!;
      const fromPos = positionsRef.current[nodeIndex(link.from)];
      const toPos = positionsRef.current[nodeIndex(link.to)];
      if (!fromPos || !toPos) continue;

      from.copy(fromPos);
      to.copy(toPos);
      mid.copy(from).add(to).multiplyScalar(0.5);
      mid.y += from.distanceTo(to) * 0.18;

      curve.v0.copy(from);
      curve.v1.copy(mid);
      curve.v2.copy(to);

      const speed = linkFlowSpeed(nodes, linkIndex);
      const nextPhase = (phases[i]! + dt * speed) % 1;
      phases[i] = nextPhase;

      curve.getPoint(nextPhase, point);
      dummy.position.copy(point);
      dummy.scale.setScalar(0.045 + (i % 3) * 0.01);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (reduceMotion || particleCount <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#22D3EE"
        transparent
        opacity={0.85}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
