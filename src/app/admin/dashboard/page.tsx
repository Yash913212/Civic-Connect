"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Users, FileText, Map, Settings, AlertTriangle, 
  CheckCircle, FolderOpen, Briefcase, Activity, Clock, Bell,
  LogOut, Download, Filter, Search, ChevronRight, Database
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area
} from "recharts";
import { useRouter } from "next/navigation";
import Footer from "@/components/sections/Footer";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";

const complaintTrends = [
  { name: 'Mon', new: 120, resolved: 90 },
  { name: 'Tue', new: 150, resolved: 110 },
  { name: 'Wed', new: 180, resolved: 160 },
  { name: 'Thu', new: 140, resolved: 150 },
  { name: 'Fri', new: 210, resolved: 190 },
  { name: 'Sat', new: 90, resolved: 100 },
  { name: 'Sun', new: 80, resolved: 120 },
];

const deptPerformance = [
  { name: 'Sanitation', efficiency: 85 },
  { name: 'Public Works', efficiency: 62 },
  { name: 'Water & Power', efficiency: 91 },
  { name: 'Traffic', efficiency: 45 },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "departments" | "map" | "reports">("overview");

  const handleSignOut = () => {
    sessionStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/");
  };

  return (
    <main className="bg-transparent text-white min-h-screen pt-32 pb-24 relative overflow-hidden flex flex-col justify-between selection:bg-white/20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-transparent"
          colors={[[168, 85, 247]]}
          dotSize={6}
          reverse={false}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,_transparent_100%)] opacity-20" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-purple-500/10 blur-[150px] left-[-10%] top-[20%] pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-amber-500/10 blur-[150px] right-[5%] bottom-[-10%] pointer-events-none z-0" />

      <div className="container mx-auto px-6 relative z-10 flex-grow w-full max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-purple-500 mb-2 block">
              Operations Center
            </span>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white tracking-tight">
              City <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Admin</span> Console
            </h1>
          </div>
          <div className="mt-6 md:mt-0 flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-semibold">
              <Bell className="w-4 h-4 text-purple-400" />
              Notifications
            </button>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2">
            {[
              { id: "overview", icon: Activity, label: "Dashboard Overview" },
              { id: "complaints", icon: FolderOpen, label: "Assignment Center" },
              { id: "departments", icon: Building2, label: "Department Mgmt" },
              { id: "map", icon: Map, label: "GIS Analytics" },
              { id: "reports", icon: FileText, label: "Reports & Exports" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl border transition-all text-left ${
                    isActive
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      : "bg-transparent border-transparent text-white/50 hover:bg-white/[0.02] hover:text-white/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 min-h-[600px]">
            <AnimatePresence mode="wait">
              
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <FileText className="absolute top-4 right-4 w-12 h-12 text-white/5 group-hover:text-white/10 transition-colors" />
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block relative z-10">Total Complaints</span>
                      <h3 className="text-3xl font-bold text-white mt-2 relative z-10">12,402</h3>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <AlertTriangle className="absolute top-4 right-4 w-12 h-12 text-amber-500/10 group-hover:text-amber-500/20 transition-colors" />
                      <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider block relative z-10">Open</span>
                      <h3 className="text-3xl font-bold text-amber-400 mt-2 relative z-10">1,240</h3>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CheckCircle className="absolute top-4 right-4 w-12 h-12 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors" />
                      <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider block relative z-10">Closed</span>
                      <h3 className="text-3xl font-bold text-emerald-400 mt-2 relative z-10">10,850</h3>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Building2 className="absolute top-4 right-4 w-12 h-12 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors" />
                      <span className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-wider block relative z-10">Avg Dept Rating</span>
                      <h3 className="text-3xl font-bold text-cyan-400 mt-2 relative z-10">A-</h3>
                    </motion.div>
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 h-80">
                      <h4 className="text-sm font-bold text-white/80 mb-4">Daily Complaint Trends</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={complaintTrends}>
                          <defs>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#ffffff20', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                          <Area type="monotone" dataKey="new" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" />
                          <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 h-80">
                      <h4 className="text-sm font-bold text-white/80 mb-4">Department Efficiency Score (%)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                          <XAxis type="number" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} width={100} />
                          <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px' }} />
                          <Bar dataKey="efficiency" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "complaints" && (
                <motion.div
                  key="complaints"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-white">Assignment Center</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input type="text" placeholder="Search ID..." className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all w-48" />
                      </div>
                      <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
                        <Filter size={16} /> Filters
                      </button>
                    </div>
                  </div>

                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {[
                      { id: "C-8839", title: "Massive pothole causing accidents", dept: "Public Works", priority: "Critical", status: "Unassigned", time: "2 hours ago" },
                      { id: "C-8840", title: "Streetlight completely off", dept: "Water & Power", priority: "High", status: "Assigned", time: "5 hours ago" },
                      { id: "C-8841", title: "Overflowing garbage bin", dept: "Sanitation", priority: "Medium", status: "Assigned", time: "1 day ago" },
                      { id: "C-8842", title: "Faded crosswalk paint", dept: "Traffic", priority: "Low", status: "Escalated", time: "3 days ago" }
                    ].map((item, idx) => (
                      <motion.div 
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          show: { opacity: 1, x: 0 }
                        }}
                        key={idx} 
                        className="p-4 rounded-xl bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] transition-colors flex flex-col md:flex-row justify-between items-center gap-4 group"
                      >
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className={`p-3 rounded-xl border ${
                            item.priority === 'Critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                            item.priority === 'High' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                            item.priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                            'bg-blue-500/10 border-blue-500/30 text-blue-500'
                          }`}>
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-white/40">{item.id}</span>
                              <h4 className="text-sm font-bold text-white">{item.title}</h4>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                              <span className="text-white/60 flex items-center gap-1"><Building2 size={12}/> {item.dept}</span>
                              <span className="text-white/40 flex items-center gap-1"><Clock size={12}/> {item.time}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            item.status === 'Unassigned' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            item.status === 'Escalated' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                            'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          }`}>
                            {item.status}
                          </span>
                          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors border border-white/10">
                            Manage
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "departments" && (
                <motion.div
                  key="departments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Department Workloads</h3>
                    <button className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm rounded-lg transition-colors">
                      + New Department
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: "Public Works", officerCount: 42, activeCases: 156, color: "bg-blue-500" },
                      { name: "Sanitation", officerCount: 85, activeCases: 312, color: "bg-emerald-500" },
                      { name: "Traffic Management", officerCount: 30, activeCases: 84, color: "bg-amber-500" },
                      { name: "Water & Power", officerCount: 25, activeCases: 41, color: "bg-cyan-500" }
                    ].map((dept, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${dept.color}/20 flex items-center justify-center text-${dept.color.split('-')[1]}-400`}>
                              <Building2 size={20} />
                            </div>
                            <h4 className="font-bold text-white">{dept.name}</h4>
                          </div>
                          <button className="text-white/40 hover:text-white transition-colors"><Settings size={18}/></button>
                        </div>
                        <div className="flex justify-between text-sm text-white/60 mb-2">
                          <span>Officers Assigned: <strong className="text-white">{dept.officerCount}</strong></span>
                          <span>Active Workload: <strong className="text-white">{dept.activeCases}</strong></span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (dept.activeCases / dept.officerCount) * 40)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full ${dept.color}`} 
                          />
                        </div>
                        <div className="mt-4 flex gap-2">
                           <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white/80 transition-colors">Assign Officers</button>
                           <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white/80 transition-colors">View Queue</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "reports" && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white mb-6">Report Generation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center text-center hover:bg-white/[0.04] transition-all cursor-pointer group">
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={28} />
                      </div>
                      <h4 className="font-bold text-white mb-2">Monthly PDF Report</h4>
                      <p className="text-xs text-white/50 mb-6">Generates comprehensive governance report with charts.</p>
                      <button className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-bold mt-auto border border-rose-500/30">
                        <Download size={16} /> Generate PDF
                      </button>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center text-center hover:bg-white/[0.04] transition-all cursor-pointer group">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Database size={28} />
                      </div>
                      <h4 className="font-bold text-white mb-2">Raw Data Export</h4>
                      <p className="text-xs text-white/50 mb-6">Exports all compliant entries to CSV for offline analysis.</p>
                      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold mt-auto border border-emerald-500/30">
                        <Download size={16} /> Export CSV
                      </button>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center text-center hover:bg-white/[0.04] transition-all cursor-pointer group">
                      <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Building2 size={28} />
                      </div>
                      <h4 className="font-bold text-white mb-2">Department Audit</h4>
                      <p className="text-xs text-white/50 mb-6">Generates performance summaries for all departments.</p>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-bold mt-auto border border-blue-500/30">
                        <Download size={16} /> Run Audit
                      </button>
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
                    <h3 className="text-xl font-bold text-white">GIS Analytics & Density Map</h3>
                    <div className="flex gap-2">
                       <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/70">Heatmap Layer</button>
                       <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/70">Markers</button>
                    </div>
                  </div>
                  <div className="flex-grow rounded-2xl bg-black/50 border border-white/10 relative overflow-hidden flex items-center justify-center">
                    <Map className="w-24 h-24 text-white/5 absolute z-0" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay z-0"></div>
                    
                    {/* Simulated Map Markers */}
                    <div className="absolute top-[30%] left-[40%] w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.8)] animate-pulse z-10" />
                    <div className="absolute top-[50%] left-[60%] w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10" />
                    <div className="absolute top-[20%] left-[20%] w-6 h-6 bg-cyan-500/50 rounded-full flex items-center justify-center border border-cyan-400 z-10 text-[8px] font-bold">12</div>
                    
                    <div className="z-20 p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl max-w-sm text-center">
                      <h4 className="text-white font-bold mb-2">Map Engine Initialized</h4>
                      <p className="text-xs text-white/60 mb-4">Live connection to geospatial data streams active. Displaying aggregated clusters.</p>
                      <button className="px-6 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-400 transition-colors">Interact</button>
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
