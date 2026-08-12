"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { NODE_ORDER } from "@/features/simulation/types";

import type { NodePositionsRef } from "./node-positions";
import { LINK_COUNT, SEMANTIC_LINKS } from "./semantic-links";

export type LinkFlowProps = {
  positionsRef: NodePositionsRef;
};

const SEGMENTS = 28;

function nodeIndex(
  id: (typeof SEMANTIC_LINKS)[number]["from"] | (typeof SEMANTIC_LINKS)[number]["to"],
): number {
  return NODE_ORDER.indexOf(id);
}

/**
 * Nine semantic threads as soft cyan polylines (PRD 5.5).
 * Positions update in-place each frame - no geometry rebuild.
 */
export function LinkFlow({ positionsRef }: LinkFlowProps) {
  const geometries = useMemo(
    () =>
      Array.from({ length: LINK_COUNT }, () => {
        const positions = new Float32Array((SEGMENTS + 1) * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        return geometry;
      }),
    [],
  );

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

  useFrame(() => {
    const { from, to, mid, point, curve } = scratchRef.current;

    for (let i = 0; i < LINK_COUNT; i += 1) {
      const link = SEMANTIC_LINKS[i]!;
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

      const geometry = geometries[i]!;
      const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
      const array = attr.array as Float32Array;

      for (let s = 0; s <= SEGMENTS; s += 1) {
        curve.getPoint(s / SEGMENTS, point);
        const offset = s * 3;
        array[offset] = point.x;
        array[offset + 1] = point.y;
        array[offset + 2] = point.z;
      }
      attr.needsUpdate = true;
      geometry.computeBoundingSphere();
    }
  });

  return (
    <group>
      {SEMANTIC_LINKS.map((link, index) => (
        <line key={`${link.from}->${link.to}`}>
          <primitive object={geometries[index]!} attach="geometry" />
          <lineBasicMaterial
            color="#22D3EE"
            transparent
            opacity={0.38}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
}
