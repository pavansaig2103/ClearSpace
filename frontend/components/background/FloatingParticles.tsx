"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Particle = {
  position: [number, number, number];
  scale: number;
  speed: number;
};

export function FloatingParticles({ count = 70, reduced = false }: { count?: number; reduced?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const radius = 2.2 + Math.random() * 5.2;
        return {
          position: [
            Math.cos(angle) * radius + (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 4.6,
            -2.4 - Math.random() * 5.4
          ],
          scale: 0.012 + Math.random() * 0.026,
          speed: 0.18 + Math.random() * 0.2
        };
      }),
    [count]
  );

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const elapsed = clock.elapsedTime;
    particles.forEach((particle, index) => {
      const drift = reduced ? 0 : Math.sin(elapsed * particle.speed + index) * 0.08;
      dummy.position.set(particle.position[0] + drift, particle.position[1] + drift * 0.4, particle.position[2]);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.rotation.y = reduced ? 0 : elapsed * 0.006;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#bff8ff" transparent opacity={0.38} depthWrite={false} />
    </instancedMesh>
  );
}

