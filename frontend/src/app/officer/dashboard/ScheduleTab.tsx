"use client";

import { Clock4, CalendarDays, Award } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.97 }),
};

export function ScheduleTab() {
  return (
    <motion.div key="schedule" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white font-heading">Shift Management</h2>
        <p className="text-sm text-white/40 mt-0.5">View and manage your duty schedule</p>
      </div>

      <GlassCard glow>
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Clock4 size={28} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">Current Shift</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-white/50">08:00 AM - 04:00 PM</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
            Log Break
          </button>
        </div>

        <SectionHeader icon={CalendarDays} label="Upcoming Shifts" />
        <div className="space-y-3">
          {[
            { day: "Tomorrow", time: "08:00 AM - 04:00 PM", role: "Primary Response" },
            { day: "Thursday", time: "12:00 PM - 08:00 PM", role: "Evening Patrol" },
            { day: "Friday", time: "Off Duty", role: "Rest Day" },
            { day: "Saturday", time: "06:00 AM - 02:00 PM", role: "Weekend Support" },
          ].map((shift, i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-white/[0.06] hover:bg-white/[0.02] transition-all">
              <div>
                <p className="font-bold text-white text-sm">{shift.day}</p>
                <p className="text-xs text-white/50 mt-0.5">{shift.time}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                shift.time === 'Off Duty' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {shift.role}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard glow>
        <SectionHeader icon={Award} label="Shift Stats" />
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Hours This Week", value: "32h", color: "#10b981" },
            { label: "On-Time Rate", value: "98%", color: "#06b6d4" },
            { label: "Days Off Left", value: "4", color: "#8b5cf6" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-xs text-white/50">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1 font-heading" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
