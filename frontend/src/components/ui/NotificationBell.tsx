"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCircle2, Info, Clock, Search as SearchIcon, History, UserPlus, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/services/api";

interface BackendNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  complaint_id: string | null;
  is_read: boolean;
  time: string;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getIcon(type: string) {
  switch (type) {
    case "status_update": return <Clock className="text-yellow-400 w-4 h-4" />;
    case "assignment": return <UserPlus className="text-purple-400 w-4 h-4" />;
    case "complaint_submitted": return <FileText className="text-emerald-400 w-4 h-4" />;
    case "complaint_resolved": return <CheckCircle2 className="text-green-400 w-4 h-4" />;
    default: return <Info className="text-gray-400 w-4 h-4" />;
  }
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = () => {
    apiRequest<BackendNotification[]>('/notifications')
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.filter((n: BackendNotification) => !n.is_read).length);
      })
      .catch(() => {});
  };

  const fetchUnreadCount = () => {
    apiRequest<{ count: number }>('/notifications/unread-count')
      .then(data => {
        if (data.count !== undefined) setUnreadCount(data.count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await apiRequest('/notifications/read-all', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center text-[9px] font-bold text-white px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-black/40">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs text-red-500 font-normal">({unreadCount} new)</span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead}
                    className="text-xs text-sky-600 dark:text-primary hover:text-sky-700 dark:hover:text-primary/80 transition-colors flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="p-3 border-b border-black/5 dark:border-white/10 bg-slate-100/50 dark:bg-black/20">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                  <input type="text" placeholder="Search notifications..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-sky-500/50 dark:focus:border-primary/50 transition-colors" />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-white/40 flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">No notifications yet.</p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div key={n.id} onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-black/5 dark:border-white/5 cursor-pointer transition-colors flex gap-4 ${
                        n.is_read ? "bg-transparent opacity-60" : "bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                      }`}>
                      <div className="mt-1 flex-shrink-0 bg-slate-100 dark:bg-white/5 p-2 rounded-full">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-medium ${n.is_read ? "text-slate-600 dark:text-white/70" : "text-slate-900 dark:text-white"}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-white/40 whitespace-nowrap ml-2">
                            {formatTime(n.time)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-sky-600 dark:bg-primary rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-black/5 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-center">
                <button onClick={() => { fetchNotifications(); fetchUnreadCount(); }}
                  className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white flex items-center justify-center w-full gap-2 transition-colors font-bold">
                  <History className="w-3.5 h-3.5" /> Refresh Notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
