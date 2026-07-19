"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  BarChart3, Target, Sparkles, Zap, MapPin, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";

const forecastData = [
  { month: 'Jan', predicted: 320, actual: 305 },
  { month: 'Feb', predicted: 280, actual: 290 },
  { month: 'Mar', predicted: 350, actual: 365 },
  { month: 'Apr', predicted: 400, actual: 388 },
  { month: 'May', predicted: 450, actual: 472 },
  { month: 'Jun', predicted: 520, actual: 510 },
  { month: 'Jul', predicted: 480, actual: null },
  { month: 'Aug', predicted: 420, actual: null },
];

const anomalies = [
  { dept: "Roads Dept", deviation: "+34%", reason: "Monsoon related pothole surge", severity: "high" },
  { dept: "Drainage", deviation: "+28%", reason: "Blockage reports up 3x", severity: "high" },
  { dept: "Electrical", deviation: "-15%", reason: "New grid maintenance schedule", severity: "low" },
];

const recommendations = [
  { icon: MapPin, text: "Deploy 3 additional crew to North Zone — complaint density increased 40%", impact: "high" },
  { icon: Zap, text: "Shift sanitation pickup in Ward 5 to morning — citizen satisfaction +12%", impact: "medium" },
  { icon: Target, text: "Reassign 2 officers from Traffic to Drainage — flooding season peak", impact: "high" },
  { icon: Lightbulb, text: "Proactive maintenance in Sector 7 — prevents 80% of expected failures", impact: "medium" },
];

const insights = [
  { label: "Next Peak Forecast", value: "Mid-Aug", change: "+18%", type: "up", color: "#f59e0b" },
  { label: "Dept Efficiency Avg", value: "72%", change: "+5%", type: "up", color: "#10b981" },
  { label: "Anomaly Detection", value: "3 alerts", change: "Active", type: "alert", color: "#ef4444" },
  { label: "Resolution Prediction", value: "91%", change: "+2.3%", type: "up", color: "#8b5cf6" },
];

export function IntelligenceTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/5 border border-violet-500/30">
          <BrainCircuit className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Intelligence Hub</h2>
          <p className="text-xs text-muted-foreground">Predictive analytics & smart recommendations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {insights.map((item, i) => {
          const colorMap: Record<string, string> = { up: "#10b981", down: "#ef4444", alert: "#f59e0b" };
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-[0.06]"
                style={{ background: `radial-gradient(circle, ${item.color}, transparent)` }} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{item.label}</span>
              <h3 className="text-2xl font-bold text-foreground">{item.value}</h3>
              <div className="flex items-center gap-1 mt-1">
                {item.type === 'alert' ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                    <AlertTriangle size={10} /> {item.change}
                  </span>
                ) : (
                  <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${item.type === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.type === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {item.change}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" /> Complaint Volume Forecast
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded">AI Model v2.4</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="month" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#000000cc', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#predGrad)" strokeDasharray="6 3" dot={false} name="Predicted" />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} fillOpacity={0} dot={{ r: 3, fill: "#10b981", strokeWidth: 2, stroke: "#000" }} name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Anomaly Detection
          </h4>
          <div className="space-y-3">
            {anomalies.map((a, i) => (
              <motion.div
                key={a.dept}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{a.dept}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    a.severity === 'high' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                  }`}>{a.deviation}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{a.reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h4 className="text-sm font-bold text-foreground">AI-Powered Recommendations</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:bg-violet-500/5 hover:border-violet-500/20 transition-all cursor-default group"
                >
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 shrink-0 group-hover:scale-110 transition-transform">
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{rec.text}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                    rec.impact === 'high' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                  }`}>{rec.impact}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
