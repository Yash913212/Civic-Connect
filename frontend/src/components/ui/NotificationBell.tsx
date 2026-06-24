"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCircle2, AlertTriangle, Info, Clock, Search as SearchIcon, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type NotificationType = "system" | "complaint" | "assignment" | "resolution" | "security" | "analytics";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "System Updates",
      message: "CivicConnect v2.0 deployed successfully.",
      type: "system",
      read: false,
      timestamp: "10m ago",
    },
    {
      id: "2",
      title: "Security Alert",
      message: "New login from unknown device detected.",
      type: "security",
      read: false,
      timestamp: "1h ago",
    },
    {
      id: "3",
      title: "Complaint Updates",
      message: "Pothole on Main St. has been resolved.",
      type: "resolution",
      read: true,
      timestamp: "2h ago",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter = filter === "all" || n.type === filter;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "system": return <Info className="text-blue-400 w-4 h-4" />;
      case "complaint": return <Clock className="text-yellow-400 w-4 h-4" />;
      case "assignment": return <AlertTriangle className="text-purple-400 w-4 h-4" />;
      case "resolution": return <CheckCircle2 className="text-green-400 w-4 h-4" />;
      case "security": return <AlertTriangle className="text-red-400 w-4 h-4" />;
      case "analytics": return <Info className="text-cyan-400 w-4 h-4" />;
      default: return <Info className="text-gray-400 w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-[#0a0a0a]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            ></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-black/40">
                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-sky-600 dark:text-primary hover:text-sky-700 dark:hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="p-3 border-b border-black/5 dark:border-white/10 bg-slate-100/50 dark:bg-black/20">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-sky-500/50 dark:focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2 p-3 overflow-x-auto border-b border-black/5 dark:border-white/10 no-scrollbar">
                {["all", "complaint", "analytics", "assignment", "resolution", "security", "system"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                      filter === f
                        ? "bg-sky-600 dark:bg-primary text-white"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-white/40 flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">🔔 No notifications available.</p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-black/5 dark:border-white/5 cursor-pointer transition-colors flex gap-4 ${
                        n.read ? "bg-transparent opacity-60" : "bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0 bg-slate-100 dark:bg-white/5 p-2 rounded-full">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-medium ${n.read ? "text-slate-600 dark:text-white/70" : "text-slate-900 dark:text-white"}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-white/40 whitespace-nowrap ml-2">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-sky-600 dark:bg-primary rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-black/5 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-center">
                 <button className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white flex items-center justify-center w-full gap-2 transition-colors font-bold">
                    <History className="w-3.5 h-3.5" /> View Notification History
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
