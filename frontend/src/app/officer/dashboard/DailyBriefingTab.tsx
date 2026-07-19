"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sun, MapPin, Clock, AlertTriangle,
  CheckCircle, Target, TrendingUp, Users, Bell, ClipboardList
} from "lucide-react";

export function DailyBriefingTab({ myTaskCount, activeCount }: { myTaskCount: number; activeCount: number }) {
  const [greeting, setGreeting] = useState("Good Morning");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const h = currentTime.getHours();
    if (h < 12) setGreeting("Good Morning");
    else if (h < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
    const i = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const tasksToday = [
    { id: "C-8839", title: "Pedda gunta road repair", priority: "Critical", zone: "North", eta: "2h" },
    { id: "C-8842", title: "Water pipe burst - Main St", priority: "Critical", zone: "Central", eta: "1h" },
    { id: "C-8845", title: "Open manhole inspection", priority: "High", zone: "South", eta: "3h" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{greeting}, Officer</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
          <Sun className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-foreground">32°C</p>
            <p className="text-[10px] text-muted-foreground">Sunny · Feels like 34°C</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 lg:col-span-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-emerald-500" /> Today&apos;s Priority Tasks
          </h4>
          <div className="space-y-3">
            {tasksToday.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group cursor-pointer"
              >
                <div className={`p-2.5 rounded-xl ${
                  task.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      task.priority === 'Critical' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                    }`}>{task.priority}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{task.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={10} /> Zone {task.zone}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> ETA: {task.eta}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1.5 text-[10px] font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                >
                  Start
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Stats</h4>
            <div className="space-y-4">
              {[
                { icon: ClipboardList, label: "Active Tasks", value: activeCount, color: "#f59e0b" },
                { icon: Users, label: "My Assignments", value: myTaskCount, color: "#10b981" },
                { icon: CheckCircle, label: "Completed Today", value: 3, color: "#06b6d4" },
                { icon: TrendingUp, label: "Efficiency", value: "94%", color: "#8b5cf6" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bell size={12} /> Area Alerts
            </h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                <span className="text-[11px] text-foreground">Flash flood warning — Zone North</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                <span className="text-[11px] text-foreground">Road closure — Main St & 5th Ave</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
