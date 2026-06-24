"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mic, MessageCircle, Cpu, Drone, Globe, ArrowRight } from "lucide-react";

const milestones = [
  { year: 2026, title: "Voice Complaints", desc: "Native multilingual audio processing for inclusive civic reporting.", icon: Mic },
  { year: 2027, title: "WhatsApp Integration", desc: "Report issues directly via chat — meet citizens where they are.", icon: MessageCircle },
  { year: 2028, title: "IoT Sensors", desc: "Automated anomaly detection from smart city sensor networks.", icon: Cpu },
  { year: 2029, title: "Drone Monitoring", desc: "Aerial surveys of infrastructure with AI-powered damage detection.", icon: Drone },
  { year: 2030, title: "Digital Twin Cities", desc: "Full 3D city simulations for predictive governance and planning.", icon: Globe },
];

export default function FutureRoadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const items = gsap.utils.toArray(".roadmap-item");
      if (!items.length) return;

      gsap.to(items, {
        yPercent: -100 * (items.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (items.length - 1),
          end: () => "+=" + (window.innerHeight * items.length),
          invalidateOnRefresh: true,
        },
      });

      // Animate timeline dot
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: () => "+=" + (window.innerHeight * items.length),
        scrub: 1,
        onUpdate: (self) => {
          if (dotRef.current && lineRef.current) {
            const lineHeight = lineRef.current.offsetHeight;
            const maxTranslate = lineHeight - 24;
            dotRef.current.style.transform = `translateY(${self.progress * maxTranslate}px)`;
          }
        },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      id="roadmap"
      ref={containerRef}
      className="min-h-screen md:h-screen w-full flex flex-col md:flex-row bg-transparent overflow-hidden relative border-t border-white/5"
    >
      {/* Left panel */}
      <div className="w-full md:w-1/2 h-auto md:h-full flex flex-col justify-center px-6 py-16 md:py-0 md:px-12 lg:px-24 relative z-10 bg-white/40 dark:bg-black/40 backdrop-blur-md border-b md:border-b-0 md:border-r border-black/5 dark:border-white/10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-6">
          Future of{" "}
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            Civic Governance
          </span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed">
          Our roadmap to building fully autonomous, self-healing smart cities powered by AI.
        </p>
        <div className="hidden md:flex items-center gap-2 mt-8 text-sm text-muted-foreground">
          <ArrowRight className="w-4 h-4 text-primary" />
          Scroll through the timeline
        </div>
      </div>

      {/* Right panel with timeline */}
      <div className="w-full md:w-1/2 h-auto md:h-full relative overflow-hidden flex flex-col">
        {/* Vertical timeline line */}
        <div className="hidden md:block absolute left-12 top-0 bottom-0 w-0.5 bg-white/10 z-10">
          <div ref={lineRef} className="h-full relative">
            <div
              ref={dotRef}
              className="absolute -left-[5px] w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)] z-20"
            />
          </div>
        </div>

        {milestones.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="roadmap-item flex-shrink-0 h-auto md:h-full w-full flex flex-col justify-center px-6 md:px-20 py-12 md:py-0 border-b border-black/5 dark:border-white/5 last:border-0 relative"
            >
              {/* Timeline dot (mobile) */}
              <div className="md:hidden flex items-center gap-4 mb-4">
                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="md:pl-20">
                {/* Year badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-4">
                  <Icon className="w-3 h-3" />
                  {item.year}
                </div>
                <h3 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-base md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
