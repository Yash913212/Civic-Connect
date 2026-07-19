"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Server, Database, Wifi, Cpu, Activity, AlertTriangle, CheckCircle,
  RefreshCw, Clock, Terminal, Zap, Shield
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const responseTimeData = [
  { time: '00:00', latency: 45 }, { time: '04:00', latency: 62 },
  { time: '08:00', latency: 128 }, { time: '10:00', latency: 195 },
  { time: '12:00', latency: 178 }, { time: '14:00', latency: 210 },
  { time: '16:00', latency: 165 }, { time: '18:00', latency: 142 },
  { time: '20:00', latency: 98 }, { time: '22:00', latency: 52 },
];

const services = [
  { name: "API Gateway", status: "operational", uptime: "99.97%", icon: Server },
  { name: "Database Cluster", status: "operational", uptime: "99.99%", icon: Database },
  { name: "WebSocket Stream", status: "degraded", uptime: "98.2%", icon: Wifi },
  { name: "AI Inference", status: "operational", uptime: "99.5%", icon: Cpu },
  { name: "Notification Queue", status: "operational", uptime: "100%", icon: Activity },
  { name: "Auth Service", status: "operational", uptime: "99.98%", icon: Shield },
];

const recentEvents = [
  { type: "error", msg: "DB connection timeout", time: "3 min ago", severity: "high" },
  { type: "warn", msg: "High memory usage on worker-3", time: "15 min ago", severity: "medium" },
  { type: "info", msg: "Auto-scaling triggered: +2 nodes", time: "42 min ago", severity: "low" },
  { type: "success", msg: "SSL cert renewed for api.civicconnect.gov", time: "2h ago", severity: "info" },
  { type: "error", msg: "Rate limit hit on /api/complaints", time: "3h ago", severity: "medium" },
];

export function SystemHealthTab() {
  const [liveTime, setLiveTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(i);
  }, [autoRefresh]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">System Health Monitor</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Last updated: {liveTime.toLocaleTimeString('en-IN')} · Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            autoRefresh
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground'
          }`}
        >
          <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
          Auto
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Server, label: "Active Sessions", value: "1,247", trend: "+12%", color: "#10b981" },
          { icon: Database, label: "DB Queries/s", value: "2.3K", trend: "+8%", color: "#8b5cf6" },
          { icon: Wifi, label: "WebSocket Conn", value: "843", trend: "+5%", color: "#06b6d4" },
          { icon: Cpu, label: "Avg CPU Load", value: "43%", trend: "-2%", color: "#f59e0b" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-[0.06] group-hover:opacity-[0.12] transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(circle, ${stat.color}, transparent)` }}
              />
              <div className="flex items-start justify-between mb-2 relative">
                <Icon className="w-5 h-5 text-muted-foreground" style={{ color: stat.color }} />
                <span className="text-[10px] font-semibold text-emerald-500">{stat.trend}</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{stat.value}</h3>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> API Response Latency (ms)
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 bg-black/5 dark:bg-white/5 rounded">Today</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseTimeData}>
                <defs>
                  <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="time" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip
                  contentStyle={{ background: '#000000cc', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px', backdropFilter: 'blur(8px)' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#latGrad)" dot={false} activeDot={{ r: 5, fill: "#10b981" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-500" /> Service Status
          </h4>
          <div className="space-y-3">
            {services.map((svc, i) => {
              const Icon = svc.icon;
              const statusColor = svc.status === 'operational'
                ? 'bg-emerald-500' : svc.status === 'degraded'
                  ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <motion.div
                  key={svc.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{svc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{svc.uptime} uptime</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-semibold ${
                    svc.status === 'operational' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${
                      svc.status === 'operational' ? '' : 'animate-pulse'
                    }`} />
                    {svc.status === 'operational' ? 'OK' : 'Degraded'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-500" /> Recent System Events
          </h4>
          <button className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            View All
          </button>
        </div>
        <div className="space-y-2">
          {recentEvents.map((evt, i) => {
            const sevColors: Record<string, string> = {
              high: 'border-l-rose-500 bg-rose-500/5',
              medium: 'border-l-amber-500 bg-amber-500/5',
              low: 'border-l-teal-500 bg-teal-500/5',
              info: 'border-l-emerald-500 bg-emerald-500/5',
            };
            const icons: Record<string, any> = {
              error: AlertTriangle, warn: AlertTriangle, info: CheckCircle, success: CheckCircle,
            };
            const Icon = icons[evt.type] || Activity;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border-l-4 ${sevColors[evt.severity] || 'border-l-slate-500'} border border-black/5 dark:border-white/5`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  evt.type === 'error' ? 'text-rose-500' : evt.type === 'warn' ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <span className="flex-1 text-xs text-foreground">{evt.msg}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{evt.time}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
