"use client";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative w-full min-h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden py-16 md:py-0">
      {/* Particles/Noise overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <h2 className="text-3xl sm:text-5xl md:text-8xl font-heading font-black tracking-tighter mb-8 max-w-5xl text-glow text-white leading-tight">
          BUILDING SMARTER CITIES WITH AI
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
          <Link 
            href="/citizen/dashboard"
            className="px-10 py-5 bg-white text-black rounded-full font-bold text-base md:text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] inline-block text-center"
          >
            Enter Citizen Portal
          </Link>
          <button 
            onClick={() => document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-10 py-5 bg-transparent border border-white/20 text-white rounded-full font-bold text-base md:text-lg backdrop-blur-md hover:bg-white/10 transition-colors duration-300 text-center"
          >
            View Demo
          </button>
        </div>
      </div>
    </section>
  );
}
