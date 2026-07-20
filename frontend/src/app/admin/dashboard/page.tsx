"use client";

import { withRoleGuard } from "@/middleware/roleGuard";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, FileText, Map, Settings, AlertTriangle,
  CheckCircle, FolderOpen, Activity, Clock, Bell,
  LogOut, Download, Filter, Search, Database,
  TrendingUp, Zap, Shield, BarChart3, RefreshCw, ChevronDown, Trash2,
  ShieldAlert, Radio, Wallet, Menu, X, Sparkles, Gauge
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { useRouter } from "next/navigation";
import Footer from "@/components/sections/Footer";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { showTextLoading, showSystemStatus, showOfficerAssigned, showAIFuturistic } from "@/components/ui/CustomToasts";
import { complaintService, type OfficerData } from "@/services/complaintService";
import { adminService, type UserData, type DepartmentData } from "@/services/adminService";
import { apiRequest } from "@/services/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { AdminSidebar } from "./AdminSidebar";
import { SystemHealthTab } from "./SystemHealthTab";
import { IntelligenceTab } from "./IntelligenceTab";
import { SLATab } from "./SLATab";

const defaultComplaintTrends = [
  { name: 'Mon', new: 120, resolved: 90 },
  { name: 'Tue', new: 150, resolved: 110 },
  { name: 'Wed', new: 180, resolved: 160 },
  { name: 'Thu', new: 140, resolved: 150 },
  { name: 'Fri', new: 210, resolved: 190 },
  { name: 'Sat', new: 90, resolved: 100 },
  { name: 'Sun', new: 80, resolved: 120 },
];

const defaultDeptPerformance = [
  { name: 'Roads Dept', efficiency: 72, fill: '#f59e0b' },
  { name: 'Drainage Dept', efficiency: 58, fill: '#06b6d4' },
  { name: 'Sanitation', efficiency: 85, fill: '#10b981' },
  { name: 'Water Works', efficiency: 91, fill: '#3b82f6' },
  { name: 'Electrical Dept', efficiency: 63, fill: '#eab308' },
  { name: 'Power Distribution', efficiency: 78, fill: '#f97316' },
  { name: 'Public Safety', efficiency: 45, fill: '#ef4444' },
  { name: 'Traffic Management', efficiency: 55, fill: '#a855f7' },
];

const defaultPriorityData = [
  { name: 'Critical', value: 120, color: '#ef4444' },
  { name: 'High', value: 280, color: '#f97316' },
  { name: 'Medium', value: 450, color: '#eab308' },
  { name: 'Low', value: 392, color: '#10b981' },
];

const complaintFallbacks = [
  { id: "C-8839", title: "Pedda gunta road meeda", dept: "Roads Dept", priority: "Critical", status: "Unassigned", time: "2 hours ago" },
  { id: "C-8840", title: "Drainage block ayipoyindi", dept: "Drainage Dept", priority: "High", status: "Assigned", time: "5 hours ago" },
  { id: "C-8841", title: "Overflowing garbage bin on main road", dept: "Sanitation", priority: "Medium", status: "Assigned", time: "1 day ago" },
  { id: "C-8842", title: "Water pipe burst street flooded", dept: "Water Works", priority: "Critical", status: "In Progress", time: "4 hours ago" },
  { id: "C-8843", title: "Street light not working complete dark", dept: "Electrical Dept", priority: "High", status: "Assigned", time: "6 hours ago" },
  { id: "C-8844", title: "Exposed electric wire dangerous", dept: "Power Distribution", priority: "Critical", status: "Unassigned", time: "1 hour ago" },
  { id: "C-8845", title: "Open manhole no cover dangerous", dept: "Public Safety", priority: "Critical", status: "Unassigned", time: "30 mins ago" },
  { id: "C-8846", title: "Traffic signal not working at junction", dept: "Traffic Management", priority: "High", status: "Assigned", time: "3 hours ago" },
];

function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);
  return <>{display.toLocaleString()}{suffix}</>;
}

function PulseDot({ color = "bg-emerald-500" }: { color?: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
      <span className={`relative flex w-2 h-2 ${color}`}>
        <span className={`animate-ping absolute inline-flex w-full h-full rounded-full ${color} opacity-75`} />
        <span className={`relative inline-flex w-2 h-2 rounded-full ${color}`} />
      </span>
      LIVE
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    High: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    Medium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    Low: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}

function PieChartCard({ data }: { data: any[] }) {
  return (
    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-lg transition-all">
      <h4 className="text-sm font-bold text-foreground mb-4">Priority Distribution</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
            animationBegin={0} animationDuration={1500}>
            {data.map((e, i) => <Cell key={i} fill={e.color} stroke={e.color} strokeOpacity={0.5}
              style={{ filter: `drop-shadow(0 0 6px ${e.color}40)` }} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#000000cc', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-semibold ml-auto">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ComplaintData { id: string; title: string; dept: string; priority: string; status: string; time: string; assigned_to?: string | null; assigned_name?: string | null; }

const STATUS_OPTIONS = ["Unassigned", "Assigned", "In Progress", "Escalated", "Resolved"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Unassigned: "bg-slate-500/15 border-slate-500/30 text-slate-400",
    Assigned: "bg-teal-500/15 border-teal-500/30 text-teal-400",
    "In Progress": "bg-amber-500/15 border-amber-500/30 text-amber-400",
    Escalated: "bg-teal-500/15 border-teal-500/30 text-teal-400",
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
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-lg py-1 min-w-[150px]">
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

function OfficerAssignDropdown({ officers, currentOfficerId, currentOfficerName, onAssign }: {
  officers: OfficerData[];
  currentOfficerId: string | null;
  currentOfficerName: string | null;
  onAssign: (officerId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer bg-white dark:bg-white/5 border-black/10 dark:border-white/10 whitespace-nowrap">
        <Users size={12} className="text-muted-foreground" />
        <span className="max-w-[80px] truncate text-muted-foreground">
          {currentOfficerName || "Assign"}
        </span>
        <ChevronDown size={12} className="text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-lg py-1 min-w-[180px] max-h-[240px] overflow-y-auto">
            {currentOfficerId && (
              <button onClick={() => { onAssign(null); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                Unassign
              </button>
            )}
            {officers.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No officers found</div>
            )}
            {officers.map(o => (
              <button key={o.id} onClick={() => { onAssign(o.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2 ${
                  o.id === currentOfficerId ? 'text-primary' : 'text-foreground'
                }`}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-teal-500 flex items-center justify-center text-white text-[8px] font-bold">
                  {o.full_name.charAt(0)}
                </div>
                {o.full_name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UserRow({ user, onUpdate }: { user: UserData; onUpdate: () => void }) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    setBusy(true);
    try {
      await adminService.updateRole(user.id, newRole);
      toast.success(`${user.full_name} role → ${newRole}`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async () => {
    setBusy(true);
    try {
      await adminService.toggleActive(user.id);
      toast.success(`${user.full_name} ${user.is_active ? 'deactivated' : 'activated'}`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">
            {user.full_name.charAt(0)}
          </div>
          <span className="font-semibold text-foreground">{user.full_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">{user.email}</td>
      <td className="px-4 py-3">
        <div className="relative">
          <button onClick={() => !busy && setRoleOpen(!roleOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-slate-50 dark:hover:bg-white/10 bg-white dark:bg-white/5 border-black/10 dark:border-white/10">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              user.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-400' :
              user.role === 'OFFICER' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>{user.role}</span>
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>
          {roleOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-lg py-1 min-w-[140px]">
                {['CITIZEN', 'OFFICER', 'ADMIN'].map(r => (
                  <button key={r} onClick={() => { handleRoleChange(r); setRoleOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                      r === user.role ? 'text-primary' : 'text-foreground'
                    }`}>{r}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          user.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button onClick={handleToggleActive} disabled={busy}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            user.is_active
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          } disabled:opacity-50`}>
          {user.is_active ? 'Disable' : 'Enable'}
        </button>
      </td>
    </tr>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [liveTime, setLiveTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [officers, setOfficers] = useState<OfficerData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptFormName, setDeptFormName] = useState("");
  const [deptFormDesc, setDeptFormDesc] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptDeleteTarget, setDeptDeleteTarget] = useState<DepartmentData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [trendsData, setTrendsData] = useState(defaultComplaintTrends);
  const [deptPerfData, setDeptPerfData] = useState(defaultDeptPerformance);
  const [prioData, setPrioData] = useState(defaultPriorityData);
  const [kpis, setKpis] = useState({ total: 0, open: 0, closed: 0, resolutionRate: 0 });

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadComplaints = () => {
    setLoadingComplaints(true);
    const toastId = showTextLoading("Admin Sync", "Connecting to Civic DB");
    complaintService.getAll()
      .then(data => {
        const mapped = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          dept: c.dept,
          priority: c.priority,
          status: c.status,
          time: c.time?.split('T')[0] || c.time || "—",
          assigned_to: c.assigned_to,
          assigned_name: c.assigned_name,
        }));
        setComplaints([...mapped, ...complaintFallbacks] as ComplaintData[]);
        toast.dismiss(toastId);
        showSystemStatus("Database Sync", "Complaints loaded successfully");
        setLoadingComplaints(false);
      })
      .catch(() => {
        setComplaints(complaintFallbacks);
        toast.dismiss(toastId);
        showSystemStatus("Sync Error", "Loaded offline data. Server unavailable.", true);
        setLoadingComplaints(false);
      });
  };

  const loadAnalytics = async () => {
    try {
      const data = await apiRequest<any>('/analytics');
      if (data.kpis && data.kpis.total > 0) {
        setTrendsData(data.trends || defaultComplaintTrends);
        setDeptPerfData(data.deptPerformance || defaultDeptPerformance);
        setPrioData(data.priorityData || defaultPriorityData);
        setKpis(data.kpis);
      } else {
        // Fallback to sample data for display if database is empty
        setTrendsData(defaultComplaintTrends);
        setDeptPerfData(defaultDeptPerformance);
        setPrioData(defaultPriorityData);
        setKpis({ total: 1248, open: 142, closed: 1106, resolutionRate: 88 });
      }
    } catch (e) {
      setTrendsData(defaultComplaintTrends);
      setDeptPerfData(defaultDeptPerformance);
      setPrioData(defaultPriorityData);
      setKpis({ total: 1248, open: 142, closed: 1106, resolutionRate: 88 });
    }
  };

  useEffect(() => { loadComplaints(); loadAnalytics(); }, []);

  useEffect(() => {
    complaintService.listOfficers()
      .then(setOfficers)
      .catch(() => {});
  }, []);

  const loadUsers = () => {
    setLoadingUsers(true);
    adminService.listUsers()
      .then(data => { setUsers(data); setLoadingUsers(false); })
      .catch(() => { setLoadingUsers(false); });
  };

  const loadDepartments = () => {
    setLoadingDepts(true);
    adminService.listDepartments()
      .then(data => { setDepartments(data); setLoadingDepts(false); })
      .catch(() => { setLoadingDepts(false); });
  };

  useEffect(() => { if (activeTab === "users") loadUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === "departments") loadDepartments(); }, [activeTab]);

  const handleStatusChange = async (complaintId: string, displayId: string, newStatus: string) => {
    try {
      await complaintService.updateStatus(complaintId, newStatus);
      setComplaints(prev => prev.map(c =>
        c.id === complaintId ? { ...c, status: newStatus } : c
      ));
      toast.success(`#${displayId} → ${newStatus}`);
      showSystemStatus("Status Update", `Complaint ${displayId} updated to ${newStatus}`);
      if (newStatus === "Resolved") confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssign = async (complaintId: string, displayId: string, officerId: string | null) => {
    try {
      const result = await complaintService.assignOfficer(complaintId, officerId);
      setComplaints(prev => prev.map(c =>
        c.id === complaintId ? { ...c, assigned_to: result.assigned_to, assigned_name: result.assigned_name, status: result.status } : c
      ));
      toast.success(`#${displayId} → ${result.message}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleVerifyResolution = async (complaintId: string, displayId: string) => {
    try {
      await complaintService.verifyResolution(complaintId, { is_valid: true, comments: 'Approved by admin' });
      toast.success(`#${displayId} resolution verified! Points awarded.`);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
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

  const filteredComplaints = complaints.filter(c =>
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
  };

  return (
    <main className="bg-transparent text-slate-900 dark:text-white min-h-screen pt-28 pb-10 relative overflow-hidden flex flex-col selection:bg-emerald-500/20 dark:selection:bg-white/20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasRevealEffect animationSpeed={3} containerClassName="bg-transparent" colors={[[168, 85, 247]]} dotSize={6} reverse={false} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,_transparent_100%)] opacity-20" />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px]" />
      </div>
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-violet-500/10 blur-[150px] left-[-10%] top-[20%] pointer-events-none z-0" />
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
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-emerald-600 dark:text-teal-500">Operations Center</span>
                <PulseDot color="bg-emerald-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                City <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-violet-500 dark:from-teal-400 dark:to-emerald-500">Admin</span> Console
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-mono">
                {liveTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {liveTime.toLocaleTimeString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto">
            <button onClick={() => { showAIFuturistic("High", "Water Department", "92%"); }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white shadow-sm border border-black/10 dark:bg-white/5 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap">
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-teal-400" /> AI Insights
            </button>
            <button onClick={() => toast("3 system alerts require your attention. Please check SLA Compliance.", { icon: '🔔' })}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white shadow-sm border border-black/10 dark:bg-white/5 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap relative">
              <Bell className="w-4 h-4 text-emerald-500 dark:text-teal-400" />
              Alerts
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">3</span>
            </button>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap">
              <LogOut className="w-4 h-4" /> Sign Out
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
          {/* Sidebar – desktop: fixed-width column, mobile: slide-in drawer */}
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
            <AdminSidebar
              activeTab={activeTab}
              onTabChange={(id) => { setActiveTab(id); setSidebarOpen(false); }}
              complaintCount={complaints.length}
            />
          </motion.aside>

          {/* Main Content – takes all remaining width */}
          <div className="flex-1 min-w-0 min-h-[600px] pl-0 lg:pl-6">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" {...pageVariants} className="space-y-6">
                  {/* KPI Cards */}
                  <motion.div
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                    initial="hidden" animate="show"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {[
                      { icon: FileText, label: "Total Complaints", value: kpis.total, suffix: "", color: "text-slate-900 dark:text-white", bg: "bg-white/70 dark:bg-black/40", accent: "text-slate-900/5 dark:text-white/5", gradient: "from-emerald-500/10" },
                      { icon: AlertTriangle, label: "Open", value: kpis.open, suffix: "", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/5", accent: "text-amber-500/10", gradient: "from-amber-500/10" },
                      { icon: CheckCircle, label: "Closed", value: kpis.closed, suffix: "", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/5", accent: "text-emerald-500/10", gradient: "from-emerald-500/10" },
                      { icon: TrendingUp, label: "Resolution Rate", value: kpis.resolutionRate, suffix: "%", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/5", accent: "text-teal-500/10", gradient: "from-teal-500/10" },
                    ].map((kpi) => {
                      const Icon = kpi.icon;
                      return (
                        <motion.div
                          key={kpi.label}
                          variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                          whileHover={{ y: -2 }}
                          className={`p-5 rounded-2xl ${kpi.bg} backdrop-blur-xl border border-black/10 dark:border-white/10 relative overflow-hidden group cursor-default bg-gradient-to-br ${kpi.gradient} to-transparent`}
                        >
                          <Icon className={`absolute top-4 right-4 w-10 h-10 ${kpi.accent} group-hover:scale-110 transition-transform duration-500`} />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block relative z-10">{kpi.label}</span>
                          <h3 className={`text-2xl sm:text-3xl font-bold ${kpi.color} mt-2 relative z-10`}>
                            <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                          </h3>
                          <span className="text-[10px] text-emerald-500 mt-1 block relative z-10 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +{Math.floor(kpi.value * 0.08)} this month
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-lg transition-all h-80">
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-500" /> Daily Complaint Trends
                      </h4>
                      <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={trendsData}>
                          <defs>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.1} vertical={false} />
                          <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#000000cc', border: '1px solid #ffffff20', borderRadius: '8px', backdropFilter: 'blur(10px)', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="new" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNew)" dot={false} activeDot={{ r: 5, fill: "#8b5cf6" }} />
                          <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" dot={false} activeDot={{ r: 5, fill: "#10b981" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <PieChartCard data={prioData} />
                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-lg transition-all">
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" /> Department Efficiency Score
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={deptPerfData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.08} horizontal={false} />
                          <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={90} />
                          <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ background: '#000000cc', border: '1px solid #ffffff20', borderRadius: '8px' }} formatter={(v: any) => [`${v ?? 0}%`, 'Efficiency']} />
                          <Bar dataKey="efficiency" radius={[0, 6, 6, 0]} animationDuration={1500}>
                            {deptPerfData.map((e, i) => <Cell key={i} fill={e.fill} style={{ filter: `drop-shadow(0 0 4px ${e.fill}40)` }} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-lg transition-all">
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "New Department", icon: Building2, desc: "Create a department", color: "from-emerald-500/20" },
                          { label: "Generate Report", icon: FileText, desc: "Export monthly data", color: "from-violet-500/20" },
                          { label: "Assign Officers", icon: Users, desc: "Manage assignments", color: "from-teal-500/20" },
                          { label: "Sync Data", icon: RefreshCw, desc: "Refresh from server", color: "from-amber-500/20" },
                        ].map((a) => {
                          const Icon = a.icon;
                          return (
                            <motion.button key={a.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={() => { showSystemStatus(a.label, "Action triggered"); confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } }); }}
                              className={`p-4 rounded-xl bg-gradient-to-br ${a.color} to-transparent border border-black/5 dark:border-white/5 hover:shadow-lg transition-all text-left group`}>
                              <div className="p-2 rounded-lg bg-white/50 dark:bg-white/5 w-fit mb-2 group-hover:scale-110 transition-transform">
                                <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="text-xs font-bold text-foreground block">{a.label}</span>
                              <span className="text-[10px] text-muted-foreground mt-0.5 block">{a.desc}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "health" && <SystemHealthTab />}
              {activeTab === "intelligence" && <IntelligenceTab />}
              {activeTab === "sla" && <SLATab />}

              {activeTab === "complaints" && (
                <motion.div key="complaints" {...pageVariants} className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-foreground">Assignment Center</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search ID, title, dept..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 dark:focus:border-teal-500/50 transition-all w-48 md:w-56 shadow-sm" />
                      </div>
                      <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                        <Filter size={16} /> Filters
                      </button>
                    </div>
                  </div>

                  <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" className="space-y-3">
                    {filteredComplaints.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">No complaints match your search.</div>
                    )}
                    {filteredComplaints.map((item) => (
                      <motion.div key={item.id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                        whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
                        className="p-4 rounded-xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-black/60 transition-all flex flex-col md:flex-row justify-between items-center gap-4 group">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}
                            className={`p-3 rounded-xl border ${
                              item.priority === 'Critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                              item.priority === 'High' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                              item.priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                              'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                            }`}>
                            <AlertTriangle size={20} />
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                              <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Building2 size={12}/> {item.dept}</span>
                              <span className="flex items-center gap-1"><Clock size={12}/> {item.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                          {item.status === 'Resolved' && (
                            <button onClick={() => handleVerifyResolution(item.id, item.id.substring(0, 8).toUpperCase())}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all shadow-emerald-500/20">
                              Verify
                            </button>
                          )}
                          <PriorityBadge priority={item.priority} />
                          <StatusDropdown
                            current={item.status}
                            onChange={(s) => handleStatusChange(item.id, item.id.substring(0, 8).toUpperCase(), s)}
                          />
                          <OfficerAssignDropdown
                            officers={officers}
                            currentOfficerId={item.assigned_to ?? null}
                            currentOfficerName={item.assigned_name ?? null}
                            onAssign={(officerId) => handleAssign(item.id, item.id.substring(0, 8).toUpperCase(), officerId)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "departments" && (
                <motion.div key="departments" {...pageVariants} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">Department Workloads</h3>
                    <div className="flex gap-2">
                      <button onClick={loadDepartments} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={() => { setShowDeptForm(true); setEditingDeptId(null); setDeptFormName(""); setDeptFormDesc(""); }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/25">
                        + New Department
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showDeptForm && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="p-5 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-emerald-500/30 overflow-hidden">
                        <h4 className="text-sm font-bold text-foreground mb-3">{editingDeptId ? "Edit Department" : "New Department"}</h4>
                        <div className="flex gap-3 items-start flex-col sm:flex-row">
                          <div className="flex-1 space-y-2 w-full">
                            <input type="text" placeholder="Department name" value={deptFormName} onChange={e => setDeptFormName(e.target.value)}
                              className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-teal-500/50" />
                            <input type="text" placeholder="Description (optional)" value={deptFormDesc} onChange={e => setDeptFormDesc(e.target.value)}
                              className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-teal-500/50" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={async () => {
                              if (!deptFormName.trim()) return;
                              try {
                                if (editingDeptId) {
                                  await adminService.updateDepartment(editingDeptId, { name: deptFormName.trim(), description: deptFormDesc.trim() });
                                  toast.success("Department updated");
                                } else {
                                  await adminService.createDepartment(deptFormName.trim(), deptFormDesc.trim());
                                  toast.success("Department created");
                                }
                                setShowDeptForm(false);
                                loadDepartments();
                              } catch (err: any) { toast.error(err.message); }
                            }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-all">
                              {editingDeptId ? "Save" : "Create"}
                            </button>
                            <button onClick={() => setShowDeptForm(false)}
                              className="px-4 py-2 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 text-sm font-semibold rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-all">Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {loadingDepts ? (
                    <div className="p-12 text-center text-muted-foreground text-sm">Loading departments...</div>
                  ) : departments.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm">No departments yet. Create one to get started.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {departments.map((dept, i) => {
                        const caseCount = complaints.filter(c => c.dept.toLowerCase() === dept.name.toLowerCase()).length;
                        const maxCases = Math.max(1, ...departments.map(d => complaints.filter(c => c.dept.toLowerCase() === d.name.toLowerCase()).length));
                        const pct = Math.round((caseCount / maxCases) * 100);
                        const colors = [
                          { color: "bg-amber-500", gradient: "from-amber-500/20", iconColor: "text-amber-400" },
                          { color: "bg-teal-500", gradient: "from-teal-500/20", iconColor: "text-teal-400" },
                          { color: "bg-emerald-500", gradient: "from-emerald-500/20", iconColor: "text-emerald-400" },
                          { color: "bg-emerald-500", gradient: "from-emerald-500/20", iconColor: "text-emerald-400" },
                          { color: "bg-yellow-500", gradient: "from-yellow-500/20", iconColor: "text-yellow-400" },
                          { color: "bg-emerald-500", gradient: "from-emerald-500/20", iconColor: "text-emerald-400" },
                          { color: "bg-red-500", gradient: "from-red-500/20", iconColor: "text-red-400" },
                          { color: "bg-teal-500", gradient: "from-teal-500/20", iconColor: "text-teal-400" },
                        ][i % 8];
                        return (
                          <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -2 }}
                            className={`p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all bg-gradient-to-br ${colors.gradient} to-transparent ${!dept.is_active ? 'opacity-50' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${colors.color}/20 flex items-center justify-center ${colors.iconColor}`}>
                                  <Building2 size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-foreground">{dept.name}</h4>
                                  {dept.description && <p className="text-xs text-muted-foreground">{dept.description}</p>}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => {
                                  setEditingDeptId(dept.id); setDeptFormName(dept.name); setDeptFormDesc(dept.description); setShowDeptForm(true);
                                }} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all">
                                  <Settings size={14} />
                                </button>
                                <button onClick={() => setDeptDeleteTarget(dept)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Active Cases: <strong className="text-foreground">{caseCount}</strong></span>
                              <span className={`${dept.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>{dept.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                            <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-3">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                                className={`h-full rounded-full ${colors.color}`} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                              <span>Load: {pct}%</span>
                              <span className="font-mono">{caseCount} cases</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "users" && (
                <motion.div key="users" {...pageVariants} className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-foreground">User Management</h3>
                    <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                  <div className="rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
                    {loadingUsers ? (
                      <div className="p-12 text-center text-muted-foreground text-sm">Loading users...</div>
                    ) : users.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground text-sm">No users found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Email</th>
                              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Role</th>
                              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <UserRow key={u.id} user={u} onUpdate={loadUsers} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "map" && (
                <motion.div key="map" {...pageVariants} className="space-y-6 h-[600px] flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-foreground">GIS Analytics & Density Map</h3>
                    <div className="flex gap-2">
                      <motion.button whileHover={{ scale: 1.02 }} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-xs font-semibold">Heatmap Layer</motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-xs font-semibold">Markers</motion.button>
                    </div>
                  </div>
                  <div className="flex-grow rounded-2xl bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 relative overflow-hidden flex items-center justify-center">
                    <Map className="w-24 h-24 text-black/10 dark:text-white/5 absolute z-0" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-10 mix-blend-overlay z-0"></div>
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-[30%] left-[40%] w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.8)] z-10" />
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} className="absolute top-[50%] left-[60%] w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)] z-10" />
                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute top-[20%] left-[20%] w-6 h-6 bg-teal-500/60 rounded-full flex items-center justify-center border-2 border-teal-400 z-10 text-[8px] font-bold text-white">12</motion.div>
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }} className="absolute bottom-[30%] right-[25%] w-3 h-3 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10" />
                    <div className="z-20 p-6 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl max-w-sm text-center shadow-xl">
                      <h4 className="text-foreground font-bold mb-2">Map Engine Initialized</h4>
                      <p className="text-xs text-muted-foreground mb-4">Live connection to geospatial data streams active.</p>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors">Interact</motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "reports" && (
                <motion.div key="reports" {...pageVariants} className="space-y-6">
                  <h3 className="text-xl font-bold text-foreground mb-6">Report Generation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { icon: FileText, label: "Monthly PDF Report", desc: "Comprehensive governance report with charts.", color: "rose" },
                      { icon: Database, label: "Raw Data Export", desc: "Exports all compliant entries to CSV.", color: "emerald" },
                      { icon: Building2, label: "Department Audit", desc: "Performance summaries for all departments.", color: "violet" },
                    ].map((r, i) => {
                      const Icon = r.icon;
                      return (
                        <motion.div key={r.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                          whileHover={{ y: -4 }}
                          className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 flex flex-col items-center text-center hover:shadow-lg transition-all cursor-pointer group">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Icon size={28} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <h4 className="font-bold text-foreground mb-2">{r.label}</h4>
                          <p className="text-xs text-muted-foreground mb-6">{r.desc}</p>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold mt-auto border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                            <Download size={16} /> Generate
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === "audit" && (
                <motion.div key="audit" {...pageVariants} className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-foreground">Audit & Security Logs</h3>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"><Filter size={14} /> Filter</button>
                      <button className="px-3 py-1.5 bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"><Download size={14} /> Export</button>
                    </div>
                  </div>
                  <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/10 dark:border-white/10 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Timestamp</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Actor</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Action</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Target</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {[
                          { time: "2026-07-01 14:32:01", actor: "System Admin (ID: 99)", action: "ROLE_CHANGE (CITIZEN → OFFICER)", target: "User: Sarah Connor", ip: "192.168.1.42" },
                          { time: "2026-07-01 12:15:44", actor: "Officer Ramesh (ID: 45)", action: "STATUS_UPDATE (In Progress → Resolved)", target: "Complaint: C-8840", ip: "10.0.4.15" },
                          { time: "2026-07-01 10:05:12", actor: "Citizen John (ID: 102)", action: "COMPLAINT_CREATED", target: "Complaint: C-8841", ip: "203.0.113.88" },
                          { time: "2026-06-30 09:22:10", actor: "System Admin (ID: 99)", action: "DEPT_CREATED", target: "Department: Forestry", ip: "192.168.1.42" }
                        ].map((log, i) => (
                          <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.time}</td>
                            <td className="px-4 py-3 font-semibold text-foreground">{log.actor}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-muted-foreground border border-black/10 dark:border-white/20">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-foreground">{log.target}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{log.ip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "broadcast" && (
                <motion.div key="broadcast" {...pageVariants} className="space-y-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Emergency Broadcast System</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-rose-500/20 shadow-lg">
                      <h4 className="font-bold text-rose-500 mb-4 flex items-center gap-2"><ShieldAlert size={18} /> Compose Priority Alert</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground mb-1">Target Audience</label>
                          <select className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500/50">
                            <option>All Registered Citizens (Citywide)</option>
                            <option>Specific Zip Codes</option>
                            <option>Officers Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground mb-1">Alert Title</label>
                          <input type="text" placeholder="e.g., Boil Water Advisory" className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500/50" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground mb-1">Message Body</label>
                          <textarea rows={4} placeholder="Details of the emergency..." className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500/50 resize-none" />
                        </div>
                        <div className="flex gap-4 items-center">
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input type="checkbox" className="rounded text-rose-500" defaultChecked /> Push Notification
                          </label>
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input type="checkbox" className="rounded text-rose-500" defaultChecked /> SMS
                          </label>
                        </div>
                        <button onClick={() => toast.success("Broadcast sent to 45,210 citizens.")} className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20">
                          Deploy Broadcast
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-foreground">Recent Broadcasts</h4>
                      {[
                        { title: "Severe Weather Warning", date: "June 25, 2026", reach: "42K Deliveries" },
                        { title: "Main St. Gas Leak", date: "June 12, 2026", reach: "8.5K Deliveries (Zip 10001)" }
                      ].map((b, i) => (
                        <div key={i} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-all">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="font-bold text-sm text-foreground">{b.title}</h5>
                            <span className="text-xs text-muted-foreground">{b.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{b.reach}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "budget" && (
                <motion.div key="budget" {...pageVariants} className="space-y-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Budget & Resource Allocation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:shadow-lg transition-all">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Annual Budget</p>
                      <h4 className="text-2xl font-bold text-foreground">$4.5M</h4>
                    </div>
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:shadow-lg transition-all">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Expended (YTD)</p>
                      <h4 className="text-2xl font-bold text-foreground">$2.1M</h4>
                    </div>
                    <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20 hover:shadow-lg transition-all">
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Active Heavy Equipment</p>
                      <h4 className="text-2xl font-bold text-foreground">42 / 50</h4>
                    </div>
                  </div>
                  <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm rounded-2xl p-6 hover:shadow-lg transition-all">
                    <h4 className="font-bold text-foreground mb-4">Department Cost Breakdown (Estimated)</h4>
                    <div className="space-y-4">
                      {[
                        { dept: "Public Works (Roads)", cost: "$1.2M", percent: "60%" },
                        { dept: "Water & Sanitation", cost: "$600K", percent: "30%" },
                        { dept: "Electrical", cost: "$300K", percent: "15%" },
                      ].map((d, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm font-semibold mb-1">
                            <span className="text-foreground">{d.dept}</span>
                            <span className="text-muted-foreground">{d.cost}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: d.percent }}
                              transition={{ duration: 1, delay: i * 0.15 }}
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div key="settings" {...pageVariants} className="space-y-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">System Settings & Configuration</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm">
                        <h4 className="font-bold text-foreground border-b border-black/5 dark:border-white/5 pb-3 mb-4">Core Constants</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-1">Global SLA Target (Hours)</label>
                            <input type="number" defaultValue={48} className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-1">Auto-Escalation Threshold (Hours pending)</label>
                            <input type="number" defaultValue={72} className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm">
                        <h4 className="font-bold text-foreground border-b border-black/5 dark:border-white/5 pb-3 mb-4">API Integrations</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-1">Twilio SMS Gateway Key</label>
                            <input type="password" defaultValue="************************" className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-1">SendGrid Email API</label>
                            <input type="password" defaultValue="************************" className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                          </div>
                        </div>
                        <button onClick={() => toast.success("Settings Saved")} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all">Save Changes</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deptDeleteTarget !== null}
        title="Delete Department"
        message={`Are you sure you want to delete "${deptDeleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (!deptDeleteTarget) return;
          try { await adminService.deleteDepartment(deptDeleteTarget.id); toast.success("Department deleted"); loadDepartments(); }
          catch (err: any) { toast.error(err.message); }
          finally { setDeptDeleteTarget(null); }
        }}
        onCancel={() => setDeptDeleteTarget(null)}
      />
      <Footer />
    </main>
  );
}

export default withRoleGuard(AdminDashboard, ['ADMIN']);
