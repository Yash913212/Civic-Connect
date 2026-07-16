"use client";

import { CheckCircle, Clock, Activity, Target, TrendingUp, BarChart3, ChevronRight, FileText, MapPin, AlertTriangle, Users, Award } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import type { ComplaintData } from "@/services/complaintService";

const workloadData = [
  { name: 'Mon', tasks: 4 },
  { name: 'Tue', tasks: 7 },
  { name: 'Wed', tasks: 5 },
  { name: 'Thu', tasks: 8 },
  { name: 'Fri', tasks: 6 },
  { name: 'Sat', tasks: 2 },
  { name: 'Sun', tasks: 3 },
];

const performanceData = [
  { name: 'Week 1', resolved: 12, target: 10 },
  { name: 'Week 2', resolved: 15, target: 12 },
  { name: 'Week 3', resolved: 18, target: 15 },
  { name: 'Week 4', resolved: 22, target: 18 },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.97 }),
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] text-white/50 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-bold text-white">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </motion.div>
  );
}

function ActivityFeed() {
  const activities = [
    { icon: FileText, text: "New complaint assigned to you", time: "2m ago", color: "#10b981" },
    { icon: CheckCircle, text: "C-8842 marked as Resolved", time: "15m ago", color: "#10b981" },
    { icon: MapPin, text: "Field visit requested at 5th Ave", time: "1h ago", color: "#06b6d4" },
    { icon: AlertTriangle, text: "Backup requested at Main St.", time: "2h ago", color: "#f59e0b" },
    { icon: Users, text: "Shift swap approved", time: "4h ago", color: "#8b5cf6" },
    { icon: Award, text: "Performance rating: 4.8/5", time: "6h ago", color: "#f97316" },
  ];

  return (
    <div className="space-y-1">
      {activities.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors group cursor-default">
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0" style={{ color: a.color }}>
              <Icon size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate group-hover:text-white/90 transition-colors">{a.text}</p>
            </div>
            <span className="text-[10px] text-white/30 shrink-0">{a.time}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function PerformanceTab({ complaints, loading }: { complaints: ComplaintData[]; loading: boolean }) {
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const resolutionRate = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0;

  return (
    <motion.div key="performance" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-heading">Performance Metrics</h2>
        <p className="text-sm text-white/40 mt-0.5">Track your field performance and resolution stats</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label="Resolution Rate" value={resolutionRate} suffix="%" trend="+2%" color="#10b981" delay={0} loading={loading} />
        <StatCard icon={Clock} label="Avg Completion" value={2.4} suffix="h" trend="-0.3h" color="#06b6d4" delay={0.08} loading={loading} />
        <StatCard icon={Activity} label="Cases Handled" value={complaints.length} color="#8b5cf6" delay={0.16} loading={loading} />
        <StatCard icon={Target} label="Satisfaction" value={4.8} suffix="/5" trend="+0.2" color="#f59e0b" delay={0.24} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard glow>
          <SectionHeader icon={TrendingUp} label="Daily Workload Trend" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workloadData}>
                <defs>
                  <linearGradient id="ot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tasks" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#ot)"
                  dot={{ r: 3, fill: "#06b6d4", strokeWidth: 2, stroke: "#1a1a2e" }}
                  activeDot={{ r: 5, stroke: "#06b6d4", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={BarChart3} label="Resolution vs Target" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<CustomTooltip />} />
                <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" animationDuration={1500} />
                <Bar dataKey="target" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} name="Target" animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard glow>
        <SectionHeader icon={Activity} label="Recent Activity" />
        <ActivityFeed />
      </GlassCard>
    </motion.div>
  );
}
