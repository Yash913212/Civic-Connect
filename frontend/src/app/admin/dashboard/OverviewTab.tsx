"use client";

import { Building2, FileText, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Shield, Activity, Zap, Users, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line, Legend } from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import confetti from "canvas-confetti";
import { toast } from "sonner";

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
    { icon: CheckCircle, text: "Complaint C-8842 resolved", time: "2 min ago", color: "#10b981" },
    { icon: Users, text: "Officer Priya assigned to C-8843", time: "15 min ago", color: "#06b6d4" },
    { icon: AlertTriangle, text: "Critical: Open manhole reported", time: "32 min ago", color: "#ef4444" },
    { icon: Building2, text: "New department: Forestry", time: "1 hour ago", color: "#8b5cf6" },
    { icon: FileText, text: "Monthly report generated", time: "2 hours ago", color: "#f59e0b" },
  ];
  return (
    <div className="space-y-1">
      {activities.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-default">
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]" style={{ color: a.color }}>
              <Icon size={12} />
            </div>
            <span className="text-xs text-white/70 flex-1">{a.text}</span>
            <span className="text-[10px] text-white/30">{a.time}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function OverviewTab({ kpis, trendsData, deptPerfData, prioData, loading }: {
  kpis: any; trendsData: any[]; deptPerfData: any[]; prioData: any[]; loading: boolean;
}) {
  return (
    <motion.div key="overview" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Complaints" value={kpis.total} trend="+12.5%" color="#10b981" delay={0} loading={loading} />
        <StatCard icon={AlertTriangle} label="Open Cases" value={kpis.open} color="#f59e0b" delay={0.08} loading={loading} />
        <StatCard icon={CheckCircle} label="Resolved" value={kpis.closed} trend="+8.3%" color="#10b981" delay={0.16} loading={loading} />
        <StatCard icon={TrendingUp} label="Resolution Rate" value={kpis.resolutionRate} suffix="%" trend="+5.1%" color="#06b6d4" delay={0.24} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2" glow>
          <SectionHeader icon={BarChart3} label="Complaint Trends" badge="Last 7 days" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="nt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="nr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" tick={{ fill: "rgba(255,255,255,0.6)" }} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" tick={{ fill: "rgba(255,255,255,0.6)" }} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="new" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#nt)" dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 2, stroke: "#1a1a2e" }}
                  activeDot={{ r: 5, stroke: "#8b5cf6", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#nr)" dot={{ r: 3, fill: "#10b981", strokeWidth: 2, stroke: "#1a1a2e" }}
                  activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={Shield} label="Priority Distribution" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={prioData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                  animationBegin={0} animationDuration={1500}>
                  {prioData.map((e, i) => <Cell key={i} fill={e.color} stroke={e.color} strokeOpacity={0.3}
                    style={{ filter: `drop-shadow(0 0 6px ${e.color}40)` }} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {prioData.map((p) => (
              <motion.div key={p.name} whileHover={{ x: 2 }}
                className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-white/[0.02] transition-colors cursor-default">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-white/50">{p.name}</span>
                <span className="font-semibold text-white ml-auto">{p.value}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2" glow>
          <SectionHeader icon={Building2} label="Department Efficiency" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerfData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.12)" tick={{ fill: "rgba(255,255,255,0.7)" }} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.12)" tick={{ fill: "#ffffff", fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<CustomTooltip />} formatter={(v: any) => [`${v ?? 0}%`, 'Efficiency']} />
                <Bar dataKey="efficiency" radius={[0, 6, 6, 0]} animationDuration={1500}>
                  {deptPerfData.map((e, i) => <Cell key={i} fill={e.fill}
                    style={{ filter: `drop-shadow(0 0 4px ${e.fill}60)` }} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={Activity} label="Recent Activity" />
          <ActivityFeed />
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard glow>
          <SectionHeader icon={Zap} label="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Department", icon: Building2, color: "#10b981", desc: "Create a new department" },
              { label: "Generate Report", icon: FileText, color: "#8b5cf6", desc: "Export monthly data" },
              { label: "Assign Officers", icon: Users, color: "#06b6d4", desc: "Manage assignments" },
              { label: "Sync Database", icon: RefreshCw, color: "#f59e0b", desc: "Refresh from server" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <motion.button key={a.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { toast.success(`${a.label}: Action triggered`); confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } }); }}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left group">
                  <motion.div whileHover={{ rotate: [0, -10, 10, 0] }}
                    className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] w-fit mb-3">
                    <Icon className="w-5 h-5" style={{ color: a.color }} />
                  </motion.div>
                  <span className="text-sm font-semibold text-white block">{a.label}</span>
                  <span className="text-[11px] text-white/40 mt-0.5 block">{a.desc}</span>
                </motion.button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={TrendingUp} label="Weekly Performance" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" tick={{ fill: "rgba(255,255,255,0.6)" }} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" tick={{ fill: "rgba(255,255,255,0.6)" }} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }} />
                <Bar dataKey="new" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#1a1a2e" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
