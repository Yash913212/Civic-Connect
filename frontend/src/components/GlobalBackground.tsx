"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import NeuralNetwork from "@/components/canvas/NeuralNetwork";
import CinematicVideo from "@/components/ui/CinematicVideo";

export default function GlobalBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Create a master timeline linked to the full page scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        }
      });

      // Hero -> Problem (0% to ~20%)
      // Video zooms slowly and darkens
      tl.to(videoRef.current, {
        scale: 1,
        filter: "brightness(0.3) blur(4px)",
        duration: 1,
      }, 0);

      // Problem -> Solution/AI Workflow (~20% to ~40%)
      // Video brightens again
      tl.to(videoRef.current, {
        filter: "brightness(0.7) blur(2px)",
        duration: 1,
      }, 1);

      // Dashboard / Command Center (~40% to ~60%)
      // Gains blue holographic glow
      tl.to(glowRef.current, {
        opacity: 0.8,
        scale: 1.2,
        duration: 1,
      }, 2);
      
      tl.to(videoRef.current, {
        filter: "brightness(0.5) blur(6px) hue-rotate(45deg)",
        duration: 1,
      }, 2);

      // Roadmap -> Footer (~60% to 100%)
      // Fade out
      tl.to(videoRef.current, {
        opacity: 0,
        y: "20%",
        duration: 2,
      }, 3);

    }, containerRef);

    return () => ctx.revert();
  }, [mounted]);

  // Derive resolved theme only after mount to avoid SSR/client mismatch.
  // Before mount, default to "dark" so the initial DOM structure is stable.
  const isLight = mounted ? theme === "light" : false;

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full z-[-1] overflow-hidden pointer-events-none transition-colors duration-500">
      
      {/* Layer 1: Cinematic Video (Dark mode only) — always rendered, hidden via CSS */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: isLight ? 0 : 1, pointerEvents: "none" }}
      >
        <CinematicVideo
          ref={videoRef}
          className="opacity-80"
          zoom={true}
        />
      </div>

      {/* Layer 2: Gradient Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${
        isLight 
          ? "bg-gradient-to-br from-[#F8FAFC] via-[#FFFFFF] to-[#EEF6FF] opacity-100" 
          : "bg-gradient-to-b from-transparent via-background/60 to-background opacity-90"
      }`} />

      {/* Layer 3: AI Glow Overlay */}
      <div 
        ref={glowRef}
        className={`absolute inset-0 transition-opacity duration-1000 ${isLight ? 'opacity-50' : 'opacity-30'}`}
        style={{
          background: isLight 
            ? "radial-gradient(circle at 50% 50%, rgba(0, 200, 140, 0.08) 0%, transparent 60%)"
            : "radial-gradient(circle at 50% 50%, rgba(0, 200, 140, 0.12) 0%, transparent 70%)"
        }}
      />

      {/* Layer 4: Animated Grid Pattern (Dark Mode Only) — always rendered, hidden via CSS */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: isLight ? 0 : 0.15,
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "center center",
          perspective: "1000px",
          transform: "rotateX(60deg) scale(2)",
          transformOrigin: "bottom center",
        }}
      />

      {/* Elegant Aurora Animation for Light Mode — always rendered, hidden via CSS */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000"
        style={{ opacity: isLight ? 0.6 : 0 }}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-300/40 mix-blend-multiply filter blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-300/40 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Layer 5 & 6: Neural Network Animation (R3F Canvas - Dark Mode Only) — always rendered, hidden via CSS */}
      <div
        className="absolute inset-0 z-10 transition-opacity duration-1000"
        style={{ opacity: isLight ? 0 : 0.7 }}
      >
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
          <NeuralNetwork />
        </Canvas>
      </div>

      {/* Layer 7 is the actual page content sitting in front of this fixed container */}
    </div>
  );
}
