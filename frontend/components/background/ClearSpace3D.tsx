"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";

import { Scene } from "./Scene";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

export function ClearSpace3D() {
  const [focused, setFocused] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    setWebgl(supportsWebGL());
    const onFocus = (event: Event) => setFocused(Boolean((event as CustomEvent<{ focused: boolean }>).detail?.focused));
    const onPulse = () => setPulse((value) => value + 1);
    window.addEventListener("clearspace:focus", onFocus);
    window.addEventListener("clearspace:pulse", onPulse);
    return () => {
      window.removeEventListener("clearspace:focus", onFocus);
      window.removeEventListener("clearspace:pulse", onPulse);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,0.12),transparent_28rem),linear-gradient(150deg,#0c0d0d,#141615_48%,#1d1b18)]" />
      {webgl ? (
        <Canvas
          className="absolute inset-0 opacity-80 md:opacity-100"
          dpr={[1, 1.45]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
          }}
        >
          <Suspense fallback={null}>
            <Scene focused={focused} />
          </Suspense>
        </Canvas>
      ) : null}
      <motion.div
        key={pulse}
        initial={{ opacity: 0, scale: 0.84 }}
        animate={{ opacity: [0, 0.45, 0], scale: [0.84, 1.12, 1.34] }}
        transition={{ duration: 1.35, ease: "easeOut" }}
        className="absolute left-1/2 top-[34%] h-72 w-72 -translate-x-1/2 rounded-full bg-accent-300/15 blur-3xl"
      />
      <motion.div
        animate={{
          opacity: focused ? 0.95 : 0.65,
          scale: focused ? 1.04 : 1
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(248,245,239,0.08),transparent_64%)]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,13,0.22),rgba(12,13,13,0.78)_78%,rgba(12,13,13,0.94))]" />
      <div className="absolute inset-0 backdrop-blur-[0.4px]" />
    </div>
  );
}

