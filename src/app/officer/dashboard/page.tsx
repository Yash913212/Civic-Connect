"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, Map, TrendingUp, Award, Clock, FileText, 
  CheckCircle, Camera, Search, Filter, AlertTriangle, MessageSquare,
  LogOut, Bell, Play
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { useRouter } from "next/navigation";
import Footer from "@/components/sections/Footer";

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

export default function OfficerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tasks" | "map" | "performance">("tasks");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const handleSignOut = () => {
    sessionStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/");
  };

  return (
    <main className="bg-black text-white min-h-screen pt-32 pb-24 relative overflow-hidden flex flex-col justify-between selection:bg-white/20">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[150px] left-[-10%] top-[20%] pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-blue-500/10 blur-[150px] right-[5%] bottom-[-10%] pointer-events-none z-0" />

      <div className="container mx-auto px-6 relative z-10 flex-grow w-full max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-cyan-500 mb-2 block">
              Field Command
            </span>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white tracking-tight">
              Officer <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Portal</span>
            </h1>
          </div>
          <div className="mt-6 md:mt-0 flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-semibold">
              <Bell className="w-4 h-4 text-cyan-400" />
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
                { id: "tasks", icon: ClipboardList, label: "Active Assignments" },
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
               <h4 className="text-xs font-bold uppercase text-white/50 mb-4">Quick Stats</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">Assigned</span>
                     <span className="font-bold text-white">14</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">Pending</span>
                     <span className="font-bold text-amber-400">5</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">Resolved Today</span>
                     <span className="font-bold text-emerald-400">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-white/70">Avg Res. Time</span>
                     <span className="font-bold text-white">3.2 Hrs</span>
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
                    <h3 className="text-xl font-bold text-white">Task Management</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input type="text" placeholder="Search tasks..." className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all w-48" />
                      </div>
                      <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
                        <Filter size={16} /> Filters
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Task List */}
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                      }}
                      initial="hidden"
                      animate="show"
                      className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
                    >
                      {[
                        { id: "T-001", title: "Pothole repair at Main St", status: "In Progress", priority: "High", time: "Assigned 2h ago" },
                        { id: "T-002", title: "Broken streetlight review", status: "Assigned", priority: "Medium", time: "Assigned 4h ago" },
                        { id: "T-003", title: "Water leak inspection", status: "Under Review", priority: "Critical", time: "Assigned 5h ago" },
                        { id: "T-004", title: "Graffiti removal", status: "Awaiting Verification", priority: "Low", time: "Assigned 1d ago" },
                      ].map((task) => (
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            show: { opacity: 1, x: 0 }
                          }}
                          key={task.id} 
                          onClick={() => setSelectedTask(task.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedTask === task.id 
                              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                              : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-cyan-400">{task.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400' :
                              task.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-white/10 text-white/70'
                            }`}>{task.priority}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm mb-2">{task.title}</h4>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/60">{task.time}</span>
                            <span className={`flex items-center gap-1 ${
                              task.status === 'In Progress' ? 'text-amber-400' :
                              task.status === 'Awaiting Verification' ? 'text-purple-400' :
                              'text-white/50'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Task Details Panel */}
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 h-full flex flex-col">
                      {selectedTask ? (
                        <>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-lg font-bold text-white mb-1">Pothole repair at Main St</h3>
                              <span className="text-xs font-mono text-cyan-400">ID: {selectedTask}</span>
                            </div>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold uppercase rounded-lg border border-amber-500/30">
                              In Progress
                           </span>
                          </div>

                          <div className="space-y-6 flex-grow">
                            <div>
                              <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Description</h4>
                              <p className="text-sm text-white/80 leading-relaxed">Large pothole reported by multiple citizens in the left lane heading north. Immediate patch required before evening rush hour.</p>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Location</h4>
                              <div className="h-32 rounded-xl bg-black/50 border border-white/10 relative flex items-center justify-center overflow-hidden">
                                <Map className="w-8 h-8 text-white/10 absolute" />
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                                <span className="text-xs text-cyan-400 z-10 font-bold bg-black/60 px-2 py-1 rounded backdrop-blur-md">View on Map</span>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Field Actions</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
                                  <Camera size={20} className="text-cyan-400" />
                                  <span className="text-xs font-semibold text-white">Upload Evidence</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
                                  <MessageSquare size={20} className="text-cyan-400" />
                                  <span className="text-xs font-semibold text-white">Add Notes</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/10 mt-6 grid grid-cols-2 gap-3">
                            <button className="py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold text-sm rounded-xl transition-colors border border-emerald-500/30 flex justify-center items-center gap-2">
                               <CheckCircle size={16} /> Mark Resolved
                            </button>
                            <button className="py-2.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-bold text-sm rounded-xl transition-colors border border-amber-500/30">
                               Request Help
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                          <ClipboardList className="w-16 h-16 mb-4 text-white/20" />
                          <p className="text-sm font-semibold">Select a task from the list<br/>to view details and take action.</p>
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
                    <h3 className="text-xl font-bold text-white">Field Operations Map</h3>
                    <div className="flex gap-2">
                       <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/70">Show My Tasks</button>
                       <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/70">Nearby Units</button>
                    </div>
                  </div>
                  <div className="flex-grow rounded-2xl bg-black/50 border border-white/10 relative overflow-hidden flex items-center justify-center">
                    <Map className="w-24 h-24 text-white/5 absolute z-0" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay z-0"></div>
                    
                    {/* Simulated Map Markers for Officer */}
                    <div className="absolute top-[40%] left-[50%] w-6 h-6 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)] flex items-center justify-center border-2 border-black z-20">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="absolute top-[42%] left-[48%] text-[10px] font-bold text-cyan-400 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/50 z-20">You</div>

                    <div className="absolute top-[30%] left-[40%] w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.8)] animate-pulse z-10" />
                    <div className="absolute top-[55%] left-[65%] w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10" />
                    
                    <div className="z-30 p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl max-w-sm text-center">
                      <h4 className="text-white font-bold mb-2">GPS Tracking Active</h4>
                      <p className="text-xs text-white/60 mb-4">Navigating to assigned tasks. Map auto-centers on your current location.</p>
                      <button className="px-6 py-2 bg-cyan-500 text-black rounded-lg text-sm font-bold hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 mx-auto">
                         <Play size={16}/> Start Navigation
                      </button>
                    </div>
                  </div>
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
                  <h3 className="text-xl font-bold text-white mb-6">Performance Metrics</h3>

                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                  >
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider block relative z-10">Resolution Rate</span>
                      <h3 className="text-3xl font-bold text-emerald-400 mt-2 relative z-10">94%</h3>
                      <span className="text-[10px] text-emerald-400 mt-2 block relative z-10">+2% this month</span>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-wider block relative z-10">Avg Completion Time</span>
                      <h3 className="text-3xl font-bold text-cyan-400 mt-2 relative z-10">2.4h</h3>
                      <span className="text-[10px] text-cyan-400 mt-2 block relative z-10">Top 10% in dept</span>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-purple-500/70 uppercase tracking-wider block relative z-10">Total Cases Handled</span>
                      <h3 className="text-3xl font-bold text-purple-400 mt-2 relative z-10">842</h3>
                      <span className="text-[10px] text-purple-400 mt-2 block relative z-10">Lifetime total</span>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider block relative z-10">Citizen Satisfaction</span>
                      <h3 className="text-3xl font-bold text-amber-400 mt-2 relative z-10">4.8/5</h3>
                      <span className="text-[10px] text-amber-400 mt-2 block relative z-10">Based on 320 reviews</span>
                    </motion.div>
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 h-80">
                      <h4 className="text-sm font-bold text-white/80 mb-4">Daily Workload Trend</h4>
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
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#06b6d4', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                          <Area type="monotone" dataKey="tasks" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 h-80">
                      <h4 className="text-sm font-bold text-white/80 mb-4">Resolution vs Target (Weekly)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
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
      <Footer />
    </main>
  );
}
