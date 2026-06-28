"use client";

import { withRoleGuard } from "@/middleware/roleGuard";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Users, FileText, Map, Settings, AlertTriangle, 
  CheckCircle, FolderOpen, Activity, Clock, Bell,
  LogOut, Download, Filter, Search, Database,
  TrendingUp, Zap, Shield, BarChart3, RefreshCw, ChevronDown, Trash2
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
import ConfirmModal from "@/components/ui/ConfirmModal";

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
  { name: 'Roads Dept', efficiency: 72, fill: '#f59e0b' },
  { name: 'Drainage Dept', efficiency: 58, fill: '#06b6d4' },
  { name: 'Sanitation', efficiency: 85, fill: '#10b981' },
  { name: 'Water Works', efficiency: 91, fill: '#3b82f6' },
  { name: 'Electrical Dept', efficiency: 63, fill: '#eab308' },
  { name: 'Power Distribution', efficiency: 78, fill: '#f97316' },
  { name: 'Public Safety', efficiency: 45, fill: '#ef4444' },
  { name: 'Traffic Management', efficiency: 55, fill: '#a855f7' },
];

const priorityData = [
  { name: 'Critical', value: 120, color: '#ef4444' },
  { name: 'High', value: 280, color: '#f97316' },
  { name: 'Medium', value: 450, color: '#eab308' },
  { name: 'Low', value: 392, color: '#10b981' },
];

const deptCards = [
  { name: "Roads Dept", officerCount: 42, activeCases: 156, color: "bg-amber-500", gradient: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-400" },
  { name: "Drainage Dept", officerCount: 28, activeCases: 89, color: "bg-cyan-500", gradient: "from-cyan-500/20 to-cyan-600/5", iconColor: "text-cyan-400" },
  { name: "Sanitation", officerCount: 85, activeCases: 312, color: "bg-emerald-500", gradient: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400" },
  { name: "Water Works", officerCount: 35, activeCases: 67, color: "bg-blue-500", gradient: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400" },
  { name: "Electrical Dept", officerCount: 22, activeCases: 53, color: "bg-yellow-500", gradient: "from-yellow-500/20 to-yellow-600/5", iconColor: "text-yellow-400" },
  { name: "Power Distribution", officerCount: 18, activeCases: 41, color: "bg-orange-500", gradient: "from-orange-500/20 to-orange-600/5", iconColor: "text-orange-400" },
  { name: "Public Safety", officerCount: 15, activeCases: 38, color: "bg-red-500", gradient: "from-red-500/20 to-red-600/5", iconColor: "text-red-400" },
  { name: "Traffic Management", officerCount: 30, activeCases: 84, color: "bg-purple-500", gradient: "from-purple-500/20 to-purple-600/5", iconColor: "text-purple-400" },
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

function PieChartCard() {
  return (
    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10">
      <h4 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4">Priority Distribution</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
            animationBegin={0} animationDuration={1500}>
            {priorityData.map((e, i) => <Cell key={i} fill={e.color} stroke={e.color} strokeOpacity={0.5} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#000', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {priorityData.map((p) => (
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
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
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
              user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
              user.role === 'OFFICER' ? 'bg-cyan-500/20 text-cyan-400' :
              'bg-blue-500/20 text-blue-400'
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
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "departments" | "users" | "map" | "reports">("overview");
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

  useEffect(() => { loadComplaints(); }, []);

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

  return (
    <main className="bg-transparent text-slate-900 dark:text-white min-h-screen pt-24 pb-24 relative overflow-hidden flex flex-col justify-between selection:bg-orange-500/20 dark:selection:bg-white/20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasRevealEffect animationSpeed={3} containerClassName="bg-transparent" colors={[[168, 85, 247]]} dotSize={6} reverse={false} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,_transparent_100%)] opacity-20" />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px]" />
      </div>
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-purple-500/10 blur-[150px] left-[-10%] top-[20%] pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-amber-500/10 blur-[150px] right-[5%] bottom-[-10%] pointer-events-none z-0" />

      <div className="container mx-auto px-6 relative z-10 flex-grow w-full max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-black/10 dark:border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600 dark:text-purple-500">Operations Center</span>
              <PulseDot color="bg-emerald-500" />
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              City <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 dark:from-purple-400 dark:to-indigo-500">Admin</span> Console
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {liveTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {liveTime.toLocaleTimeString('en-IN')}
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex gap-3">
            <button onClick={() => { showAIFuturistic("High", "Water Department", "92%"); }} className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm border border-black/10 dark:bg-white/5 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-sm font-semibold">
              <Zap className="w-4 h-4 text-orange-500 dark:text-purple-400" /> AI Insights
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm border border-black/10 dark:bg-white/5 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-sm font-semibold">
              <Bell className="w-4 h-4 text-orange-500 dark:text-purple-400" />
              <span className="relative">Alerts<span className="absolute -top-2 -right-3 w-4 h-4 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">3</span></span>
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all text-sm font-semibold">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            {[
              { id: "overview", icon: Activity, label: "Dashboard Overview" },
              { id: "complaints", icon: FolderOpen, label: "Assignment Center" },
              { id: "departments", icon: Building2, label: "Department Mgmt" },
              { id: "users", icon: Users, label: "User Management" },
              { id: "map", icon: Map, label: "GIS Analytics" },
              { id: "reports", icon: FileText, label: "Reports & Exports" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl border transition-all text-left ${
                    isActive
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-600 shadow-[0_4px_20px_rgba(249,115,22,0.15)] dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400"
                      : "bg-transparent border-transparent text-slate-500 dark:text-white/50 hover:bg-white dark:hover:bg-white/[0.02] hover:text-slate-900 dark:hover:text-white/80"
                  }`}>
                  <Icon className="w-4 h-4" /> {tab.label}
                  {tab.id === "complaints" && <span className="ml-auto text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full">{complaints.length}</span>}
                </button>
              );
            })}
          </div>

          {/* Main */}
          <div className="lg:col-span-9 min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {/* KPI Cards */}
                  <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: FileText, label: "Total Complaints", value: 12402, suffix: "", color: "text-slate-900 dark:text-white", bg: "bg-white/70 dark:bg-black/50", accent: "text-slate-900/5 dark:text-white/5" },
                      { icon: AlertTriangle, label: "Open", value: 1240, suffix: "", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/5", accent: "text-amber-500/10" },
                      { icon: CheckCircle, label: "Closed", value: 10850, suffix: "", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/5", accent: "text-emerald-500/10" },
                      { icon: TrendingUp, label: "Resolution Rate", value: 87, suffix: "%", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/5", accent: "text-cyan-500/10" },
                    ].map((kpi) => {
                      const Icon = kpi.icon;
                      return (
                        <motion.div key={kpi.label} variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                          className={`p-5 rounded-2xl ${kpi.bg} backdrop-blur-xl border border-black/10 dark:border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default`}>
                          <Icon className={`absolute top-4 right-4 w-12 h-12 ${kpi.accent} group-hover:scale-110 transition-transform`} />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block relative z-10">{kpi.label}</span>
                          <h3 className={`text-3xl font-bold ${kpi.color} mt-2 relative z-10`}>
                            <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                          </h3>
                          <span className="text-[10px] text-emerald-500 mt-1 block relative z-10 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +{Math.floor(kpi.value * 0.08)} this month
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Complaint Trends */}
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 h-80">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-500" /> Daily Complaint Trends
                      </h4>
                      <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={complaintTrends}>
                          <defs>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.15} vertical={false} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid #ffffff20', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                          <Area type="monotone" dataKey="new" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNew)" dot={false} />
                          <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Priority Pie */}
                    <PieChartCard />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dept Efficiency */}
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-500" /> Department Efficiency Score
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={deptPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.15} horizontal={false} />
                          <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={90} />
                          <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ background: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }} formatter={(v: any) => [`${v ?? 0}%`, 'Efficiency']} />
                          <Bar dataKey="efficiency" radius={[0, 4, 4, 0]} animationDuration={1500}>
                            {deptPerformance.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "New Department", icon: Building2, color: "from-purple-500/20 to-purple-600/5 text-purple-400" },
                          { label: "Generate Report", icon: FileText, color: "from-rose-500/20 to-rose-600/5 text-rose-400" },
                          { label: "Assign Officers", icon: Users, color: "from-cyan-500/20 to-cyan-600/5 text-cyan-400" },
                          { label: "Sync Data", icon: RefreshCw, color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400" },
                        ].map((a) => {
                          const Icon = a.icon;
                          return (
                            <motion.button key={a.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={() => { showSystemStatus(a.label, "Action triggered"); confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } }); }}
                              className={`p-4 rounded-xl bg-gradient-to-br ${a.color} border border-white/10 hover:shadow-lg transition-all text-left`}>
                              <Icon className="w-6 h-6 mb-2" />
                              <span className="text-xs font-semibold text-foreground">{a.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "complaints" && (
                <motion.div key="complaints" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assignment Center</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 dark:text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search ID, title, dept..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500/50 dark:focus:border-purple-500/50 transition-all w-56 shadow-sm" />
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
                        className="p-4 rounded-xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/60 transition-all flex flex-col md:flex-row justify-between items-center gap-4 group hover:shadow-md hover:scale-[1.005]">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}
                            className={`p-3 rounded-xl border ${
                              item.priority === 'Critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                              item.priority === 'High' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                              item.priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                              'bg-blue-500/10 border-blue-500/30 text-blue-500'
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
                <motion.div key="departments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Department Workloads</h3>
                    <div className="flex gap-2">
                      <button onClick={loadDepartments} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={() => { setShowDeptForm(true); setEditingDeptId(null); setDeptFormName(""); setDeptFormDesc(""); }}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25">
                        + New Department
                      </button>
                    </div>
                  </div>

                  {/* Create / Edit Form */}
                  <AnimatePresence>
                    {showDeptForm && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="p-5 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-purple-500/30 overflow-hidden">
                        <h4 className="text-sm font-bold text-foreground mb-3">{editingDeptId ? "Edit Department" : "New Department"}</h4>
                        <div className="flex gap-3 items-start">
                          <div className="flex-1 space-y-2">
                            <input type="text" placeholder="Department name" value={deptFormName} onChange={e => setDeptFormName(e.target.value)}
                              className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500/50" />
                            <input type="text" placeholder="Description (optional)" value={deptFormDesc} onChange={e => setDeptFormDesc(e.target.value)}
                              className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500/50" />
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
                            }} className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold rounded-lg transition-all">
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
                          { color: "bg-amber-500", gradient: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-400" },
                          { color: "bg-cyan-500", gradient: "from-cyan-500/20 to-cyan-600/5", iconColor: "text-cyan-400" },
                          { color: "bg-emerald-500", gradient: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400" },
                          { color: "bg-blue-500", gradient: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400" },
                          { color: "bg-yellow-500", gradient: "from-yellow-500/20 to-yellow-600/5", iconColor: "text-yellow-400" },
                          { color: "bg-orange-500", gradient: "from-orange-500/20 to-orange-600/5", iconColor: "text-orange-400" },
                          { color: "bg-red-500", gradient: "from-red-500/20 to-red-600/5", iconColor: "text-red-400" },
                          { color: "bg-purple-500", gradient: "from-purple-500/20 to-purple-600/5", iconColor: "text-purple-400" },
                        ][i % 8];
                        return (
                          <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                            className={`p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all bg-gradient-to-br ${colors.gradient} ${!dept.is_active ? 'opacity-50' : ''}`}>
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
                <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h3>
                    <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                  <div className="rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 overflow-hidden">
                    {loadingUsers ? (
                      <div className="p-12 text-center text-muted-foreground text-sm">Loading users...</div>
                    ) : users.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground text-sm">No users found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
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
                <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 h-[600px] flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">GIS Analytics & Density Map</h3>
                    <div className="flex gap-2">
                      <motion.button whileHover={{ scale: 1.02 }} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-xs">Heatmap Layer</motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded text-xs">Markers</motion.button>
                    </div>
                  </div>
                  <div className="flex-grow rounded-2xl bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 relative overflow-hidden flex items-center justify-center">
                    <Map className="w-24 h-24 text-black/10 dark:text-white/5 absolute z-0" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-10 mix-blend-overlay z-0"></div>
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-[30%] left-[40%] w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.8)] z-10" />
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} className="absolute top-[50%] left-[60%] w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)] z-10" />
                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute top-[20%] left-[20%] w-6 h-6 bg-cyan-500/60 rounded-full flex items-center justify-center border-2 border-cyan-400 z-10 text-[8px] font-bold text-white">12</motion.div>
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }} className="absolute bottom-[30%] right-[25%] w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10" />
                    <div className="z-20 p-6 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl max-w-sm text-center shadow-xl">
                      <h4 className="text-foreground font-bold mb-2">Map Engine Initialized</h4>
                      <p className="text-xs text-muted-foreground mb-4">Live connection to geospatial data streams active.</p>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-400 transition-colors">Interact</motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "reports" && (
                <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Report Generation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { icon: FileText, label: "Monthly PDF Report", desc: "Comprehensive governance report with charts.", color: "rose" },
                      { icon: Database, label: "Raw Data Export", desc: "Exports all compliant entries to CSV.", color: "emerald" },
                      { icon: Building2, label: "Department Audit", desc: "Performance summaries for all departments.", color: "blue" },
                    ].map((r, i) => {
                      const Icon = r.icon;
                      return (
                        <motion.div key={r.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className="p-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 flex flex-col items-center text-center hover:bg-white/80 dark:hover:bg-black/60 transition-all cursor-pointer group">
                          <div className={`w-16 h-16 rounded-full bg-${r.color}-500/10 text-${r.color}-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon size={28} />
                          </div>
                          <h4 className="font-bold text-foreground mb-2">{r.label}</h4>
                          <p className="text-xs text-muted-foreground mb-6">{r.desc}</p>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-4 py-2 bg-${r.color}-50 dark:bg-${r.color}-500/20 text-${r.color}-600 dark:text-${r.color}-400 rounded-lg text-sm font-bold mt-auto border border-${r.color}-200 dark:border-${r.color}-500/30`}>
                            <Download size={16} /> Generate
                          </motion.button>
                        </motion.div>
                      );
                    })}
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
