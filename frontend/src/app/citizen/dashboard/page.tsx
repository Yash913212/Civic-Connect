"use client";

import { withRoleGuard } from "@/middleware/roleGuard";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, BookOpen, Radio, Activity, ChevronDown, 
  MapPin, Clock, Search, LogOut, ArrowRight,
  ShieldAlert, CloudRain, AlertTriangle, FileText,
  CheckCircle, PlusCircle, LayoutDashboard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";
import { ThemeToggle } from "@/components/ThemeToggle";
import { complaintService } from "@/services/complaintService";

const alerts = [
  { id: 1, title: "Complaint C-8840 Updated", message: "Officer Ramesh has been assigned to your drainage issue.", time: "2 hours ago", type: "update", icon: CheckCircle },
  { id: 2, title: "Water Supply Interruption", message: "Scheduled maintenance in Zone 4 will cause water cuts between 2 PM - 5 PM.", time: "5 hours ago", type: "alert", icon: AlertTriangle },
  { id: 3, title: "Complaint C-8839 Resolved", message: "The pothole on Main St has been patched. Tap to leave feedback.", time: "1 day ago", type: "success", icon: CheckCircle },
];

const faqs = [
  { id: 1, question: "How do I sort my recycling properly?", answer: "Keep paper/cardboard separate from plastics/glass. Ensure all containers are rinsed. Do not put plastic bags in the recycling bin as they jam the sorting machines." },
  { id: 2, question: "When are property taxes due?", answer: "Property taxes are due in two installments: November 1st and February 1st of each fiscal year. You can pay online via the city revenue portal." },
  { id: 3, question: "How can I request a new street light?", answer: "You can file a 'New Complaint' under the 'Electrical Dept' category. Please provide the exact coordinates or a nearby landmark for the requested pole." },
  { id: 4, question: "What are the rules for heavy trash pickup?", answer: "Heavy trash (furniture, appliances) is picked up on the first Friday of every month. Items must be placed on the curb by 6:00 AM." },
];

const feedItems = [
  { id: 1, title: "Town Hall Meeting: Infrastructure Planning", date: "Friday, 6:00 PM", location: "City Hall Auditorium", desc: "Join the mayor and city planners to discuss the upcoming 2027 infrastructure budget and road expansion projects.", icon: Radio, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: 2, title: "Severe Weather Alert", date: "Tonight, 9:00 PM", location: "Citywide", desc: "Heavy thunderstorms expected. Please secure loose outdoor items and clear storm drains of debris.", icon: CloudRain, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: 3, title: "Main Street Road Closure", date: "Tomorrow, 8:00 AM - 4:00 PM", location: "Main St & 5th Ave", desc: "Emergency water pipe repair. Expect detours. Traffic police will be on site to guide vehicles.", icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-500/10" },
];

function CitizenDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "faq" | "feed">("overview");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("Citizen");
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || "Citizen");
      } catch {}
    }

    // Load actual stats
    complaintService.getMy().then(data => {
      const resolved = data.filter(c => c.status === 'Resolved').length;
      setStats({
        total: data.length,
        resolved: resolved,
        pending: data.length - resolved
      });
    }).catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/");
  };

  return (
    <main className="bg-transparent text-slate-900 dark:text-white min-h-screen pt-32 pb-24 relative overflow-hidden flex flex-col justify-between selection:bg-primary/20 dark:selection:bg-white/20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-transparent"
          colors={[[99, 102, 241], [168, 85, 247]]}
          dotSize={5}
          reverse={false}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,_transparent_100%)] opacity-30" />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px]" />
      </div>
      
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[150px] left-[-10%] top-[10%] pointer-events-none z-0" />
      <div className="absolute w-[30vw] h-[30vw] rounded-full bg-purple-500/10 blur-[150px] right-[5%] bottom-[-10%] pointer-events-none z-0" />

      <div className="container mx-auto px-6 relative z-10 flex-grow w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">{userName.split(' ')[0]}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-white/60 mt-2 flex items-center gap-2">
              <MapPin size={14} /> City Resident Portal
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex gap-3">
            <ThemeToggle />
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all text-sm font-semibold"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-2">
            {[
              { id: "overview", icon: LayoutDashboard, label: "Overview" },
              { id: "alerts", icon: Bell, label: "Notifications & Alerts" },
              { id: "faq", icon: BookOpen, label: "Civic Knowledge Base" },
              { id: "feed", icon: Radio, label: "City Announcements" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all text-left border ${
                    isActive
                      ? "bg-primary/10 border-primary/30 text-primary shadow-[0_4px_20px_rgba(99,102,241,0.15)] bg-white dark:bg-transparent"
                      : "bg-transparent border-transparent text-slate-500 dark:text-white/50 hover:bg-white dark:hover:bg-white/[0.02] hover:text-slate-900 dark:hover:text-white/80"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {tab.id === 'alerts' && <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 relative overflow-hidden">
                      <FileText className="absolute top-4 right-4 w-16 h-16 text-black/5 dark:text-white/5" />
                      <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">Total Complaints</h4>
                      <p className="text-4xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 relative overflow-hidden">
                      <Activity className="absolute top-4 right-4 w-16 h-16 text-amber-500/10" />
                      <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500/70 uppercase tracking-wider mb-2">In Progress</h4>
                      <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden">
                      <CheckCircle className="absolute top-4 right-4 w-16 h-16 text-emerald-500/10" />
                      <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-500/70 uppercase tracking-wider mb-2">Resolved</h4>
                      <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <button onClick={() => router.push('/citizen/complaint')}
                      className="group flex flex-col justify-center items-center gap-3 p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform text-primary">
                        <PlusCircle size={24} />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">File New Complaint</h3>
                      <p className="text-sm text-slate-500 dark:text-white/60 text-center">Report an issue in your neighborhood directly to the city.</p>
                    </button>
                    
                    <button onClick={() => router.push('/citizen/complaints')}
                      className="group flex flex-col justify-center items-center gap-3 p-8 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all hover:shadow-lg">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform text-slate-600 dark:text-white/80">
                        <FileText size={24} />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">View My Complaints</h3>
                      <p className="text-sm text-slate-500 dark:text-white/60 text-center">Track status, communicate with officers, and leave feedback.</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ALERTS TAB */}
              {activeTab === "alerts" && (
                <motion.div key="alerts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Notifications & Alerts</h3>
                  {alerts.map(alert => (
                    <div key={alert.id} className="p-5 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 flex gap-4 hover:border-primary/30 transition-all">
                      <div className={`mt-1 shrink-0 ${alert.type === 'success' ? 'text-emerald-500' : alert.type === 'alert' ? 'text-rose-500' : 'text-primary'}`}>
                        <alert.icon size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">{alert.title}</h4>
                          <span className="text-xs text-slate-500 dark:text-white/50">{alert.time}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{alert.message}</p>
                        {alert.type === 'success' && (
                          <button onClick={() => router.push('/citizen/complaints')} className="mt-3 text-xs font-bold text-emerald-500 flex items-center gap-1 hover:gap-2 transition-all">
                            Review Now <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* FAQ TAB */}
              {activeTab === "faq" && (
                <motion.div key="faq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Civic Knowledge Base</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Search guidelines..." className="pl-9 pr-4 py-2 bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 w-48 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {faqs.map(faq => (
                      <div key={faq.id} className="rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 overflow-hidden">
                        <button onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)} className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{faq.question}</span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedFaq === faq.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-4 text-sm text-slate-600 dark:text-white/70 leading-relaxed border-t border-black/5 dark:border-white/5 pt-4">
                              {faq.answer}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CITY FEED TAB */}
              {activeTab === "feed" && (
                <motion.div key="feed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">City Announcements</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {feedItems.map(item => (
                      <div key={item.id} className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 flex flex-col md:flex-row gap-5 hover:shadow-md transition-all">
                        <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}>
                          <item.icon className={item.color} size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{item.title}</h4>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-white/60 mb-3">
                            <span className="flex items-center gap-1.5"><Clock size={14} /> {item.date}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {item.location}</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
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

export default withRoleGuard(CitizenDashboard, ['CITIZEN', 'ADMIN']);
