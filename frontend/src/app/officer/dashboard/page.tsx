"use client";

import { withRoleGuard } from "@/middleware/roleGuard";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  ClipboardList, Map, Award, Clock,
  CheckCircle, Camera, Search, Filter, MessageSquare,
  LogOut, Bell, AlertTriangle, Building2, ChevronDown, RefreshCw,
  Truck, CalendarDays, Send, PackagePlus, Clock4, User,
  ChevronLeft, Menu, Shield, Sparkles, FileText, TrendingUp,
  Zap, Users, ArrowUpRight, ArrowDownRight, Activity, MapPin,
  ChevronRight, PhoneCall, BarChart3, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { showTextLoading, showSystemStatus, showUploadProgress } from "@/components/ui/CustomToasts";
import { complaintService, type ComplaintData } from "@/services/complaintService";
import { PriorityBadge } from "@/components/dashboard/PriorityBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Shimmer } from "@/components/dashboard/Shimmer";
import dynamic from "next/dynamic";
import { PerformanceTab } from "./PerformanceTab";
import { CommsHubTab } from "./CommsHubTab";
import { ResourcesTab } from "./ResourcesTab";
import { ScheduleTab } from "./ScheduleTab";
import { AnimatedBackground } from "./AnimatedBackground";

const OfficerMapView = dynamic(() => import("@/components/map/OfficerMapView"), { ssr: false });

const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

const sidebarItems = [
  { id: "tasks", icon: ClipboardList, label: "Active Assignments" },
  { id: "map", icon: Map, label: "Field Map" },
  { id: "performance", icon: Award, label: "My Performance" },
  { id: "comms", icon: MessageSquare, label: "Comms Hub" },
  { id: "resources", icon: Truck, label: "Resource Requests" },
  { id: "schedule", icon: CalendarDays, label: "Shift Schedule" },
] as const;

type TabId = typeof sidebarItems[number]['id'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 18 } },
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.97 }),
};

function StaggerGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={containerVariants} initial="hidden" animate="show" className={className}>{children}</motion.div>;
}

function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={itemVariants} className={className}>{children}</motion.div>;
}

function StatusDropdown({ current, onChange, disabled }: { current: string; onChange: (s: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
        } bg-white/5 border-white/10`}>
        <StatusBadge status={current} />
        {!disabled && <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={12} className="text-white/40" /></motion.div>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-1 z-20 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px] overflow-hidden">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors ${
                  s === current ? 'text-emerald-400' : 'text-white/70'
                }`}>
                {s}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifications = useMemo(() => [
    { id: 1, title: "New Complaint Assigned", desc: "C-8846: Traffic signal at junction", time: "2 min ago", type: "info" },
    { id: 2, title: "Complaint Resolved", desc: "C-8842: Water pipe burst fixed", time: "15 min ago", type: "success" },
    { id: 3, title: "Dispatch Alert", desc: "Backup requested at Main St.", time: "1 hour ago", type: "urgent" },
    { id: 4, title: "Shift Reminder", desc: "Night shift starts at 8PM", time: "2 hours ago", type: "assignment" },
  ], []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute right-0 top-12 z-40 w-80 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Notifications</h4>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">{notifications.length}</span>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n, i) => (
                <div key={n.id} className="flex items-start gap-3 p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className={`p-1.5 rounded-lg ${
                    n.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                    n.type === 'urgent' ? 'bg-rose-500/15 text-rose-400' :
                    n.type === 'assignment' ? 'bg-blue-500/15 text-blue-400' : 'bg-white/10 text-white/60'
                  }`}>
                    {n.type === 'success' ? <CheckCircle size={14} /> :
                     n.type === 'urgent' ? <AlertTriangle size={14} /> :
                     n.type === 'assignment' ? <Users size={14} /> : <Bell size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                    <p className="text-[10px] text-white/50 truncate">{n.desc}</p>
                  </div>
                  <span className="text-[10px] text-white/30 shrink-0">{n.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function OfficerDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("tasks");
  const [tabDirection, setTabDirection] = useState(1);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { const user = JSON.parse(userStr); setCurrentUserId(user.id); } catch {}
    }
  }, []);

  const loadComplaints = useCallback(() => {
    setLoading(true);
    complaintService.getAll()
      .then(data => { setComplaints(data); setLoading(false); })
      .catch(() => { setLoading(false); toast.error("Failed to load complaints"); });
  }, []);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  const selectedComplaint = selectedTask ? complaints.find(c => c.id === selectedTask) : null;

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      await complaintService.updateStatus(complaintId, newStatus);
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
      toast.success(`Status changed to "${newStatus}"`);
      if (newStatus === "Resolved") confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token');
    localStorage.removeItem('user'); sessionStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    window.location.href = "/";
  };

  const handleTabChange = (tab: TabId) => {
    const prevIdx = sidebarItems.findIndex(t => t.id === activeTab);
    const nextIdx = sidebarItems.findIndex(t => t.id === tab);
    setTabDirection(nextIdx >= prevIdx ? 1 : -1);
    setActiveTab(tab);
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dept.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (myTasksOnly && currentUserId) return c.assigned_to === currentUserId;
    return true;
  });

  const activeCount = complaints.filter(c => c.status !== "Resolved").length;
  const myTaskCount = complaints.filter(c => c.assigned_to === currentUserId).length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const criticalCount = complaints.filter(c => c.priority === "Critical").length;

  return (
    <div className="min-h-screen text-white selection:bg-emerald-500/30">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-white/[0.06] bg-[#080a0a]/80 backdrop-blur-2xl">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="text-sm font-bold text-white font-heading">Civic Connect</span>
                <span className="text-[10px] text-emerald-400/80 ml-2 font-mono hidden sm:inline">Officer Console</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Clock size={12} className="text-white/40" />
              <span className="text-[11px] font-mono text-white/50">{liveTime.toLocaleTimeString('en-IN')}</span>
            </div>
            <button onClick={() => loadComplaints()}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-white/70">
              <RefreshCw className="w-3.5 h-3.5" /> Sync
            </button>
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              </button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-semibold">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <aside className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] transition-all duration-300 border-r border-white/[0.06] bg-[#080a0a]/60 backdrop-blur-2xl ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className="flex flex-col h-full py-4 px-2 overflow-y-auto">
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const count = item.id === 'tasks' ? activeCount : undefined;
              return (
                <button key={item.id} onClick={() => handleTabChange(item.id as TabId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'
                  }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                  {sidebarOpen && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {count !== undefined && <span className="ml-auto text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">{count}</span>}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className={`pt-20 pb-12 transition-all duration-300 relative z-10 min-h-screen ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
        <div className="px-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait" custom={tabDirection}>
            {activeTab === "tasks" && (
              <motion.div key="tasks" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white font-heading">Task Management</h2>
                    <p className="text-sm text-white/40 mt-0.5">{filteredComplaints.length} tasks · {myTaskCount} assigned to you</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-all w-48" />
                    </div>
                    <button onClick={() => setMyTasksOnly(!myTasksOnly)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        myTasksOnly ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}>
                      <ClipboardList size={16} /> My Tasks ({myTaskCount})
                    </button>
                    <button onClick={loadComplaints}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StaggerItem><StatCard icon={ClipboardList} label="Active Cases" value={activeCount} color="#f59e0b" /></StaggerItem>
                  <StaggerItem><StatCard icon={User} label="My Tasks" value={myTaskCount} color="#06b6d4" /></StaggerItem>
                  <StaggerItem><StatCard icon={CheckCircle} label="Resolved" value={resolvedCount} trend="+8%" color="#10b981" /></StaggerItem>
                  <StaggerItem><StatCard icon={AlertTriangle} label="Critical" value={criticalCount} color="#ef4444" /></StaggerItem>
                </StaggerGrid>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                    {loading && filteredComplaints.length === 0 && (
                      <div className="space-y-3">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06]">
                            <Shimmer className="w-1/3 h-3 mb-3" /><Shimmer className="w-2/3 h-4 mb-2" /><Shimmer className="w-1/2 h-3" />
                          </div>
                        ))}
                      </div>
                    )}
                    {!loading && filteredComplaints.length === 0 && (
                      <div className="p-8 text-center text-white/40 text-sm">{searchQuery ? "No results." : "No complaints yet."}</div>
                    )}
                    {filteredComplaints.map((c, i) => (
                      <div key={c.id} onClick={() => setSelectedTask(c.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedTask === c.id
                            ? 'bg-emerald-500/10 border-emerald-500/50'
                            : 'bg-black/40 backdrop-blur-xl border-white/[0.06] hover:border-white/[0.12]'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-emerald-400/80">#{c.id.substring(0, 8)}</span>
                          <PriorityBadge priority={c.priority} />
                        </div>
                        <h4 className="font-bold text-white text-sm mb-2">{c.title}</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/50 flex items-center gap-1"><Building2 size={10} /> {c.dept}</span>
                          <span className="flex items-center gap-1">
                            {c.assigned_name && <span className="text-[10px] text-emerald-400 mr-1">({c.assigned_name})</span>}
                            <StatusBadge status={c.status} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <GlassCard className="h-full flex flex-col">
                    {selectedComplaint ? (
                      <>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">{selectedComplaint.title}</h3>
                            <span className="text-xs font-mono text-emerald-400/80">ID: #{selectedComplaint.id.substring(0, 8)}</span>
                          </div>
                          <StatusDropdown current={selectedComplaint.status} onChange={(s) => handleStatusChange(selectedComplaint.id, s)} />
                        </div>

                        <div className="space-y-6 flex-grow">
                          <div>
                            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Description</h4>
                            <div className="flex gap-4 items-start">
                              <p className="text-sm text-white/70 leading-relaxed flex-1">{selectedComplaint.description}</p>
                              {selectedComplaint.image_url && (
                                <img 
                                  src={selectedComplaint.image_url} 
                                  alt="Complaint Image" 
                                  className="w-20 h-20 object-cover rounded-lg border border-white/10 shrink-0"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-[10px] font-bold text-white/50 mb-1">Department</h4>
                              <p className="text-sm font-semibold text-emerald-400">{selectedComplaint.dept}</p>
                            </div>
                            <div>
                              <h4 className="text-[10px] font-bold text-white/50 mb-1">Priority</h4>
                              <PriorityBadge priority={selectedComplaint.priority} />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold text-white/50 mb-2">Location</h4>
                            <p className="text-sm text-white/70">{selectedComplaint.address || selectedComplaint.location}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold text-white/50 mb-3">Field Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => showUploadProgress()}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                                <Camera size={22} className="text-emerald-400" />
                                <span className="text-xs font-semibold text-white">Upload Evidence</span>
                              </button>
                              <button onClick={() => toast.success("Notes saved to case file.")}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                                <MessageSquare size={22} className="text-emerald-400" />
                                <span className="text-xs font-semibold text-white">Add Notes</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 mt-6">
                          <h4 className="text-[10px] font-bold text-white/50 mb-3">Quick Status</h4>
                          <div className="flex flex-wrap gap-2">
                            {["Assigned", "In Progress", "Resolved"].map(s => (
                              <button key={s} disabled={selectedComplaint.status === s}
                                onClick={() => handleStatusChange(selectedComplaint.id, s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  selectedComplaint.status === s ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'
                                } ${
                                  s === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                  s === 'In Progress' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                  'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}>
                                {s === 'Resolved' && <CheckCircle size={12} className="inline mr-1" />}
                                {s === 'In Progress' && <Activity size={12} className="inline mr-1" />}
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <ClipboardList className="w-20 h-20 mb-4 text-white/20" />
                        <p className="text-sm font-semibold text-white/60">Select a complaint to view details.</p>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {activeTab === "map" && (
              <motion.div key="map" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit"
                className="space-y-5 h-[600px] flex flex-col">
                <div>
                  <h2 className="text-xl font-bold text-white font-heading">Field Operations Map</h2>
                  <p className="text-sm text-white/40 mt-0.5">Real-time geospatial view of all complaints</p>
                </div>
                <div className="flex-grow rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
                  <OfficerMapView />
                </div>
              </motion.div>
            )}

            {activeTab === "performance" && <PerformanceTab complaints={complaints} loading={loading} />}
            {activeTab === "comms" && <CommsHubTab />}
            {activeTab === "resources" && <ResourcesTab />}
            {activeTab === "schedule" && <ScheduleTab />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default withRoleGuard(OfficerDashboard, ['OFFICER', 'ADMIN']);
