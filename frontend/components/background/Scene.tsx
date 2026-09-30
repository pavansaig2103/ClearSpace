"use client";

import { useEffect, useState } from "react";
import { PerspectiveCamera } from "@react-three/drei";

import { useReducedMotionPreference } from "@/hooks/useReducedMotion";
import { AmbientObjects } from "./AmbientObjects";
import { FloatingParticles } from "./FloatingParticles";

export function Scene({ focused }: { focused: boolean }) {
  const reduced = useReducedMotionPreference();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={42} />
      <ambientLight intensity={0.78} />
      <pointLight position={[-3, 2, 2]} intensity={focused ? 1.2 : 0.82} color="#dffcff" />
      <pointLight position={[3, -2, -1]} intensity={0.42} color="#f8f5ef" />
      <AmbientObjects focused={focused} reduced={reduced || mobile} />
      <FloatingParticles count={mobile ? 28 : 74} reduced={reduced} />
    </>
  );
}

