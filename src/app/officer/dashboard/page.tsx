"use client";

import { useState, useEffect } from "react";
import { withRoleGuard } from "@/middleware/roleGuard";
import { ComplaintService, Complaint } from "@/services/complaints.service";
import { useAuth } from "@/auth/authContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, Map, TrendingUp, Award, Clock, FileText, 
  CheckCircle, Camera, Search, Filter, AlertTriangle, MessageSquare,
  LogOut, Bell, Play, Loader2, ChevronRight
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import Navbar from "@/components/Navbar";

// Keeping the mock charts for aesthetic purposes since we don't have historical data yet
const workloadData = [
  { name: 'Mon', tasks: 4 },
  { name: 'Tue', tasks: 7 },
  { name: 'Wed', tasks: 5 },
  { name: 'Thu', tasks: 8 },
  { name: 'Fri', tasks: 6 },
  { name: 'Sat', tasks: 2 },
  { name: 'Sun', tasks: 3 },
];

function OfficerDashboard() {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "map" | "performance">("tasks");
  const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const data = await ComplaintService.getOfficerComplaints();
      setComplaints(data);
    } catch (error) {
      console.error("Failed to load officer complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await ComplaintService.updateStatus(id, newStatus);
      await loadComplaints();
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const assigned = complaints.filter(c => c.status === 'ASSIGNED');
  const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS');
  const resolved = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status));

  const stats = {
    total: complaints.length,
    assigned: assigned.length,
    inProgress: inProgress.length,
    resolved: resolved.length
  };

  return (
    <main className="bg-[#050505] text-white min-h-screen pt-32 pb-24 relative overflow-hidden flex flex-col font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#050505] to-[#050505] z-0 pointer-events-none" />
      <Navbar />

      <div className="container mx-auto px-6 relative z-10 flex-grow w-full max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-cyan-500 mb-2 block">
              Field Command
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Officer <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Portal</span>
            </h1>
          </div>
          <div className="mt-6 md:mt-0 flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-semibold">
              <Bell className="w-4 h-4 text-cyan-400" />
              Dispatch Alerts
            </button>
            <button 
              onClick={logout}
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
                { id: "tasks", icon: ClipboardList, label: "Kanban Board" },
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
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "bg-transparent border-transparent text-white/50 hover:bg-white/[0.02] hover:text-white/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
               <h4 className="text-xs font-bold uppercase text-white/50 mb-4">Live Stats</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">Total Assigned</span>
                     <span className="font-bold text-white">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">Needs Action</span>
                     <span className="font-bold text-purple-400">{stats.assigned}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">In Progress</span>
                     <span className="font-bold text-amber-400">{stats.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">Resolved</span>
                     <span className="font-bold text-emerald-400">{stats.resolved}</span>
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
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Assignment Board</h3>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                      {/* Column 1: Assigned */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-purple-400">Assigned</h4>
                          <span className="bg-purple-500/20 text-purple-400 text-xs py-1 px-2 rounded-full">{assigned.length}</span>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-grow pr-1 custom-scrollbar">
                          {assigned.map((task) => (
                            <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
                              <h5 className="font-medium text-white mb-1">{task.title}</h5>
                              <p className="text-xs text-gray-400 mb-3 truncate">{task.location}</p>
                              <button 
                                onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                                className="w-full py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-semibold rounded-lg transition-colors border border-amber-500/20"
                              >
                                Start Work
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: In Progress */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-amber-400">In Progress</h4>
                          <span className="bg-amber-500/20 text-amber-400 text-xs py-1 px-2 rounded-full">{inProgress.length}</span>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-grow pr-1 custom-scrollbar">
                          {inProgress.map((task) => (
                            <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-amber-500/30 transition-colors">
                              <h5 className="font-medium text-white mb-1">{task.title}</h5>
                              <p className="text-xs text-gray-400 mb-3 truncate">{task.location}</p>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleStatusChange(task.id, 'RESOLVED')}
                                  className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold rounded-lg transition-colors border border-emerald-500/20"
                                >
                                  Resolve
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column 3: Resolved */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-emerald-400">Resolved</h4>
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs py-1 px-2 rounded-full">{resolved.length}</span>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-grow pr-1 custom-scrollbar">
                          {resolved.map((task) => (
                            <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-70 hover:opacity-100 transition-opacity">
                              <h5 className="font-medium text-white mb-1 line-through decoration-white/20">{task.title}</h5>
                              <p className="text-xs text-gray-500 truncate">{task.location}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Keep existing Map and Performance tabs the same as they are visual mockups */}
              {activeTab === "performance" && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white mb-6">Performance Metrics</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider block">Resolution Rate</span>
                      <h3 className="text-3xl font-bold text-emerald-400 mt-2">94%</h3>
                    </div>
                    <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                      <span className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-wider block">Avg Time</span>
                      <h3 className="text-3xl font-bold text-cyan-400 mt-2">2.4h</h3>
                    </div>
                    <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                      <span className="text-[10px] font-bold text-purple-500/70 uppercase tracking-wider block">Cases Handled</span>
                      <h3 className="text-3xl font-bold text-purple-400 mt-2">{stats.resolved}</h3>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 h-80">
                    <h4 className="text-sm font-bold text-white/80 mb-4">Daily Workload</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workloadData}>
                        <defs>
                          <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#06b6d4', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="tasks" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                      </AreaChart>
                    </ResponsiveContainer>
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
