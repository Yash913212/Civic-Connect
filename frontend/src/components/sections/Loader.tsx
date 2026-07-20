"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Loader() {
  const [progress, setProgress] = useState(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("transition-from-login") === "true") {
      return 85;
    }
    return 0;
  });
  const loaderRef = useRef<HTMLDivElement>(null);

  const words = ["Detect", "Analyze", "Route", "Predict", "Resolve"];

  useEffect(() => {
    if (!loaderRef.current) return;

    const isFromLogin = typeof window !== "undefined" && sessionStorage.getItem("transition-from-login") === "true";
    if (isFromLogin) {
      sessionStorage.removeItem("transition-from-login");
    }

    // Progress counter
    const ctx = gsap.context(() => {
      if (isFromLogin) {
        const tl = gsap.timeline({
          onComplete: () => {
            gsap.to(loaderRef.current, {
              yPercent: -100,
              duration: 0.8,
              ease: "power4.out",
            });
          }
        });

        tl.to({ val: 85 }, {
          val: 100,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: function () {
            setProgress(Math.floor(this.targets()[0].val));
          }
        });

        // Fast-track word rotation
        gsap.to(`.word-3`, {
          y: 0,
          opacity: 1,
          duration: 0.3,
          delay: 0,
          ease: "back.out",
        });
        gsap.to(`.word-3`, {
          y: -20,
          opacity: 0,
          duration: 0.3,
          delay: 0.3,
          ease: "power2.in",
        });
        gsap.to(`.word-4`, {
          y: 0,
          opacity: 1,
          duration: 0.3,
          delay: 0.5,
          ease: "back.out",
        });
      } else {
        const tl = gsap.timeline({
          onComplete: () => {
            gsap.to(loaderRef.current, {
              yPercent: -100,
              duration: 1.5,
              ease: "power4.inOut",
            });
          }
        });

        tl.to({ val: 0 }, {
          val: 100,
          duration: 3,
          ease: "power2.inOut",
          onUpdate: function () {
            setProgress(Math.floor(this.targets()[0].val));
          }
        });

        // Word rotation
        words.forEach((word, i) => {
          gsap.to(`.word-${i}`, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: i * 0.6,
            ease: "back.out",
          });
          if (i < words.length - 1) {
            gsap.to(`.word-${i}`, {
              y: -20,
              opacity: 0,
              duration: 0.5,
              delay: (i * 0.6) + 0.5,
              ease: "power2.in",
            });
          }
        });
      }
    }, loaderRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Self-contained premium animations */}
      <style>{`
        @keyframes gridScroll {
          0% {
            background-position-y: 0px;
          }
          100% {
            background-position-y: 1000px;
          }
        }
        @keyframes floatBlob1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10%, 8%) scale(1.1); }
          100% { transform: translate(-5%, 15%) scale(0.95); }
        }
        @keyframes floatBlob2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-12%, -10%) scale(0.9); }
          100% { transform: translate(8%, -4%) scale(1.05); }
        }
        @keyframes floatBlob3 {
          0% { transform: translate(0, 0) scale(0.95); }
          50% { transform: translate(-8%, 12%) scale(1.15); }
          100% { transform: translate(12%, -8%) scale(1); }
        }
        @keyframes scanlineDrift {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }
        .text-glow-premium {
          text-shadow: 0 0 15px rgba(255,255,255,0.2), 0 0 30px rgba(0,240,255,0.3);
        }
      `}</style>

      {/* Layer 1: Ambient Glowing Neon Aura Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-70">
        <div 
          className="absolute w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[130px]"
          style={{
            animation: 'floatBlob1 25s ease-in-out infinite alternate',
            left: '-15%',
            top: '-15%'
          }}
        />
        <div 
          className="absolute w-[55vw] h-[55vw] rounded-full bg-purple-500/10 blur-[140px]"
          style={{
            animation: 'floatBlob2 30s ease-in-out infinite alternate',
            right: '-15%',
            bottom: '-15%'
          }}
        />
        <div 
          className="absolute w-[40vw] h-[40vw] rounded-full bg-emerald-600/15 blur-[110px]"
          style={{
            animation: 'floatBlob3 20s ease-in-out infinite alternate',
            left: '30%',
            top: '20%'
          }}
        />
      </div>

      {/* Layer 2: Scrolling 3D Cyber Mesh Grid */}
      <div 
        className="absolute inset-0 opacity-[0.22] pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          backgroundPosition: 'center top',
          transform: 'perspective(500px) rotateX(60deg) translateY(-25%) scale(1.5)',
          transformOrigin: 'top center',
          animation: 'gridScroll 24s linear infinite',
        }} 
      />

      {/* Layer 3: Cyberpunk Binary Pulsing Streams */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-[0.06] font-mono text-[9px] text-teal-400">
        <div className="absolute left-[8%] animate-[pulse_4s_infinite]" style={{ top: '18%' }}>01100011 01101001 01110110</div>
        <div className="absolute right-[10%] animate-[pulse_5s_infinite_delay-1s]" style={{ top: '28%' }}>01101001 01100011 01000001</div>
        <div className="absolute left-[14%] animate-[pulse_6s_infinite_delay-2s]" style={{ bottom: '25%' }}>01001001 01001110 01010100</div>
        <div className="absolute right-[16%] animate-[pulse_3s_infinite_delay-3s]" style={{ bottom: '35%' }}>01000101 01001100 01001100</div>
      </div>

      {/* Layer 4: Cyber CRT Scanlines and drifts */}
      <div 
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
          backgroundSize: '100% 4px, 6px 100%',
          opacity: '0.45'
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background: 'linear-gradient(0deg, transparent 0%, rgba(0, 240, 255, 0.06) 10%, transparent 20%)',
          animation: 'scanlineDrift 10s linear infinite',
        }}
      />

      {/* Center Content */}
      <div className="z-10 text-center font-heading">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow-premium text-slate-900 dark:text-white tracking-wider">Nagara Netra</h1>
        <div className="h-10 relative overflow-hidden flex justify-center items-center text-primary text-xl font-medium tracking-wide">
          {words.map((word, i) => (
            <span key={word} className={`word-${i} absolute opacity-0 translate-y-8`}>
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Loading Progress */}
      <div className="absolute bottom-20 w-64 md:w-96 flex flex-col items-center gap-4 z-10">
        <div className="text-3xl font-mono font-light text-slate-600 dark:text-white/80 tracking-widest">{progress.toString().padStart(3, '0')}</div>
        <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(255,255,255,0.05)] border border-white/5">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-purple-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
