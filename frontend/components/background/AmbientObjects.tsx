"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function AmbientObjects({ focused = false, reduced = false }: { focused?: boolean; reduced?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const elapsed = clock.elapsedTime;
    const motion = reduced ? 0 : 1;
    group.current.rotation.y = elapsed * 0.025 * motion + pointer.x * 0.025;
    group.current.rotation.x = Math.sin(elapsed * 0.12) * 0.035 * motion + pointer.y * 0.018;
    group.current.position.x = pointer.x * (focused ? 0.18 : 0.08);
    group.current.position.y = pointer.y * (focused ? 0.1 : 0.04);
    if (ring.current) {
      ring.current.rotation.z = elapsed * 0.04 * motion;
      ring.current.scale.setScalar(focused ? 1.07 : 1);
    }
  });

  return (
    <group ref={group} position={[0.2, 0, -4]}>
      <mesh position={[-2.25, 0.85, -0.7]}>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshPhysicalMaterial
          color="#dffcff"
          transparent
          opacity={focused ? 0.18 : 0.12}
          roughness={0.18}
          metalness={0}
          transmission={0.28}
          thickness={1.2}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ring} position={[1.62, -0.34, -0.4]} rotation={[Math.PI * 0.55, 0.2, 0.4]}>
        <torusGeometry args={[1.28, 0.008, 10, 96]} />
        <meshBasicMaterial color="#8eefff" transparent opacity={focused ? 0.26 : 0.16} depthWrite={false} />
      </mesh>
      <mesh position={[2.55, 1.35, -1.2]} rotation={[0.7, 0.35, 0.2]}>
        <icosahedronGeometry args={[0.5, 2]} />
        <meshStandardMaterial color="#f8f5ef" transparent opacity={0.08} roughness={0.68} depthWrite={false} />
      </mesh>
      <mesh position={[-0.25, -1.45, -1.45]} rotation={[0.35, 0.5, 0.2]}>
        <torusKnotGeometry args={[0.32, 0.018, 90, 8]} />
        <meshBasicMaterial color="#dffcff" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh position={[0.75, 0.1, -2.2]}>
        <sphereGeometry args={[1.65, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={focused ? 0.045 : 0.03} depthWrite={false} />
      </mesh>
    </group>
  );
}

