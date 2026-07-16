"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, type PanInfo } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { Shimmer } from "./Shimmer";

export function StatCard({ icon: Icon, label, value, suffix, trend, color, delay = 0, loading }: {
  icon: any; label: string; value: number; suffix?: string; trend?: string; color: string; delay?: number; loading?: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => { x.set(0); y.set(0); };

  const isPositive = trend?.startsWith('+');

  if (loading) return (
    <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06]">
      <Shimmer className="w-10 h-10 rounded-xl mb-4" />
      <Shimmer className="w-20 h-3 mb-3" />
      <Shimmer className="w-28 h-7" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, perspective: 800 }}
      className="relative group"
    >
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{ background: `linear-gradient(135deg, ${color}40, transparent, ${color}20)` }}
      />
      <div className="relative p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] group-hover:border-white/[0.12] shadow-xl overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[100px] opacity-[0.06] pointer-events-none group-hover:opacity-[0.12] transition-opacity duration-700"
          style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
        <div className="flex items-start justify-between mb-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </motion.div>
          {trend && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={`flex items-center gap-0.5 text-[11px] font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </motion.span>
          )}
        </div>
        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">{label}</span>
        <h3 className="text-2xl font-bold text-white mt-1 font-heading tracking-tight">
          <AnimatedCounter value={value} suffix={suffix || ""} duration={1.5} />
        </h3>
        <div className="mt-2 h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / (value + 100)) * 100, 100)}%` }}
            transition={{ delay: delay + 0.4, duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
