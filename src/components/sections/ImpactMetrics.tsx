"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function ImpactMetrics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const metrics = [
    { value: 50, suffix: "K+", label: "Complaints Processed" },
    { value: 96.4, suffix: "%", label: "Routing Accuracy", decimals: 1 },
    { value: 80, suffix: "%", label: "Reduction in Manual Work" },
    { value: 3, suffix: "x", label: "Faster Resolution" },
  ];

  return (
    <section ref={ref} className="py-32 w-full bg-transparent border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-12">
        {metrics.map((metric, i) => (
          <Counter key={i} {...metric} start={isInView} delay={i * 0.2} />
        ))}
      </div>
    </section>
  );
}

function Counter({ value, suffix, label, decimals = 0, start, delay }: any) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTimestamp: number | null = null;
    const duration = 2000;
    const delayMs = delay * 1000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp - delayMs) / duration, 1);

      if (progress >= 0) {
        // ease out quart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(easeProgress * value);
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    window.requestAnimationFrame(step);
  }, [start, value, delay]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-5xl md:text-7xl font-bold font-mono mb-4 text-glow text-white">
        {count.toFixed(decimals)}{suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
}
