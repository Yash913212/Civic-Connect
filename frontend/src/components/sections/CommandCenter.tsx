"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

const allAlerts = [
  { type: "Water Leakage", loc: "Sector 4", time: "2m ago", severity: "high" as const },
  { type: "Road Damage", loc: "Highway 9", time: "15m ago", severity: "medium" as const },
  { type: "Garbage Overflow", loc: "Downtown", time: "1h ago", severity: "low" as const },
  { type: "Streetlight Out", loc: "Avenue 5", time: "2h ago", severity: "low" as const },
  { type: "Sewage Blockage", loc: "Zone 7", time: "3h ago", severity: "high" as const },
  { type: "Broken Footpath", loc: "Market Rd", time: "4h ago", severity: "medium" as const },
  { type: "Graffiti Vandalism", loc: "Park Ave", time: "5h ago", severity: "low" as const },
  { type: "Power Line Down", loc: "Industrial Area", time: "6h ago", severity: "high" as const },
];

const barData = [
  { label: "Mon", value: 40 },
  { label: "Tue", value: 60 },
  { label: "Wed", value: 45 },
  { label: "Thu", value: 80 },
  { label: "Fri", value: 55 },
  { label: "Sat", value: 90 },
  { label: "Sun", value: 30 },
];

const severityColor = {
  high: "bg-destructive",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export default function CommandCenter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [alertIndex, setAlertIndex] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % allAlerts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isInView]);

  const visibleAlerts = isInView
    ? [
        allAlerts[alertIndex % allAlerts.length],
        allAlerts[(alertIndex + 1) % allAlerts.length],
        allAlerts[(alertIndex + 2) % allAlerts.length],
        allAlerts[(alertIndex + 3) % allAlerts.length],
      ]
    : allAlerts.slice(0, 4);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section ref={sectionRef} className="py-24 md:py-32 w-full max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="text-2xl sm:text-4xl md:text-6xl font-heading font-bold mb-6">Municipal Command Center</h2>
        <p className="text-lg md:text-xl text-muted-foreground">Real-time city-wide incident monitoring and analytics.</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6"
      >
        {[
          { title: "Total Complaints", value: "52,492", icon: Activity, color: "text-blue-500" },
          { title: "Resolved Cases", value: "48,102", icon: CheckCircle, color: "text-green-500" },
          { title: "Active Issues", value: "3,150", icon: Clock, color: "text-yellow-500" },
          { title: "Critical Alerts", value: "240", icon: AlertTriangle, color: "text-destructive" },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-black/60 transition-all duration-300 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm text-muted-foreground font-medium">{stat.title}</div>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[400px]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-1 md:col-span-2 bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col h-auto md:h-full min-h-[300px] md:min-h-0 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Resolution Times</h3>
            <span className="text-[10px] text-muted-foreground font-mono">This Week</span>
          </div>
          <div className="flex-1 border-t border-b border-black/5 dark:border-white/10 relative flex items-end pb-4 gap-4 min-h-[160px] pt-6">
            {barData.map((bar, i) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${bar.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                  className="w-full bg-gradient-to-t from-primary/30 to-primary/60 hover:from-primary/50 hover:to-primary rounded-t-sm transition-all duration-300 relative group cursor-pointer"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.value}h
                  </div>
                </motion.div>
                <span className="text-[9px] text-muted-foreground/60 font-mono">{bar.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-1 bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col h-auto md:h-full min-h-[350px] md:min-h-0 overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Live Alert Feed</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-[9px] text-muted-foreground font-mono">LIVE</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px] md:max-h-none">
            <AnimatePresence mode="popLayout">
              {visibleAlerts.map((alert, i) => (
                <motion.div
                  key={alert.type + i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  layout
                  className="flex items-center gap-3 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/5 hover:bg-black/60 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${severityColor[alert.severity]} ${alert.severity === "high" ? "animate-pulse" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{alert.type}</div>
                    <div className="text-xs text-muted-foreground truncate">{alert.loc}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex-shrink-0">{alert.time}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Zap className="w-3 h-3 text-destructive" />
            Auto-refreshing every 3s
          </div>
        </motion.div>
      </div>
    </section>
  );
}
