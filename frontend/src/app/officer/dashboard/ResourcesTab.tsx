"use client";

import { Truck, Shield, Zap, Clock, PackagePlus } from "lucide-react";
import { motion } from "framer-motion";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.97 }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 18 } },
};

function StaggerGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={containerVariants} initial="hidden" animate="show" className={className}>{children}</motion.div>;
}

function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={itemVariants} className={className}>{children}</motion.div>;
}

export function ResourcesTab() {
  return (
    <motion.div key="resources" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">Resource & Equipment</h2>
          <p className="text-sm text-white/40 mt-0.5">Request and track field equipment</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
          <PackagePlus size={16} /> New Request
        </button>
      </div>

      <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Tow Truck", status: "Pending", desc: "Requested for complaint C-8840", time: "2 hours ago", icon: Truck, color: "#f59e0b" },
          { title: "Excavator (Mini)", status: "Approved", desc: "Required for pipe replacement at 5th Ave.", time: "Approved 1 day ago", icon: Truck, color: "#10b981" },
          { title: "Safety Barricades", status: "Delivered", desc: "For road work at junction 12.", time: "Delivered 3 hours ago", icon: Shield, color: "#06b6d4" },
          { title: "Portable Generator", status: "Pending", desc: "Backup power for night operation at Sector 7.", time: "Requested 30 mins ago", icon: Zap, color: "#f59e0b" },
        ].map((r, i) => {
          const Icon = r.icon;
          const statusColor = r.status === "Approved" || r.status === "Delivered" ? "text-emerald-400 bg-emerald-500/15" : "text-amber-400 bg-amber-500/15";
          return (
            <StaggerItem key={i}>
              <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.12] transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]" style={{ color: r.color }}>
                    <Icon size={20} />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>{r.status}</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-2">{r.title}</h4>
                <p className="text-xs text-white/50 mb-4 leading-relaxed">{r.desc}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                  <Clock size={10} /> {r.time}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGrid>
    </motion.div>
  );
}
