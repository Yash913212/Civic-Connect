"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { MessageSquare, GitBranch, Mail, MapPin, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".marquee-inner", {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
      });
    }, marqueeRef);
    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-transparent relative border-t border-black/5 dark:border-white/10 overflow-hidden pt-20">
      {/* Marquee */}
      <div ref={marqueeRef} className="w-full overflow-hidden border-y border-black/5 dark:border-white/10 py-4 mb-20 bg-primary/5">
        <div className="marquee-inner flex whitespace-nowrap text-3xl font-heading font-bold text-slate-500 dark:text-white/20 uppercase tracking-widest w-max">
          <span>AI • SMART CITY • CIVIC INTELLIGENCE • FUTURE GOVERNANCE •&nbsp;</span>
          <span>AI • SMART CITY • CIVIC INTELLIGENCE • FUTURE GOVERNANCE •&nbsp;</span>
          <span>AI • SMART CITY • CIVIC INTELLIGENCE • FUTURE GOVERNANCE •&nbsp;</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
              <img src="/logo.png" alt="Civic Connect Logo" className="object-contain w-full h-full" />
            </div>
            <span className="text-xl font-bold font-heading text-slate-900 dark:text-white tracking-wider">
              Civic Connect
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/50 w-fit px-4 py-2 rounded-full mb-6 backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AI System Online
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Empowering municipalities with autonomous issue detection, routing, and predictive analytics.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-5">Quick Links</h4>
          <ul className="space-y-3">
            {[
              { label: "Home", href: "/home" },
              { label: "Technology", href: "/home#technology" },
              { label: "Live Demo", href: "/home#live-demo" },
              { label: "Roadmap", href: "/home#roadmap" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-1 group"
                >
                  {link.label}
                  <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Portals */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-5">Portals</h4>
          <ul className="space-y-3">
            {[
              { label: "Citizen Dashboard", href: "/citizen/dashboard" },
              { label: "Officer Portal", href: "/officer/dashboard" },
              { label: "Admin Console", href: "/admin/dashboard" },
              { label: "User Profile", href: "/citizen/profile" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-1 group"
                >
                  {link.label}
                  <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Feedback & Contact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-5">Connect</h4>
          <ul className="space-y-3">
            <li>
              <Link
                href="/feedback"
                className="text-sm flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all font-semibold"
              >
                <MessageSquare className="w-4 h-4" />
                Send Feedback
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/Yash913212/CivicConnect"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 group"
              >
                <GitBranch className="w-4 h-4" />
                GitHub Repository
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
              </a>
            </li>
            <li>
              <a
                href="mailto:yash@civicai.org"
                className="text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 group"
              >
                <Mail className="w-4 h-4" />
                yash@civicai.org
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
              </a>
            </li>
            <li>
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Smart City Grid
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-black/5 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-white/30">
          &copy; {new Date().getFullYear()} Civic Connect. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={scrollToTop}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Back to top
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
