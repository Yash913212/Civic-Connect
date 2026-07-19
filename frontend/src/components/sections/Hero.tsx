"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from(".hero-content > *", {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        delay: 3.5, // wait for loader
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative w-full min-h-[100dvh] flex flex-col pt-32 pb-8 md:pb-12 overflow-hidden">
      {/* Background is now handled globally by GlobalBackground */}

      <div className="hero-content relative z-20 container mx-auto px-6 flex flex-col items-center text-center flex-grow justify-center py-10">
        <div className="inline-flex items-center rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-sm font-medium text-primary mb-6 md:mb-8 backdrop-blur-2xl shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(0,200,140,0.8)] animate-pulse" />
          AI Neural Network Active
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold font-heading tracking-tight mb-6 max-w-6xl leading-tight xl:leading-[1.1]">
          Transforming Civic Governance Through <br className="hidden md:block" />
          <span className="text-gradient">Artificial Intelligence</span>
        </h1>

        <p className="text-base md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-12 max-w-2xl font-light">
          Detect issues. Generate complaints. Predict departments. Route automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/citizen/dashboard"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_20px_rgba(0,200,140,0.3)] hover:shadow-[0_8px_30px_rgba(0,200,140,0.4)] w-full sm:w-auto text-center"
          >
            Citizen Portal
          </Link>
          <button 
            onClick={() => document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/5 text-slate-900 dark:text-white rounded-full font-medium backdrop-blur-2xl hover:bg-white/10 dark:hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center shadow-sm"
          >
            Watch AI Demo
          </button>
        </div>
      </div>

      {/* Floating Glass Cards */}
      <div className="relative z-20 container mx-auto px-6 grid grid-cols-3 gap-3 md:gap-4 lg:gap-6 w-full max-w-4xl mt-6 md:mt-auto pt-4 md:pt-8">
        {[
          { value: "96.4%", label: "Accuracy" },
          { value: "15+", label: "Departments" },
          { value: "50K+", label: "Complaints Processed" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl md:rounded-2xl p-3 md:p-6 backdrop-blur-2xl hover:bg-white/10 transition-all duration-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] text-center">
            <div className="text-base md:text-3xl font-bold text-slate-900 dark:text-white mb-0.5 md:mb-2">{stat.value}</div>
            <div className="text-[10px] md:text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
