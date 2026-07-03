"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function WarpTransition() {
  const [statusText, setStatusText] = useState("ESTABLISHING CIVIC LINK...");
  const [particles, setParticles] = useState<{ id: number; angle: number; speed: number; delay: number; scale: number }[]>([]);

  useEffect(() => {
    // Generate particles flying out from center
    const tempParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2, // Random angle in radians
      speed: Math.random() * 20 + 10,     // Speed factor
      delay: Math.random() * 0.4,         // Staggered delay
      scale: Math.random() * 1.5 + 0.5,   // Size scale
    }));
    setParticles(tempParticles);

    // Dynamic terminal text change for ultimate sci-fi realism
    const textSequence = [
      { delay: 300, text: "INITIALIZING NEURAL NETWORKS..." },
      { delay: 650, text: "DECRYPTING DISTRICT KEY..." },
      { delay: 1000, text: "SYNCHRONIZING CIVIC CORES..." },
      { delay: 1300, text: "PORTAL ENGAGED. LAUNCHING DASHBOARD..." }
    ];

    const timers = textSequence.map(item => 
      setTimeout(() => setStatusText(item.text), item.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md pointer-events-none">
      
      {/* Radial glow background at center */}
      <div className="absolute w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(0,240,255,0.2)_0%,transparent_70%)] rounded-full blur-2xl" />

      {/* Cyberpunk Expanding Concentric Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ring 1 */}
        <motion.div
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{ width: "120vw", height: "120vw", opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute border border-teal-400/50 rounded-full shadow-[0_0_50px_rgba(0,240,255,0.4)]"
        />
        
        {/* Ring 2 */}
        <motion.div
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{ width: "140vw", height: "140vw", opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
          className="absolute border border-purple-500/40 rounded-full shadow-[0_0_60px_rgba(168,85,247,0.3)]"
        />

        {/* Ring 3 */}
        <motion.div
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{ width: "160vw", height: "160vw", opacity: [0, 0.3, 0] }}
          transition={{ duration: 2.0, ease: "easeOut", delay: 0.4 }}
          className="absolute border-2 border-teal-300/30 rounded-full shadow-[0_0_80px_rgba(0,240,255,0.2)]"
        />
      </div>

      {/* Radial Warp Particles Tunnel */}
      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => {
          const xDest = Math.cos(p.angle) * 1200;
          const yDest = Math.sin(p.angle) * 1200;
          return (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ 
                x: xDest, 
                y: yDest, 
                scale: [0, p.scale, 0.2], 
                opacity: [0, 0.9, 0] 
              }}
              transition={{ 
                duration: 1.4, 
                ease: "easeIn", 
                delay: p.delay,
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="absolute w-1.5 h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full shadow-[0_0_8px_#00f0ff]"
            />
          );
        })}
      </div>

      {/* Speed Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.8)_80%)] opacity-80" />

      {/* Futuristic status text panel */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Core Ring */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.1, 0.95], opacity: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="relative w-28 h-28 flex items-center justify-center mb-6"
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-teal-400/30 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-double border-purple-500/40 animate-[spin_6s_linear_infinite_reverse]" />
          <div className="absolute inset-4 rounded-full bg-teal-400/5 backdrop-blur-md border border-teal-400/30 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-center">
            <svg className="w-10 h-10 text-teal-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
            </svg>
          </div>
        </motion.div>

        {/* Console-style Status */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-2"
        >
          <div className="text-teal-400 font-mono text-sm tracking-[0.25em] font-semibold text-glow drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">
            {statusText}
          </div>
          <div className="text-white/40 font-mono text-[10px] tracking-widest uppercase">
            SECURE HANDSHAKE V3.94
          </div>
        </motion.div>
      </div>

      {/* Screen-covering Light Burst Overlay (Apex Flash) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ times: [0, 0.75, 1], duration: 1.8, ease: "easeIn" }}
        className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff] via-white to-purple-600 mix-blend-screen opacity-0"
        style={{ filter: "blur(20px)" }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ times: [0, 0.8, 1], duration: 1.8, ease: "easeIn" }}
        className="absolute inset-0 bg-black opacity-0"
      />
    </div>
  );
}
