"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, AlertTriangle, Users, Building2, FileText } from "lucide-react";
import { useMemo } from "react";

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifications = useMemo(() => [
    { icon: CheckCircle, text: "C-8842 resolved by Officer Rahul", time: "2 min ago", color: "#10b981" },
    { icon: AlertTriangle, text: "Critical complaint from Zone 4", time: "15 min ago", color: "#ef4444" },
    { icon: Users, text: "Officer Priya assigned to C-8843", time: "32 min ago", color: "#06b6d4" },
    { icon: Building2, text: "New dept request pending", time: "1 hour ago", color: "#8b5cf6" },
    { icon: FileText, text: "Monthly report ready for review", time: "2 hours ago", color: "#f59e0b" },
  ], []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute right-0 top-full mt-2 w-80 z-50">
          <div className="relative bg-[#0a0e0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-bold text-white">Notifications</span>
              <span className="text-[10px] text-white/40 font-mono px-2 py-0.5 bg-white/[0.04] rounded-full">5 new</span>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
              {notifications.map((n, i) => {
                const Icon = n.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group">
                    <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] mt-0.5" style={{ color: n.color }}>
                      <Icon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 group-hover:text-white transition-colors truncate">{n.text}</p>
                      <span className="text-[10px] text-white/30">{n.time}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="p-2 border-t border-white/[0.06]">
              <button onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors">
                Mark all as read
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
