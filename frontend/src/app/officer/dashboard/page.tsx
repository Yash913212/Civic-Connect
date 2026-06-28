"use client";

import { withRoleGuard } from "@/middleware/roleGuard";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, Map, Award, Clock, 
  CheckCircle, Camera, Search, Filter, MessageSquare,
  LogOut, Bell, AlertTriangle, Building2, ChevronDown, RefreshCw
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
    High: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    Medium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    Low: "bg-blue-500/15 border-blue-500/30 text-blue-400",
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
    Assigned: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    "In Progress": "bg-amber-500/15 border-amber-500/30 text-amber-400",
    Escalated: "bg-purple-500/15 border-purple-500/30 text-purple-400",
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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
  const [activeTab, setActiveTab] = useState<"tasks" | "map" | "performance">("tasks");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  return (
    <main className="bg-transparent text-slate-900 dark:text-white min-h-screen pt-32 pb-24 relative overflow-hidden flex flex-col justify-between selection:bg-emerald-500/20 dark:selection:bg-white/20">
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
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[150px] left-[-10%] top-[20%] pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-emerald-500/10 blur-[150px] right-[5%] bottom-[-10%] pointer-events-none z-0" />

      <div className="container mx-auto px-6 relative z-10 flex-grow w-full max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-black/10 dark:border-white/10 pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-cyan-500 mb-2 block">
              Field Command
            </span>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Officer <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Portal</span>
            </h1>
          </div>
          <div className="mt-6 md:mt-0 flex gap-4">
            <ThemeToggle />
            <button className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm border border-black/10 dark:bg-white/5 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-sm font-semibold">
              <Bell className="w-4 h-4 text-emerald-600 dark:text-cyan-400" />
              Dispatch Alerts
            </button>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              End Shift
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-2">
              {[
                { id: "tasks", icon: ClipboardList, label: `Active Assignments (${activeCount})${myTaskCount > 0 ? ` · ${myTaskCount} mine` : ''}` },
                { id: "map", icon: Map, label: "Field Map" },
                { id: "performance", icon: Award, label: "My Performance" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl border transition-all text-left ${
                      isActive
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-[0_4px_20px_rgba(16,185,129,0.15)] dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400 dark:shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-white dark:bg-transparent"
                        : "bg-transparent border-transparent text-slate-500 dark:text-white/50 hover:bg-white dark:hover:bg-white/[0.02] hover:text-slate-900 dark:hover:text-white/80 hover:shadow-sm dark:hover:shadow-none"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10">
               <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-white/50 mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-600 dark:text-white/70">Total</span>
                     <span className="font-bold text-slate-900 dark:text-white">{complaints.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-600 dark:text-white/70">My Tasks</span>
                     <span className="font-bold text-cyan-500 dark:text-cyan-400">{myTaskCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-600 dark:text-white/70">Active</span>
                     <span className="font-bold text-amber-500 dark:text-amber-400">{activeCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-600 dark:text-white/70">Resolved</span>
                     <span className="font-bold text-emerald-500 dark:text-emerald-400">{complaints.filter(c => c.status === "Resolved").length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-600 dark:text-white/70">Unassigned</span>
                     <span className="font-bold text-slate-900 dark:text-white">{complaints.filter(c => c.status === "Unassigned").length}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 min-h-[600px]">
            <AnimatePresence mode="wait">
              
              {activeTab === "tasks" && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Task Management
                      {loading && <span className="ml-2 inline-block w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin align-middle" />}
                    </h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 dark:text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all w-48" />
                      </div>
                      <button onClick={() => setMyTasksOnly(!myTasksOnly)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                          myTasksOnly
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}>
                        <ClipboardList size={16} /> My Tasks ({myTaskCount})
                      </button>
                      <button onClick={loadComplaints} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                        <RefreshCw size={16} /> Sync
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Task List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
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
                              ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                              : 'bg-white/70 dark:bg-black/50 backdrop-blur-xl border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">#{c.id.substring(0, 8)}</span>
                            <PriorityBadge priority={c.priority} />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{c.title}</h4>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-white/60 flex items-center gap-1">
                              <Building2 size={10} /> {c.dept}
                            </span>
                            <span className="flex items-center gap-1">
                              {c.assigned_name && (
                                <span className="text-[10px] text-cyan-500 dark:text-cyan-400 mr-1">({c.assigned_name})</span>
                              )}
                              <StatusBadge status={c.status} />
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Task Details Panel */}
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 h-full flex flex-col">
                      {selectedComplaint ? (
                        <>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedComplaint.title}</h3>
                              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">ID: #{selectedComplaint.id.substring(0, 8)}</span>
                            </div>
                            <StatusDropdown
                              current={selectedComplaint.status}
                              onChange={(s) => handleStatusChange(selectedComplaint.id, s)}
                            />
                          </div>

                          <div className="space-y-6 flex-grow">
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase mb-2">Description</h4>
                              <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed">{selectedComplaint.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase mb-1">Department</h4>
                                <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{selectedComplaint.dept}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase mb-1">Priority</h4>
                                <PriorityBadge priority={selectedComplaint.priority} />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase mb-2">Location</h4>
                              <p className="text-sm text-slate-700 dark:text-white/80">{selectedComplaint.address || selectedComplaint.location}</p>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase mb-2">Field Actions</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <button 
                                  onClick={() => showUploadProgress()}
                                  className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-colors"
                                >
                                  <Camera size={20} className="text-cyan-500 dark:text-cyan-400" />
                                  <span className="text-xs font-semibold text-slate-700 dark:text-white">Upload Evidence</span>
                                </button>
                                <button 
                                  onClick={() => toast.success("Notes saved to case file.")}
                                  className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-colors"
                                >
                                  <MessageSquare size={20} className="text-cyan-500 dark:text-cyan-400" />
                                  <span className="text-xs font-semibold text-slate-700 dark:text-white">Add Notes</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-200 dark:border-white/10 mt-6">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase mb-3">Status Actions</h4>
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
                                    s === 'Escalated' ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30' :
                                    'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30'
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
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                          <ClipboardList className="w-16 h-16 mb-4 text-slate-400 dark:text-white/20" />
                          <p className="text-sm font-semibold text-slate-600 dark:text-white">Select a complaint from the list<br/>to view details and take action.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "map" && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 h-[600px] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Field Operations Map</h3>
                  </div>
                  <OfficerMapView />
                </motion.div>
              )}

              {activeTab === "performance" && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Performance Metrics</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider block relative z-10">Resolution Rate</span>
                      <h3 className="text-3xl font-bold text-emerald-400 mt-2 relative z-10">94%</h3>
                      <span className="text-[10px] text-emerald-400 mt-2 block relative z-10">+2% this month</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-wider block relative z-10">Avg Completion Time</span>
                      <h3 className="text-3xl font-bold text-cyan-400 mt-2 relative z-10">2.4h</h3>
                      <span className="text-[10px] text-cyan-400 mt-2 block relative z-10">Top 10% in dept</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-purple-500/70 uppercase tracking-wider block relative z-10">Total Cases Handled</span>
                      <h3 className="text-3xl font-bold text-purple-400 mt-2 relative z-10">{complaints.length}</h3>
                      <span className="text-[10px] text-purple-400 mt-2 block relative z-10">In system</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider block relative z-10">Citizen Satisfaction</span>
                      <h3 className="text-3xl font-bold text-amber-400 mt-2 relative z-10">4.8/5</h3>
                      <span className="text-[10px] text-amber-400 mt-2 block relative z-10">Based on 320 reviews</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 h-80">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4">Daily Workload Trend</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={workloadData}>
                          <defs>
                            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#06b6d4', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                          <Area type="monotone" dataKey="tasks" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 h-80">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4">Resolution vs Target (Weekly)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px' }} />
                          <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
                          <Bar dataKey="target" fill="#ffffff20" radius={[4, 4, 0, 0]} name="Target" />
                        </BarChart>
                      </ResponsiveContainer>
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
