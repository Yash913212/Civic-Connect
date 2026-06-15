"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Footer() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.to(".marquee-inner", {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
      });
    }, marqueeRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className="w-full bg-transparent relative border-t border-black/5 dark:border-white/10 overflow-hidden pt-20">
      {/* Infinite Marquee */}
      <div ref={marqueeRef} className="w-full overflow-hidden border-y border-black/5 dark:border-white/10 py-4 mb-20 bg-primary/5">
        <div className="marquee-inner flex whitespace-nowrap text-3xl font-heading font-bold text-slate-500 dark:text-white/20 uppercase tracking-widest w-max">
          <span>AI • SMART CITY • CIVIC INTELLIGENCE • FUTURE GOVERNANCE •&nbsp;</span>
          <span>AI • SMART CITY • CIVIC INTELLIGENCE • FUTURE GOVERNANCE •&nbsp;</span>
          <span>AI • SMART CITY • CIVIC INTELLIGENCE • FUTURE GOVERNANCE •&nbsp;</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative h-20 w-20 rounded-xl overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Civic Connect Logo" className="object-contain w-full h-full" />
            </div>
            <span className="text-2xl font-bold font-heading text-slate-900 dark:text-white tracking-wider">
              Civic Connect
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 w-fit px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AI System Online
          </div>
          <p className="text-muted-foreground text-sm max-w-sm">
            Empowering municipalities with autonomous issue detection, routing, and predictive analytics.
          </p>
        </div>

        <div className="flex flex-col md:items-end">
          <ul className="flex flex-col gap-4 text-right">
            {['Home', 'Technology', 'Demo', 'Dashboard', 'Contact', 'GitHub'].map((link) => (
              <li key={link}>
                <a href="#" className="text-muted-foreground hover:text-slate-900 dark:text-white hover:pl-2 transition-all duration-300">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center py-6 border-t border-black/5 dark:border-white/10 text-xs text-slate-500 dark:text-white/30">
        &copy; {new Date().getFullYear()} Civic Connect. All rights reserved. Award-winning Apple-level Design.
      </div>
    </footer>
  );
}
