"use client";

import { motion } from "framer-motion";

export function GlassCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ type: "spring", stiffness: 80, damping: 18 }}
      className={`relative p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] shadow-xl ${glow ? 'shadow-emerald-500/5' : ''} ${className}`}
    >
      {glow && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      )}
      {children}
    </motion.div>
  );
}
