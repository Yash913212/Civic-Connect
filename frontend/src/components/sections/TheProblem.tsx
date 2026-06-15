"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function TheProblem() {
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    { title: "Citizen uploads image", desc: "A pothole, a broken streetlight, or garbage." },
    { title: "Manual routing delays response", desc: "Clerks spend hours sorting through submissions." },
    { title: "Language barriers create confusion", desc: "Multi-lingual complaints get lost in translation." },
    { title: "Departments receive incorrect complaints", desc: "Misrouted issues cause endless loops." },
    { title: "Critical issues remain unresolved", desc: "Citizens lose trust in the system." },
  ];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const wrapper = document.querySelector(".problem-wrapper") as HTMLElement;
      if (!wrapper) return;

      gsap.to(wrapper, {
        x: () => -(window.innerWidth * (steps.length - 1)),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (steps.length - 1),
          end: () => "+=" + (window.innerWidth * steps.length),
          invalidateOnRefresh: true
        }
      });
    });

    return () => mm.revert();
  }, []);



  return (
    <section ref={containerRef} className="min-h-screen md:h-screen w-full flex flex-col md:flex-row items-stretch md:items-center bg-transparent overflow-hidden relative border-t border-white/5 py-16 md:py-0">
      <div className="relative md:absolute top-0 left-0 md:top-20 md:left-20 z-10 px-6 md:px-0 mb-8 md:mb-0">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white leading-tight">
          Cities Generate <span className="text-destructive">Thousands</span><br className="hidden md:block" /> of Complaints Every Day
        </h2>
      </div>

      <div className="problem-wrapper flex flex-col md:flex-row w-full md:w-max h-auto md:h-full items-stretch md:items-center">
        {steps.map((step, i) => (
          <div key={i} className="problem-frame w-full md:w-screen h-auto md:h-full flex flex-col justify-center items-start md:items-center px-6 md:px-20 py-8 md:py-0">
            <div className="max-w-3xl w-full pt-4 md:pt-32">
              <div className="text-[80px] md:text-[180px] font-bold text-white/5 leading-none mb-4 md:mb-12">{i + 1}</div>
              <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 md:mb-6">{step.title}</h3>
              <p className="text-base md:text-xl text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
