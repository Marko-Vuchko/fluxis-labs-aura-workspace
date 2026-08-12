"use client";

import { useMemo } from "react";
import * as THREE from "three";

const GRID_SIZE = 40;
const GRID_DIVISIONS = 40;
const STAR_COUNT = 48;

/**
 * Subtle floor grid that fades with distance, soft fog (parent), sparse stars.
 * Nothing that pulls focus from the nodes.
 */
export function SceneBackground() {
  const starPositions = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i += 1) {
      const theta = (i / STAR_COUNT) * Math.PI * 2;
      const radius = 12 + (i % 7) * 1.7;
      const y = 4 + (i % 5) * 1.1;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius * 0.85;
    }
    return positions;
  }, []);

  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(
      GRID_SIZE,
      GRID_DIVISIONS,
      new THREE.Color("#0e7490"),
      new THREE.Color("#164e63"),
    );
    helper.position.y = -0.02;
    const materials = helper.material;
    if (Array.isArray(materials)) {
      for (const material of materials) {
        material.transparent = true;
        material.opacity = 0.22;
        material.depthWrite = false;
      }
    } else {
      materials.transparent = true;
      materials.opacity = 0.22;
      materials.depthWrite = false;
    }
    return helper;
  }, []);

  return (
    <group>
      <primitive object={grid} />

      {/* Soft radial fade disc so the grid dissolves toward the horizon. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
      >
        <circleGeometry args={[22, 64]} />
        <meshBasicMaterial
          color="#05070D"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#94a3b8"
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
