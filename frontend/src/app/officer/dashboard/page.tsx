"use client";

import { withRoleGuard } from "@/middleware/roleGuard";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Map, Award, Clock,
  CheckCircle, Camera, Search, Filter, MessageSquare,
  LogOut, Bell, AlertTriangle, Building2, ChevronDown, RefreshCw,
  Truck, CalendarDays, CloudOff, Send, PackagePlus, Clock4, User,
  Menu, X, Sun, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { useRouter } from "next/navigation";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";
import { ThemeToggle } from "@/components/ThemeToggle";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { showUploadProgress, showTextLoading, showResolution, showAdminAlert } from "@/components/ui/CustomToasts";
import { complaintService, type ComplaintData } from "@/services/complaintService";
import { PerformanceTab } from "./PerformanceTab";
import { OfficerSidebar } from "./OfficerSidebar";
import { DailyBriefingTab } from "./DailyBriefingTab";

const OfficerMapView = dynamic(() => import("@/components/map/OfficerMapView"), { ssr: false });

const workloadData = [
  { name: 'Mon', tasks: 4 },
  { name: 'Tue', tasks: 7 },
  { name: 'Wed', tasks: 5 },
  { name: 'Thu', tasks: 8 },
  { name: 'Fri', tasks: 6 },
  { name: 'Sat', tasks: 2 },
  { name: 'Sun', tasks: 3 },
];

const performanceData = [
  { name: 'Week 1', resolved: 12, target: 10 },
  { name: 'Week 2', resolved: 15, target: 12 },
  { name: 'Week 3', resolved: 18, target: 15 },
  { name: 'Week 4', resolved: 22, target: 18 },
];

const STATUS_OPTIONS = ["Unassigned", "Assigned", "In Progress", "Escalated", "Resolved"];

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    High: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    Medium: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    Low: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Unassigned: "bg-slate-500/15 border-slate-500/30 text-slate-400",
    Assigned: "bg-teal-500/15 border-teal-500/30 text-teal-400",
    "In Progress": "bg-amber-500/15 border-amber-500/30 text-amber-400",
    Escalated: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    Resolved: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.Unassigned}`}>
      {status}
    </span>
  );
}

function StatusDropdown({ current, onChange, disabled }: { current: string; onChange: (s: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer'
        } bg-white dark:bg-white/5 border-black/10 dark:border-white/10`}>
        <StatusBadge status={current} />
        {!disabled && <ChevronDown size={12} />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-lg py-1 min-w-[140px]">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                  s === current ? 'text-primary' : 'text-foreground'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OfficerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("briefing");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      } catch {}
    }
  }, []);

  const loadComplaints = () => {
    setLoading(true);
    complaintService.getAll()
      .then(data => {
        setComplaints(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error("Failed to load complaints");
      });
  };

  useEffect(() => { loadComplaints(); }, []);

  const selectedComplaint = selectedTask
    ? complaints.find(c => c.id === selectedTask)
    : null;

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      await complaintService.updateStatus(complaintId, newStatus);
      setComplaints(prev => prev.map(c =>
        c.id === complaintId ? { ...c, status: newStatus } : c
      ));
      toast.success(`Status changed to "${newStatus}"`);
      if (newStatus === "Resolved") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/");
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (myTasksOnly && currentUserId) {
      return c.assigned_to === currentUserId;
    }
    return true;
  });

  const activeCount = complaints.filter(c => c.status !== "Resolved").length;
  const myTaskCount = complaints.filter(c => c.assigned_to === currentUserId).length;

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
  };

  return (
    <main className="bg-transparent text-slate-900 dark:text-white min-h-screen pt-16 pb-10 relative overflow-hidden flex flex-col selection:bg-emerald-500/20 dark:selection:bg-white/20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-transparent"
          colors={[[34, 197, 94]]}
          dotSize={6}
          reverse={false}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,_transparent_100%)] opacity-20" />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px]" />
      </div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[150px] left-[-10%] top-[20%] pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-emerald-500/10 blur-[150px] right-[5%] bottom-[-10%] pointer-events-none z-0" />

      <div className="w-full relative z-10 flex-1 flex flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-black/10 dark:border-white/10 pb-6 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-emerald-600 dark:text-teal-500 mb-1 block">
                Field Command
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                Officer <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Portal</span>
              </h1>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto">
            <ThemeToggle />
            <button
              onClick={() => {
                if(isOffline) {
                  toast.success(`Syncing ${pendingSync} pending items...`);
                  setPendingSync(0);
                  setIsOffline(false);
                } else {
                  setIsOffline(true);
                  setPendingSync(3);
                  toast.error("Connection lost. Working offline.");
                }
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-white shadow-sm border border-black/10 dark:bg-white/5 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap ${isOffline ? 'text-amber-500' : 'text-slate-600 dark:text-white/80'}`}>
              {isOffline ? <><CloudOff className="w-4 h-4" /> {pendingSync} Pending</> : <><RefreshCw className="w-4 h-4" /> Online</>}
            </button>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white shadow-sm border border-black/10 dark:bg-white/5 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap relative">
              <Bell className="w-4 h-4 text-emerald-600 dark:text-teal-400" />
              Alerts
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">2</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              End Shift
            </button>
          </div>
        </div>

        <div className="flex gap-0 flex-1">
          {/* Sidebar - Mobile Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          {/* Sidebar – desktop: fixed-width, mobile: slide-in drawer */}
          <motion.aside
            className={`shrink-0 lg:w-64 xl:w-72 lg:relative fixed top-0 left-0 h-full z-50 w-72
              bg-white/95 dark:bg-black/95 backdrop-blur-2xl
              border-r border-black/10 dark:border-white/10
              lg:bg-white/5 lg:dark:bg-white/[0.02] lg:backdrop-blur-none
              p-4 lg:p-0 lg:pr-4 lg:pt-2
              lg:translate-x-0 transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <div className="flex items-center justify-between lg:hidden mb-6 pb-4 border-b border-black/10 dark:border-white/10">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-emerald-600 dark:text-teal-500">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            <OfficerSidebar
              activeTab={activeTab}
              onTabChange={(id) => { setActiveTab(id); setSidebarOpen(false); }}
              activeCount={activeCount}
              myTaskCount={myTaskCount}
            />
          </motion.aside>

          {/* Main Content – takes all remaining width */}
          <div className="flex-1 min-w-0 min-h-[600px] pl-0 lg:pl-6">
            <AnimatePresence mode="wait">
              {activeTab === "briefing" && (
                <DailyBriefingTab myTaskCount={myTaskCount} activeCount={activeCount} />
              )}

              {activeTab === "tasks" && (
                <motion.div key="tasks" {...pageVariants} className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-foreground">
                      Task Management
                      {loading && <span className="ml-2 inline-block w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin align-middle" />}
                    </h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all w-40 sm:w-48" />
                      </div>
                      <button onClick={() => setMyTasksOnly(!myTasksOnly)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap ${
                          myTasksOnly
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-teal-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                            : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/10'
                        }`}>
                        <ClipboardList size={16} /> Mine ({myTaskCount})
                      </button>
                      <button onClick={loadComplaints} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Task List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                      {filteredComplaints.length === 0 && !loading && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          {searchQuery ? "No complaints match your search." : "No complaints in the system yet."}
                        </div>
                      )}
                      {filteredComplaints.map((c) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setSelectedTask(c.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedTask === c.id
                              ? 'bg-emerald-50 dark:bg-teal-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                              : 'bg-white/70 dark:bg-black/40 backdrop-blur-xl border-black/10 dark:border-white/10 hover:border-emerald-500/30 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-mono text-emerald-600 dark:text-teal-400 font-semibold">#{c.id.substring(0, 8)}</span>
                            <PriorityBadge priority={c.priority} />
                          </div>
                          <h4 className="font-bold text-foreground text-sm mb-2">{c.title}</h4>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Building2 size={10} /> {c.dept}
                            </span>
                            <span className="flex items-center gap-2">
                              {c.assigned_name && (
                                <span className="text-[10px] text-emerald-500 dark:text-teal-400">({c.assigned_name})</span>
                              )}
                              <StatusBadge status={c.status} />
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Task Details Panel */}
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 h-full flex flex-col">
                      {selectedComplaint ? (
                        <>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-lg font-bold text-foreground mb-1">{selectedComplaint.title}</h3>
                              <span className="text-xs font-mono text-emerald-600 dark:text-teal-400">ID: #{selectedComplaint.id.substring(0, 8)}</span>
                            </div>
                            <StatusDropdown
                              current={selectedComplaint.status}
                              onChange={(s) => handleStatusChange(selectedComplaint.id, s)}
                            />
                          </div>

                          <div className="space-y-6 flex-grow">
                            <div>
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                              <p className="text-sm text-foreground/80 leading-relaxed">{selectedComplaint.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Department</h4>
                                <p className="text-sm font-semibold text-emerald-600 dark:text-teal-400">{selectedComplaint.dept}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Priority</h4>
                                <PriorityBadge priority={selectedComplaint.priority} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Location</h4>
                              <p className="text-sm text-foreground/80">{selectedComplaint.address || selectedComplaint.location}</p>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Field Actions</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => showUploadProgress()}
                                  className="flex flex-col items-center justify-center gap-2 p-3 bg-white/50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl transition-all group"
                                >
                                  <Camera size={20} className="text-emerald-500 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                                  <span className="text-xs font-semibold text-foreground">Upload Evidence</span>
                                </button>
                                <button
                                  onClick={() => toast.success("Notes saved to case file.")}
                                  className="flex flex-col items-center justify-center gap-2 p-3 bg-white/50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl transition-all group"
                                >
                                  <MessageSquare size={20} className="text-emerald-500 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                                  <span className="text-xs font-semibold text-foreground">Add Notes</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-black/10 dark:border-white/10 mt-6">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Status Actions</h4>
                            <div className="flex flex-wrap gap-2">
                              {["Assigned", "In Progress", "Resolved", "Escalated"].map(s => (
                                <button
                                  key={s}
                                  disabled={selectedComplaint.status === s}
                                  onClick={() => handleStatusChange(selectedComplaint.id, s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    selectedComplaint.status === s
                                      ? 'opacity-30 cursor-not-allowed'
                                      : 'hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                                  } ${
                                    s === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                                    s === 'In Progress' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                                    s === 'Escalated' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' :
                                    'bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30'
                                  }`}>
                                  {s === 'Resolved' && <CheckCircle size={12} className="inline mr-1" />}
                                  {s === 'Escalated' && <AlertTriangle size={12} className="inline mr-1" />}
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                          <ClipboardList className="w-16 h-16 mb-4 text-muted-foreground" />
                          <p className="text-sm font-semibold text-muted-foreground">Select a complaint from the list<br/>to view details and take action.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "map" && (
                <motion.div key="map" {...pageVariants} className="flex flex-col" style={{ height: "calc(100vh - 14rem)" }}>
                  {/* Header row */}
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Field Operations Map</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Live complaint locations — auto-refreshes every 30s</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Live Feed
                    </div>
                  </div>
                  {/* Map fills all remaining height */}
                  <div className="flex-1 min-h-0">
                    <OfficerMapView />
                  </div>
                </motion.div>
              )}

              {activeTab === "performance" && (
                <PerformanceTab complaints={complaints} loading={loading} />
              )}

              {/* COMMS HUB */}
              {activeTab === "comms" && (
                <motion.div key="comms" {...pageVariants} className="space-y-6 flex flex-col h-[600px]">
                  <h3 className="text-xl font-bold text-foreground mb-2">Comms Hub</h3>
                  <div className="flex-1 flex flex-col md:flex-row gap-4 bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 overflow-hidden">
                    <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 pb-4 md:pb-0 md:pr-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-teal-500/10 border border-emerald-500/30 cursor-pointer shrink-0 md:shrink">
                        <h4 className="font-bold text-sm text-foreground">Admin Control</h4>
                        <p className="text-xs text-muted-foreground truncate">I need backup at Main St.</p>
                      </div>
                      <div className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent cursor-pointer transition-colors shrink-0 md:shrink">
                        <h4 className="font-bold text-sm text-foreground">Citizen (C-8840)</h4>
                        <p className="text-xs text-muted-foreground truncate">Can you provide the gate code?</p>
                      </div>
                    </div>
                    <div className="md:w-2/3 flex flex-col flex-1">
                      <div className="flex-1 overflow-y-auto space-y-4 p-4">
                        <div className="flex flex-col gap-1 items-end">
                          <div className="px-4 py-2 bg-emerald-500 text-white rounded-2xl rounded-tr-sm text-sm max-w-[80%]">I am on site at Main St. We need a tow truck.</div>
                          <span className="text-[10px] text-muted-foreground">10:42 AM</span>
                        </div>
                        <div className="flex flex-col gap-1 items-start">
                          <div className="px-4 py-2 bg-white/50 dark:bg-white/10 text-foreground rounded-2xl rounded-tl-sm text-sm max-w-[80%]">Copy that. Dispatching a tow truck now. ETA 15 mins.</div>
                          <span className="text-[10px] text-muted-foreground">10:44 AM</span>
                        </div>
                      </div>
                      <div className="mt-auto relative">
                        <input type="text" placeholder="Type a message..." className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500/50" />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-400 transition-colors">
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* RESOURCE REQUESTS */}
              {activeTab === "resources" && (
                <motion.div key="resources" {...pageVariants} className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-foreground">Resource & Equipment Requests</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                      <PackagePlus size={16} /> New Request
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 flex flex-col justify-between hover:shadow-lg transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-foreground">Tow Truck</h4>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold uppercase">Pending</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Requested for complaint C-8840 to remove abandoned vehicle blocking drainage work.</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> Requested 2 hours ago</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 flex flex-col justify-between hover:shadow-lg transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-foreground">Excavator (Mini)</h4>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-bold uppercase">Approved</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Required for pipe replacement at 5th Ave.</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle size={12} /> Approved 1 day ago</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SHIFT SCHEDULE */}
              {activeTab === "schedule" && (
                <motion.div key="schedule" {...pageVariants} className="space-y-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Shift Management</h3>
                  <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-black/5 dark:border-white/5 flex-col sm:flex-row gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <Clock4 size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-lg">Current Shift</h4>
                          <p className="text-sm text-muted-foreground">08:00 AM - 04:00 PM (Active)</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-foreground rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all">
                        Log Break
                      </button>
                    </div>

                    <h4 className="font-bold text-foreground mb-4">Upcoming Shifts</h4>
                    <div className="space-y-3">
                      {[
                        { day: "Tomorrow", time: "08:00 AM - 04:00 PM", role: "Primary Response" },
                        { day: "Thursday", time: "12:00 PM - 08:00 PM", role: "Evening Patrol" },
                        { day: "Friday", time: "Off Duty", role: "Rest Day" },
                      ].map((shift, i) => (
                        <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-black/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <div>
                            <p className="font-bold text-foreground">{shift.day}</p>
                            <p className="text-sm text-muted-foreground">{shift.time}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${shift.time === 'Off Duty' ? 'bg-slate-200 dark:bg-white/10 text-muted-foreground' : 'bg-emerald-500/10 text-emerald-600 dark:text-teal-400'}`}>
                            {shift.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

export default withRoleGuard(OfficerDashboard, ['OFFICER', 'ADMIN']);
