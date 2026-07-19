"use client";

import { motion } from "framer-motion";
import {
  Clock, CheckCircle, AlertTriangle, Target, TrendingUp, Gauge,
  ArrowUpRight, Building2, Timer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from "recharts";

const deptSLA = [
  { name: "Roads Dept", attainment: 82, target: 90, fill: "#f59e0b" },
  { name: "Drainage", attainment: 64, target: 90, fill: "#06b6d4" },
  { name: "Sanitation", attainment: 91, target: 90, fill: "#10b981" },
  { name: "Water Works", attainment: 95, target: 90, fill: "#3b82f6" },
  { name: "Electrical", attainment: 71, target: 90, fill: "#eab308" },
  { name: "Public Safety", attainment: 58, target: 90, fill: "#ef4444" },
  { name: "Traffic", attainment: 78, target: 90, fill: "#a855f7" },
];

const slaBreaches = [
  { id: "C-8839", dept: "Roads", hours: "98h", priority: "Critical", status: "Overdue" },
  { id: "C-8845", dept: "Public Safety", hours: "72h", priority: "Critical", status: "Escalated" },
  { id: "C-8846", dept: "Traffic", hours: "52h", priority: "High", status: "At Risk" },
];

export function SLATab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30">
          <Clock className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">SLA Compliance Dashboard</h2>
          <p className="text-xs text-muted-foreground">Real-time service level tracking & breach alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Gauge, label: "Overall SLA", value: "76.8%", trend: "-2.1%", color: "#f59e0b" },
          { icon: CheckCircle, label: "On-Time Resolved", value: "1,042", trend: "+8%", color: "#10b981" },
          { icon: AlertTriangle, label: "Active Breaches", value: "3", trend: "URGENT", color: "#ef4444" },
          { icon: Timer, label: "Avg Response", value: "4.2h", trend: "-18m", color: "#06b6d4" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-[0.06]"
                style={{ background: `radial-gradient(circle, ${stat.color}, transparent)` }} />
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  stat.label === 'Active Breaches' ? 'bg-rose-500/20 text-rose-500 animate-pulse' :
                  stat.trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                }`}>{stat.trend}</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</h3>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" /> Department SLA Attainment (%)
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptSLA} layout="vertical" barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.08} horizontal={false} />
                <XAxis type="number" stroke="#888" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: '#000000cc', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any) => [`${v ?? 0}%`, 'Attainment']}
                />
                <Bar dataKey="attainment" radius={[0, 6, 6, 0]} animationDuration={1500} name="attainment">
                  {deptSLA.map((e, i) => (
                    <Cell key={i} fill={e.attainment >= e.target ? '#10b981' : e.attainment >= 70 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
                <Bar dataKey="target" fill="#888" fillOpacity={0.2} radius={[0, 6, 6, 0]} animationDuration={1500} name="target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Active SLA Breaches
          </h4>
          <div className="space-y-3">
            {slaBreaches.map((breach, i) => (
              <motion.div
                key={breach.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{breach.id}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    breach.status === 'Overdue' ? 'bg-rose-500/20 text-rose-500' :
                    breach.status === 'Escalated' ? 'bg-amber-500/20 text-amber-500' : 'bg-teal-500/20 text-teal-500'
                  }`}>{breach.status}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 size={10} /> {breach.dept}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {breach.hours}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all">
            View All Breaches
          </button>
        </div>
      </div>
    </motion.div>
  );
}
