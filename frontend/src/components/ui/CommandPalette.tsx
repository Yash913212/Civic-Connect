"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Home,
  FileText,
  MapPin,
  User,
  Shield,
  BarChart3,
  Settings,
  HelpCircle,
  MessageSquare,
  Bell,
  Search,
  Activity,
  ClipboardList,
  Users,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Command;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const navigate = useCallback(
    (path: string) => {
      setIsOpen(false);
      setQuery("");
      router.push(path);
    },
    [router]
  );

  const commands: CommandItem[] = [
    { id: "home", label: "Home", description: "Go to home page", icon: Home, action: () => navigate("/") },
    { id: "file-complaint", label: "File Complaint", description: "Submit a new civic complaint", icon: FileText, action: () => navigate("/citizen/complaints") },
    { id: "complaints", label: "My Complaints", description: "View your complaint history", icon: ClipboardList, action: () => navigate("/citizen/complaints") },
    { id: "profile", label: "Profile", description: "View your profile", icon: User, action: () => navigate("/profile") },
    { id: "feedback", label: "Feedback", description: "Submit feedback", icon: MessageSquare, action: () => navigate("/feedback") },
    { id: "status-check", label: "Check Complaint Status", description: "Track a complaint by ID", icon: Search, action: () => navigate("/citizen/complaints") },
    { id: "map", label: "Complaint Map", description: "View complaints on map", icon: MapPin, action: () => navigate("/citizen/complaints") },
    { id: "officer-dashboard", label: "Officer Dashboard", description: "View officer dashboard", icon: Shield, action: () => navigate("/officer/dashboard") },
    { id: "admin-dashboard", label: "Admin Dashboard", description: "View admin dashboard", icon: BarChart3, action: () => navigate("/admin/dashboard") },
    { id: "admin-users", label: "User Management", description: "Manage platform users", icon: Users, action: () => navigate("/admin/dashboard") },
    { id: "admin-depts", label: "Department Management", description: "Manage departments", icon: Building2, action: () => navigate("/admin/dashboard") },
    { id: "settings", label: "Settings", description: "Account settings", icon: Settings, action: () => navigate("/profile") },
    { id: "help", label: "Help & Support", description: "Get help using the platform", icon: HelpCircle, action: () => navigate("/feedback") },
    { id: "analytics", label: "Analytics", description: "View platform analytics", icon: Activity, action: () => navigate("/admin/dashboard") },
    { id: "notifications", label: "Notifications", description: "View notifications", icon: Bell, action: () => { setIsOpen(false); setQuery(""); } },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
          onClick={() => { setIsOpen(false); setQuery(""); }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-[560px] mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-md">
                <Command className="w-3 h-3" />
                K
              </kbd>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No results for &quot;{query}&quot;
                </div>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      i === selectedIndex
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <cmd.icon className="w-4 h-4 shrink-0 opacity-70" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{cmd.label}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {cmd.description}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>Esc Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
