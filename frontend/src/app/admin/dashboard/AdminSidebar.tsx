"use client";

import { motion } from "framer-motion";
import {
  Activity, FolderOpen, Building2, Users, ShieldAlert, Radio,
  Wallet, Settings, Map, FileText, BrainCircuit, Gauge, Clock
} from "lucide-react";

interface TabDef {
  id: string;
  icon: any;
  label: string;
  badge?: number | string;
  group: string;
}

const tabs: TabDef[] = [
  { id: "overview", icon: Activity, label: "Overview", group: "MONITORING" },
  { id: "health", icon: Gauge, label: "System Health", group: "MONITORING" },
  { id: "intelligence", icon: BrainCircuit, label: "AI Intelligence", group: "MONITORING" },
  { id: "sla", icon: Clock, label: "SLA Compliance", group: "MONITORING" },
  { id: "complaints", icon: FolderOpen, label: "Assignment Center", group: "OPERATIONS", badge: 0 },
  { id: "departments", icon: Building2, label: "Departments", group: "OPERATIONS" },
  { id: "users", icon: Users, label: "Users", group: "OPERATIONS" },
  { id: "broadcast", icon: Radio, label: "Broadcast", group: "OPERATIONS" },
  { id: "audit", icon: ShieldAlert, label: "Audit & Security", group: "GOVERNANCE" },
  { id: "budget", icon: Wallet, label: "Budget", group: "GOVERNANCE" },
  { id: "map", icon: Map, label: "GIS Analytics", group: "GOVERNANCE" },
  { id: "reports", icon: FileText, label: "Reports", group: "GOVERNANCE" },
  { id: "settings", icon: Settings, label: "Settings", group: "SYSTEM" },
];

export function AdminSidebar({
  activeTab, onTabChange, complaintCount,
}: {
  activeTab: string; onTabChange: (id: string) => void; complaintCount: number;
}) {
  const groups = [...new Set(tabs.map(t => t.group))];

  return (
    <nav className="space-y-6">
      {groups.map(group => (
        <div key={group}>
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 dark:text-white/30 px-4 pb-2 uppercase">
            {group}
          </div>
          <div className="space-y-1">
            {tabs.filter(t => t.group === group).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const actualBadge = tab.id === "complaints" ? complaintCount : tab.badge;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:bg-teal-500/10 dark:border-teal-500/30 dark:text-teal-400 shadow-[0_4px_20px_rgba(16,185,129,0.1)]"
                      : "border-transparent text-slate-500 dark:text-white/50 hover:bg-white/60 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white/80"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="adminNavPill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-500 dark:bg-teal-400"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 shrink-0 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                  {actualBadge !== undefined && (
                    <span className="ml-auto text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-bold relative z-10">
                      {actualBadge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
