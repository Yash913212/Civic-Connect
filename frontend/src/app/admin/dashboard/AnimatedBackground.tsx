"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060a0a] via-[#080c0c] to-[#0a0e0e]" />
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full opacity-[0.04] blur-[200px]"
        style={{
          background: "radial-gradient(circle, #10b981, transparent)",
          left: `calc(${mousePos.x}px - 25vw)`,
          top: `calc(${mousePos.y}px - 25vw)`,
        }}
        transition={{ type: "spring", stiffness: 30, damping: 30 }}
      />
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full opacity-[0.03] blur-[200px]"
        style={{
          background: "radial-gradient(circle, #8b5cf6, transparent)",
          left: `calc(100% - ${mousePos.x}px - 20vw)`,
          top: `calc(${mousePos.y}px - 20vw)`,
        }}
        transition={{ type: "spring", stiffness: 25, damping: 35 }}
      />
      <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/[0.03] blur-[150px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-purple-500/[0.03] blur-[150px] animate-blob animation-delay-2000" />
      <div className="absolute top-[40%] right-[30%] w-[25vw] h-[25vw] rounded-full bg-amber-500/[0.02] blur-[120px] animate-blob animation-delay-4000" />
      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
    </div>
  );
}
