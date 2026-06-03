"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function FutureRoadmap() {
  const containerRef = useRef<HTMLDivElement>(null);

  const milestones = [
    { title: "Voice Complaints", desc: "Native multilingual audio processing." },
    { title: "WhatsApp Integration", desc: "Report issues directly via chat." },
    { title: "IoT Sensors", desc: "Automated anomaly detection." },
    { title: "Drone Monitoring", desc: "Aerial surveys of infrastructure." },
    { title: "Digital Twin Cities", desc: "Full 3D city simulations." },
  ];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const items = gsap.utils.toArray(".roadmap-item");

      gsap.to(items, {
        yPercent: -100 * (items.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (items.length - 1),
          end: () => "+=" + (window.innerHeight * items.length),
          invalidateOnRefresh: true
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="roadmap" ref={containerRef} className="min-h-screen md:h-screen w-full flex flex-col md:flex-row bg-transparent overflow-hidden relative border-t border-white/5">
      <div className="w-full md:w-1/2 h-auto md:h-full flex flex-col justify-center px-6 py-16 md:py-0 md:px-12 lg:px-24 relative z-10 bg-black/40 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-6">Future of <br className="hidden md:block" /><span className="text-primary text-glow">Civic Governance</span></h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-md">Our roadmap to building fully autonomous, self-healing smart cities.</p>
      </div>

      <div className="w-full md:w-1/2 h-auto md:h-full relative overflow-hidden flex flex-col">
        {milestones.map((item, i) => (
          <div key={i} className="roadmap-item flex-shrink-0 h-auto md:h-full w-full flex flex-col justify-center px-6 md:px-20 py-12 md:py-0 border-b border-white/5 last:border-0">
            <div className="text-[60px] md:text-[120px] font-bold text-white/5 leading-none mb-2 md:mb-4 tracking-tighter whitespace-nowrap">{2026 + i}</div>
            <h3 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">{item.title}</h3>
            <p className="text-base md:text-xl text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
