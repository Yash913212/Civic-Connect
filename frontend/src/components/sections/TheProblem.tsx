"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera, Clock, Languages, Route, Frown, ArrowDown } from "lucide-react";

const steps = [
  { title: "Citizen uploads image", desc: "A pothole, a broken streetlight, or garbage.", icon: Camera, color: "from-emerald-400 to-teal-400" },
  { title: "Manual routing delays response", desc: "Clerks spend hours sorting through submissions.", icon: Clock, color: "from-amber-400 to-orange-400" },
  { title: "Language barriers create confusion", desc: "Multi-lingual complaints get lost in translation.", icon: Languages, color: "from-purple-400 to-pink-400" },
  { title: "Departments receive incorrect complaints", desc: "Misrouted issues cause endless loops.", icon: Route, color: "from-red-400 to-rose-400" },
  { title: "Critical issues remain unresolved", desc: "Citizens lose trust in the system.", icon: Frown, color: "from-slate-400 to-gray-400" },
];

export default function TheProblem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const container = containerRef.current;

    mm.add("(min-width: 768px)", () => {
      const wrapper = document.querySelector(".problem-wrapper") as HTMLElement;
      if (!wrapper) return;

      const totalScroll = window.innerWidth * (steps.length - 1);
      gsap.to(wrapper, {
        x: () => -(window.innerWidth * (steps.length - 1)),
        ease: "none",
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          snap: 1 / (steps.length - 1),
          end: () => "+=" + totalScroll,
          invalidateOnRefresh: true,
        },
      });

      // Update active step indicator
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: () => "+=" + totalScroll,
        scrub: 1,
        onUpdate: (self) => {
          if (progressRef.current) {
            const progress = self.progress * 100;
            progressRef.current.style.width = `${progress}%`;
          }
        },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="min-h-screen md:h-screen w-full flex flex-col md:flex-row items-stretch md:items-center bg-transparent overflow-hidden relative border-t border-white/5 py-16 md:py-0"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 md:h-1 bg-white/5 z-20">
        <div ref={progressRef} className="h-full bg-gradient-to-r from-primary to-purple-500 w-0 transition-all duration-100" />
      </div>

      {/* Header */}
      <div className="relative md:absolute top-0 left-0 md:top-20 md:left-20 z-10 px-6 md:px-0 mb-8 md:mb-0">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white leading-tight">
          Cities Generate{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-destructive to-orange-500">
            Thousands
          </span>
          <br className="hidden md:block" /> of Complaints Every Day
        </h2>
        <div className="hidden md:flex items-center gap-2 mt-6 text-sm text-muted-foreground animate-bounce">
          <ArrowDown className="w-4 h-4" />
          Scroll to see the problem chain
        </div>
      </div>

      {/* Steps */}
      <div className="problem-wrapper flex flex-col md:flex-row w-full md:w-max h-auto md:h-full items-stretch md:items-center">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="problem-frame w-full md:w-screen h-auto md:h-full flex flex-col justify-center items-start md:items-center px-6 md:px-20 py-8 md:py-0 relative"
            >
              {/* Background accent */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${step.color} opacity-[0.02] dark:opacity-[0.04] pointer-events-none`}
              />

              <div className="max-w-3xl w-full pt-4 md:pt-32 relative">
                {/* Step number */}
                <div className="text-[80px] md:text-[180px] font-bold text-black/5 dark:text-white/5 leading-none mb-4 md:mb-8 select-none">
                  {i + 1}
                </div>

                {/* Icon */}
                <div className="relative mb-6">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg`}
                  >
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 md:mb-6 text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-base md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  {step.desc}
                </p>

                {/* Step indicator */}
                <div className="mt-8 flex items-center gap-2">
                  {steps.map((_, j) => (
                    <div
                      key={j}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        j === i ? "w-8 bg-primary" : j < i ? "w-2 bg-primary/30" : "w-2 bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
