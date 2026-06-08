"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas } from "@react-three/fiber";
import NeuralNetwork from "@/components/canvas/NeuralNetwork";
import CinematicVideo from "@/components/ui/CinematicVideo";

export default function GlobalBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full z-[-1] overflow-hidden bg-background pointer-events-none">
      
      {/* Layer 1: Cinematic Video */}
      <CinematicVideo
        ref={videoRef}
        className="opacity-80"
        zoom={true}
      />

      {/* Layer 2: Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background opacity-90" />

      {/* Layer 3: AI Glow Overlay */}
      <div 
        ref={glowRef}
        className="absolute inset-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 0%, transparent 70%)"
        }}
      />

      {/* Layer 4: Animated Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "center center",
          perspective: "1000px",
          transform: "rotateX(60deg) scale(2)",
          transformOrigin: "bottom center",
        }}
      />

      {/* Layer 5 & 6: Neural Network Animation (R3F Canvas) */}
      <div className="absolute inset-0 z-10 opacity-70">
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
          <NeuralNetwork />
        </Canvas>
      </div>

      {/* Layer 7 is the actual page content sitting in front of this fixed container */}
    </div>
  );
}
