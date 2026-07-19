"use client";

import { motion } from "framer-motion";
import {
  ClipboardList, Map, Award, MessageSquare, Truck, CalendarDays,
  Sun, Radio, Users
} from "lucide-react";

interface TabDef {
  id: string; icon: any; label: string; badge?: string | number;
}

export function OfficerSidebar({
  activeTab, onTabChange, activeCount, myTaskCount,
}: {
  activeTab: string; onTabChange: (id: string) => void;
  activeCount: number; myTaskCount: number;
}) {
  const tabs: TabDef[] = [
    { id: "tasks", icon: ClipboardList, label: "Assignments", badge: `${myTaskCount}` },
    { id: "briefing", icon: Sun, label: "Daily Briefing" },
    { id: "map", icon: Map, label: "Field Map" },
    { id: "performance", icon: Award, label: "Performance" },
    { id: "comms", icon: MessageSquare, label: "Comms Hub" },
    { id: "resources", icon: Truck, label: "Resources" },
    { id: "schedule", icon: CalendarDays, label: "Schedule" },
  ];

  return (
    <nav className="space-y-1">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
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
                layoutId="officerNavPill"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-500 dark:bg-teal-400"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon className="w-4 h-4 shrink-0 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
            {tab.badge && Number(tab.badge) > 0 && (
              <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-500 dark:text-teal-400 px-1.5 py-0.5 rounded-full font-bold relative z-10">
                {tab.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
