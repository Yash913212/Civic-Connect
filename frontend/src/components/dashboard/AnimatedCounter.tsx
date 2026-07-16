"use client";

import { useState, useEffect, useRef } from "react";

export function AnimatedCounter({ value, suffix = "", duration = 2, prefix = "" }: {
  value: number; suffix?: string; duration?: number; prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}
