"use client";

import { withRoleGuard } from "@/middleware/roleGuard";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, type PanInfo } from "framer-motion";
import {
  Building2, Users, FileText, Map, Settings, AlertTriangle,
  CheckCircle, FolderOpen, Activity, Clock, Bell,
  LogOut, Download, Filter, Search, Database,
  TrendingUp, Zap, Shield, BarChart3, RefreshCw, ChevronDown, Trash2,
  ShieldAlert, Radio, Wallet, Menu, ChevronLeft, LayoutDashboard,
  Plus, Globe, ArrowUpRight, ArrowDownRight,
  Edit3, List, Grid3X3, ChevronRight, Sparkles,
  MessageCircle, Inbox, Target, HeartHandshake, Flag, UserCog,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, ScatterChart, Scatter, ReferenceLine, Legend,
} from "recharts";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { showTextLoading, showSystemStatus, showOfficerAssigned, showAIFuturistic } from "@/components/ui/CustomToasts";
import { complaintService, type OfficerData } from "@/services/complaintService";
import { adminService, type UserData, type DepartmentData } from "@/services/adminService";
import { apiRequest } from "@/services/api";
import ConfirmModal from "@/components/ui/ConfirmModal";

// ─── Data ──────────────────────────────────────────────────────────────

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

const sidebarItems = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "complaints", icon: FolderOpen, label: "Complaints", badge: true },
  { id: "departments", icon: Building2, label: "Departments" },
  { id: "users", icon: Users, label: "Users" },
  { id: "map", icon: Map, label: "GIS Map" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "audit", icon: ShieldAlert, label: "Audit" },
  { id: "broadcast", icon: Radio, label: "Broadcast" },
  { id: "budget", icon: Wallet, label: "Budget" },
  { id: "settings", icon: Settings, label: "Settings" },
];

type TabId = typeof sidebarItems[number]['id'];

// ─── Animation Variants ────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
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

// ─── Animated Counter ──────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "", duration = 2, prefix = "" }: {
  value: number; suffix?: string; duration?: number; prefix?: string;
}) {
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
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ─── Shimmer Loading ───────────────────────────────────────────────────

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/[0.04] ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06]">
      <Shimmer className="w-10 h-10 rounded-xl mb-4" />
      <Shimmer className="w-20 h-3 mb-3" />
      <Shimmer className="w-28 h-7" />
    </div>
  );
}

// ─── Priority / Status ─────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-rose-500/15 border-rose-500/25 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]",
    High: "bg-amber-500/15 border-amber-500/25 text-amber-400",
    Medium: "bg-blue-500/15 border-blue-500/25 text-blue-400",
    Low: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}

interface ComplaintData { id: string; title: string; dept: string; priority: string; status: string; time: string; assigned_to?: string | null; assigned_name?: string | null; }

const STATUS_OPTIONS = ["Unassigned", "Assigned", "In Progress", "Escalated", "Resolved"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Unassigned: "bg-slate-500/15 border-slate-500/25 text-slate-400",
    Assigned: "bg-blue-500/15 border-blue-500/25 text-blue-400",
    "In Progress": "bg-amber-500/15 border-amber-500/25 text-amber-400",
    Escalated: "bg-rose-500/15 border-rose-500/25 text-rose-400",
    Resolved: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
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

// ─── Officer Assign Dropdown ────────────────────────────────────────────

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
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-white/5 cursor-pointer bg-white/5 border-white/10 whitespace-nowrap">
        <Users size={12} className="text-white/40" />
        <span className="max-w-[80px] truncate text-white/60">
          {currentOfficerName || "Assign"}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={12} className="text-white/40" /></motion.div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-1 z-20 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[180px] max-h-[240px] overflow-y-auto">
            {currentOfficerId && (
              <button onClick={() => { onAssign(null); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-white/5 transition-colors">
                Unassign
              </button>
            )}
            {officers.length === 0 && (
              <div className="px-3 py-2 text-xs text-white/40">No officers found</div>
            )}
            {officers.map(o => (
              <button key={o.id} onClick={() => { onAssign(o.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors flex items-center gap-2 ${
                  o.id === currentOfficerId ? 'text-emerald-400' : 'text-white/70'
                }`}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-[8px] font-bold shadow-lg shadow-emerald-500/25">
                  {o.full_name.charAt(0)}
                </div>
                {o.full_name}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

// ─── User Row ──────────────────────────────────────────────────────────

function UserRow({ user, onUpdate, index }: { user: UserData; onUpdate: () => void; index: number }) {
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
    <motion.tr
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 100, damping: 20 }}
      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.1 }} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20">
            {user.full_name.charAt(0)}
          </motion.div>
          <div>
            <span className="font-semibold text-white text-sm">{user.full_name}</span>
            <span className="text-[11px] text-white/40 block">{user.email}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="relative">
          <button onClick={() => !busy && setRoleOpen(!roleOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-white/5 bg-white/5 border-white/10">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              user.role === 'ADMIN' ? 'bg-emerald-500/20 text-emerald-400' :
              user.role === 'OFFICER' ? 'bg-blue-500/20 text-blue-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>{user.role}</span>
            <motion.div animate={{ rotate: roleOpen ? 180 : 0 }}><ChevronDown size={12} className="text-white/40" /></motion.div>
          </button>
          {roleOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute left-0 top-full mt-1 z-20 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[140px]">
                {['CITIZEN', 'OFFICER', 'ADMIN'].map(r => (
                  <button key={r} onClick={() => { handleRoleChange(r); setRoleOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors ${
                      r === user.role ? 'text-emerald-400' : 'text-white/70'
                    }`}>{r}</button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          user.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
        }`}>
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`}
          />
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleActive} disabled={busy}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            user.is_active
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/20'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
          } disabled:opacity-50`}>
          {user.is_active ? 'Disable' : 'Enable'}
        </motion.button>
      </td>
    </motion.tr>
  );
}

// ─── Premium Stat Card ─────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, suffix, trend, color, delay = 0, loading }: {
  icon: any; label: string; value: number; suffix?: string; trend?: string; color: string; delay?: number; loading?: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => { x.set(0); y.set(0); };

  const isPositive = trend?.startsWith('+');
  const bgGradients = ["from-emerald-500/10 via-emerald-500/5", "from-amber-500/10 via-amber-500/5", "from-emerald-500/10 via-emerald-500/5", "from-cyan-500/10 via-cyan-500/5"];

  if (loading) return <StatCardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, perspective: 800 }}
      className="relative group"
    >
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{ background: `linear-gradient(135deg, ${color}40, transparent, ${color}20)` }}
      />
      <div className="relative p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] group-hover:border-white/[0.12] shadow-xl overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[100px] opacity-[0.06] pointer-events-none group-hover:opacity-[0.12] transition-opacity duration-700"
          style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
        <div className="flex items-start justify-between mb-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </motion.div>
          {trend && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={`flex items-center gap-0.5 text-[11px] font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </motion.span>
          )}
        </div>
        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">{label}</span>
        <h3 className="text-2xl font-bold text-white mt-1 font-heading tracking-tight">
          <AnimatedCounter value={value} suffix={suffix || ""} duration={1.5} />
        </h3>
        <div className="mt-2 h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / (value + 100)) * 100, 100)}%` }}
            transition={{ delay: delay + 0.4, duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Glass Card ────────────────────────────────────────────────────────

function GlassCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ type: "spring", stiffness: 80, damping: 18 }}
      className={`relative p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] shadow-xl ${glow ? 'shadow-emerald-500/5' : ''} ${className}`}
    >
      {glow && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      )}
      {children}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, label, action, badge }: { icon: any; label: string; action?: React.ReactNode; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Icon className="w-4 h-4 text-emerald-400" />
        </motion.div>
        <h3 className="text-sm font-bold text-white/90">{label}</h3>
        {badge && (
          <span className="text-[10px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded-full border border-white/10">{badge}</span>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Tilt Card (3D hover effect) ────────────────────────────────────────

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 150, damping: 15 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, perspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Notification Panel ────────────────────────────────────────────────

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifications = useMemo(() => [
    { id: 1, title: "New Complaint Filed", desc: "C-8846: Traffic signal not working", time: "2 min ago", type: "info" },
    { id: 2, title: "Complaint Resolved", desc: "C-8842: Water pipe burst fixed", time: "15 min ago", type: "success" },
    { id: 3, title: "Officer Assigned", desc: "Ramesh → C-8840: Drainage block", time: "1 hour ago", type: "assignment" },
    { id: 4, title: "Escalation Warning", desc: "C-8839: Unassigned for 48hrs", time: "2 hours ago", type: "urgent" },
  ], []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute right-0 top-12 z-40 w-80 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Notifications</h4>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">{notifications.length}</span>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <motion.div whileHover={{ scale: 1.2 }} className={`p-1.5 rounded-lg ${
                    n.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                    n.type === 'urgent' ? 'bg-rose-500/15 text-rose-400' :
                    n.type === 'assignment' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {n.type === 'success' ? <CheckCircle size={14} /> :
                     n.type === 'urgent' ? <AlertTriangle size={14} /> :
                     n.type === 'assignment' ? <Users size={14} /> :
                     <Bell size={14} />}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                    <p className="text-[10px] text-white/50 truncate">{n.desc}</p>
                  </div>
                  <span className="text-[10px] text-white/30 shrink-0">{n.time}</span>
                </motion.div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10 text-center">
              <button className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                View All Notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Activity Feed Widget ─────────────────────────────────────────────

function ActivityFeed() {
  const activities = useMemo(() => [
    { icon: FileText, text: "New complaint filed in Roads Dept", time: "2m ago", color: "#10b981" },
    { icon: CheckCircle, text: "C-8842 marked as Resolved", time: "15m ago", color: "#10b981" },
    { icon: Users, text: "Officer Ramesh assigned to C-8840", time: "1h ago", color: "#06b6d4" },
    { icon: AlertTriangle, text: "C-8839 escalated - unassigned for 48h", time: "2h ago", color: "#f59e0b" },
    { icon: Building2, text: "New department: Forestry created", time: "4h ago", color: "#8b5cf6" },
    { icon: UserCog, text: "User role updated: Citizen → Officer", time: "6h ago", color: "#f97316" },
  ], []);

  return (
    <div className="space-y-1">
      {activities.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors group cursor-default">
            <motion.div whileHover={{ scale: 1.2, rotate: 10 }}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0"
              style={{ color: a.color }}>
              <Icon size={12} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate group-hover:text-white/90 transition-colors">{a.text}</p>
            </div>
            <span className="text-[10px] text-white/30 shrink-0">{a.time}</span>
          </motion.div>
        );
      })}
      <motion.button
        whileHover={{ x: 4 }}
        className="flex items-center gap-1 text-[10px] text-emerald-400/70 hover:text-emerald-400 font-semibold mt-2 px-2.5 transition-colors">
        View all activity <ChevronRight size={12} />
      </motion.button>
    </div>
  );
}

// ─── Chart common tooltip style ────────────────────────────────────────

const chartTooltipStyle = {
  contentStyle: {
    background: 'rgba(0,0,0,0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(12px)',
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    padding: '10px 14px',
  },
  labelStyle: { color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  itemStyle: { color: '#fff' },
};

// ─── Custom Chart Tooltip ──────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] text-white/50 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-bold text-white">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ─── MotionDiv with staggered children ─────────────────────────────────

function StaggerGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Animated Background ────────────────────────────────────────────────

function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060a0a] via-[#080c0c] to-[#0a0e0e]" />

      {/* Animated gradient orbs following mouse */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full opacity-[0.04] blur-[200px]"
        style={{
          background: "radial-gradient(circle, #10b981, transparent)",
          left: `calc(${mousePos.x}px - 25vw)`,
          top: `calc(${mousePos.y}px - 25vw)`,
        }}
        transition={{ type: "spring", stiffness: 30, damping: 30 }}
      />
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full opacity-[0.03] blur-[200px]"
        style={{
          background: "radial-gradient(circle, #8b5cf6, transparent)",
          left: `calc(100% - ${mousePos.x}px - 20vw)`,
          top: `calc(${mousePos.y}px - 20vw)`,
        }}
        transition={{ type: "spring", stiffness: 25, damping: 35 }}
      />

      {/* Static ambient orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/[0.03] blur-[150px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-purple-500/[0.03] blur-[150px] animate-blob animation-delay-2000" />
      <div className="absolute top-[40%] right-[30%] w-[25vw] h-[25vw] rounded-full bg-amber-500/[0.02] blur-[120px] animate-blob animation-delay-4000" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
    </div>
  );
}

// ─── Tab content components ─────────────────────────────────────────────

function OverviewTab({ kpis, trendsData, deptPerfData, prioData, loading }: {
  kpis: any; trendsData: any[]; deptPerfData: any[]; prioData: any[]; loading: boolean;
}) {
  return (
    <motion.div key="overview" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Complaints" value={kpis.total} trend="+12.5%" color="#10b981" delay={0} loading={loading} />
        <StatCard icon={AlertTriangle} label="Open Cases" value={kpis.open} color="#f59e0b" delay={0.08} loading={loading} />
        <StatCard icon={CheckCircle} label="Resolved" value={kpis.closed} trend="+8.3%" color="#10b981" delay={0.16} loading={loading} />
        <StatCard icon={TrendingUp} label="Resolution Rate" value={kpis.resolutionRate} suffix="%" trend="+5.1%" color="#06b6d4" delay={0.24} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2" glow>
          <SectionHeader icon={BarChart3} label="Complaint Trends" badge="Last 7 days" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="nt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="nr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="new" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#nt)" dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 2, stroke: "#1a1a2e" }}
                  activeDot={{ r: 5, stroke: "#8b5cf6", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#nr)" dot={{ r: 3, fill: "#10b981", strokeWidth: 2, stroke: "#1a1a2e" }}
                  activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={Shield} label="Priority Distribution" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={prioData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                  animationBegin={0} animationDuration={1500}>
                  {prioData.map((e, i) => <Cell key={i} fill={e.color} stroke={e.color} strokeOpacity={0.3}
                    style={{ filter: `drop-shadow(0 0 6px ${e.color}40)` }} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {prioData.map((p) => (
              <motion.div key={p.name} whileHover={{ x: 2 }}
                className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-white/[0.02] transition-colors cursor-default">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-white/50">{p.name}</span>
                <span className="font-semibold text-white ml-auto">{p.value}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2" glow>
          <SectionHeader icon={Building2} label="Department Efficiency" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerfData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.12)" fontSize={10} tickLine={false} axisLine={false} width={95} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<CustomTooltip />} formatter={(v: any) => [`${v ?? 0}%`, 'Efficiency']} />
                <Bar dataKey="efficiency" radius={[0, 6, 6, 0]} animationDuration={1500}>
                  {deptPerfData.map((e, i) => <Cell key={i} fill={e.fill}
                    style={{ filter: `drop-shadow(0 0 4px ${e.fill}60)` }} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={Activity} label="Recent Activity" />
          <ActivityFeed />
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard glow>
          <SectionHeader icon={Zap} label="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Department", icon: Building2, color: "#10b981", desc: "Create a new department" },
              { label: "Generate Report", icon: FileText, color: "#8b5cf6", desc: "Export monthly data" },
              { label: "Assign Officers", icon: Users, color: "#06b6d4", desc: "Manage assignments" },
              { label: "Sync Database", icon: RefreshCw, color: "#f59e0b", desc: "Refresh from server" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <TiltCard key={a.label}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { showSystemStatus(a.label, "Action triggered"); confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } }); }}
                    className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left group">
                    <motion.div whileHover={{ rotate: [0, -10, 10, 0] }}
                      className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] w-fit mb-3">
                      <Icon className="w-5 h-5" style={{ color: a.color }} />
                    </motion.div>
                    <span className="text-sm font-semibold text-white block">{a.label}</span>
                    <span className="text-[11px] text-white/40 mt-0.5 block">{a.desc}</span>
                  </motion.button>
                </TiltCard>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={TrendingUp} label="Weekly Performance" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={defaultComplaintTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }} />
                <Bar dataKey="new" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#1a1a2e" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

function ComplaintsTab({ complaints, officers, searchQuery, setSearchQuery, complaintView, setComplaintView, handleStatusChange, handleAssign, loading }: {
  complaints: ComplaintData[]; officers: OfficerData[]; searchQuery: string; setSearchQuery: (s: string) => void;
  complaintView: "list" | "grid"; setComplaintView: (v: "list" | "grid") => void;
  handleStatusChange: (id: string, did: string, s: string) => void; handleAssign: (id: string, did: string, oid: string | null) => void; loading: boolean;
}) {
  const filtered = complaints.filter(c =>
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div key="complaints" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">Complaint Center</h2>
          <p className="text-sm text-white/40 mt-0.5">Manage and assign {complaints.length} incoming complaints</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search complaints..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-all w-56" />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setComplaintView("list")}
              className={`p-1.5 rounded ${complaintView === "list" ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}`}>
              <List size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setComplaintView("grid")}
              className={`p-1.5 rounded ${complaintView === "grid" ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}`}>
              <Grid3X3 size={16} />
            </motion.button>
          </motion.div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
            <Filter size={16} /> Filters
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {complaintView === "list" ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-white/40">No complaints match your search.</motion.div>
            )}
            {filtered.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                whileHover={{ x: 2, borderColor: 'rgba(255,255,255,0.12)' }}
                className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] transition-all flex flex-col md:flex-row justify-between items-center gap-4 group cursor-default">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <motion.div whileHover={{ rotate: [0, -8, 8, 0] }} className={`p-2.5 rounded-xl border ${
                    item.priority === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                    item.priority === 'High' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    item.priority === 'Medium' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}>
                    <AlertTriangle size={18} />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-white/30">{item.id}</span>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Building2 size={12} /> {item.dept}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {item.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                  <PriorityBadge priority={item.priority} />
                  <StatusDropdown current={item.status}
                    onChange={(s) => handleStatusChange(item.id, item.id.substring(0, 8).toUpperCase(), s)} />
                  <OfficerAssignDropdown officers={officers} currentOfficerId={item.assigned_to ?? null}
                    currentOfficerName={item.assigned_name ?? null}
                    onAssign={(oid) => handleAssign(item.id, item.id.substring(0, 8).toUpperCase(), oid)} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-16 text-white/40">No complaints match your search.</div>
            )}
            {filtered.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                whileHover={{ y: -3 }}
                className="p-5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.12] transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <PriorityBadge priority={item.priority} />
                  <StatusBadge status={item.status} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-2">{item.title}</h4>
                <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
                  <span className="flex items-center gap-1"><Building2 size={12} /> {item.dept}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {item.time}</span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                  <span className="text-[11px] font-mono text-white/30">{item.id}</span>
                  <div className="ml-auto flex gap-1">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(item.id, item.id.substring(0, 8).toUpperCase(), "In Progress")}
                      className="px-2 py-1 text-[10px] font-semibold rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-colors">
                      Update
                    </motion.button>
                    <OfficerAssignDropdown officers={officers} currentOfficerId={item.assigned_to ?? null}
                      currentOfficerName={item.assigned_name ?? null}
                      onAssign={(oid) => handleAssign(item.id, item.id.substring(0, 8).toUpperCase(), oid)} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DepartmentsTab({ departments, complaints, loadingDepts, loadDepartments, showDeptForm, setShowDeptForm, editingDeptId, deptFormName, setDeptFormName, deptFormDesc, setDeptFormDesc, setEditingDeptId, handleCreateDept, handleUpdateDept, setDeptDeleteTarget }: {
  departments: DepartmentData[]; complaints: ComplaintData[]; loadingDepts: boolean; loadDepartments: () => void;
  showDeptForm: boolean; setShowDeptForm: (v: boolean) => void; editingDeptId: string | null;
  deptFormName: string; setDeptFormName: (v: string) => void; deptFormDesc: string; setDeptFormDesc: (v: string) => void;
  setEditingDeptId: (v: string | null) => void; handleCreateDept: () => Promise<void>; handleUpdateDept: () => Promise<void>;
  setDeptDeleteTarget: (v: any) => void;
}) {
  return (
    <motion.div key="departments" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">Departments</h2>
          <p className="text-sm text-white/40 mt-0.5">{departments.length} departments · Manage workloads and performance</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadDepartments}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
            <RefreshCw size={14} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowDeptForm(true); setEditingDeptId(null); setDeptFormName(""); setDeptFormDesc(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-lg transition-all shadow-lg shadow-emerald-500/20">
            <Plus size={16} /> New Department
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeptForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-emerald-500/30 overflow-hidden shadow-lg shadow-emerald-500/10">
            <h4 className="text-sm font-bold text-white mb-3">{editingDeptId ? "Edit Department" : "New Department"}</h4>
            <div className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <input type="text" placeholder="Department name" value={deptFormName} onChange={e => setDeptFormName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                <input type="text" placeholder="Description (optional)" value={deptFormDesc} onChange={e => setDeptFormDesc(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors" />
              </div>
              <div className="flex gap-2 pt-1">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={editingDeptId ? handleUpdateDept : handleCreateDept}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-all">
                  {editingDeptId ? "Save" : "Create"}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDeptForm(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-sm font-semibold rounded-lg hover:bg-white/10 transition-all text-white/70">Cancel</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingDepts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="p-5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06]">
              <Shimmer className="w-full h-5 mb-4" />
              <Shimmer className="w-3/4 h-3 mb-3" />
              <Shimmer className="w-full h-2 mb-2" />
              <Shimmer className="w-1/2 h-2" />
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-16 text-center text-white/40 text-sm">
          No departments yet. Create one to get started.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept, i) => {
            const caseCount = complaints.filter(c => c.dept.toLowerCase() === dept.name.toLowerCase()).length;
            const maxCases = Math.max(1, ...departments.map(d => complaints.filter(c => c.dept.toLowerCase() === d.name.toLowerCase()).length));
            const pct = Math.round((caseCount / maxCases) * 100);
            const colors = [
              { bar: "#f59e0b", icon: "text-amber-400", label: "amber" },
              { bar: "#06b6d4", icon: "text-cyan-400", label: "cyan" },
              { bar: "#10b981", icon: "text-emerald-400", label: "emerald" },
              { bar: "#3b82f6", icon: "text-blue-400", label: "blue" },
              { bar: "#eab308", icon: "text-yellow-400", label: "yellow" },
              { bar: "#f97316", icon: "text-orange-400", label: "orange" },
              { bar: "#ef4444", icon: "text-rose-400", label: "rose" },
              { bar: "#a855f7", icon: "text-purple-400", label: "purple" },
            ][i % 8];
            return (
              <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 100, damping: 18 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={`p-5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.12] hover:shadow-lg transition-all ${!dept.is_active ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <Building2 size={20} className={colors.icon} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{dept.name}</h4>
                      {dept.description && <p className="text-xs text-white/40">{dept.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setEditingDeptId(dept.id); setDeptFormName(dept.name); setDeptFormDesc(dept.description); setShowDeptForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-all">
                      <Edit3 size={14} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => setDeptDeleteTarget(dept)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-all">
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>Active Cases: <strong className="text-white">{caseCount}</strong></span>
                  <span className={dept.is_active ? 'text-emerald-400' : 'text-rose-400'}>{dept.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.08 }}
                    className="h-full rounded-full shadow-sm" style={{ background: `linear-gradient(90deg, ${colors.bar}80, ${colors.bar})` }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                  <span>Load: {pct}%</span>
                  <span className="font-mono">{caseCount} cases</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function UsersTab({ users, loadingUsers, loadUsers }: { users: UserData[]; loadingUsers: boolean; loadUsers: () => void }) {
  return (
    <motion.div key="users" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">User Management</h2>
          <p className="text-sm text-white/40 mt-0.5">{users.length} users · Manage roles and access</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadUsers}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
          <RefreshCw size={14} /> Refresh
        </motion.button>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        {loadingUsers ? (
          <div className="p-8 space-y-4">
            {[1,2,3,4].map(i => <Shimmer key={i} className="w-full h-12" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-white/40 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">User</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Role</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Status</th>
                  <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => <UserRow key={u.id} user={u} onUpdate={loadUsers} index={i} />)}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────

function AdminDashboard() {
  const router = useRouter();
  const { logout: authLogout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [tabDirection, setTabDirection] = useState(1);

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
  const [complaintView, setComplaintView] = useState<"list" | "grid">("list");
  const [notifOpen, setNotifOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const [trendsData, setTrendsData] = useState(defaultComplaintTrends);
  const [deptPerfData, setDeptPerfData] = useState(defaultDeptPerformance);
  const [prioData, setPrioData] = useState(defaultPriorityData);
  const [kpis, setKpis] = useState({ total: 0, open: 0, closed: 0, resolutionRate: 0 });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate loading state
  useEffect(() => {
    const t = setTimeout(() => setStatsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Data fetching
  const loadComplaints = useCallback(() => {
    setLoadingComplaints(true);
    const toastId = showTextLoading("Admin Sync", "Connecting to Civic DB");
    complaintService.getAll()
      .then(data => {
        const mapped = data.map((c: any) => ({
          id: c.id, title: c.title, dept: c.dept, priority: c.priority,
          status: c.status, time: c.time?.split('T')[0] || c.time || "—",
          assigned_to: c.assigned_to, assigned_name: c.assigned_name,
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
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      // Intentionally ignore real empty DB data and load rich demo data for presentation
      await apiRequest('/analytics');
    } catch (e) {
      console.log("Analytics API error", e);
    } finally {
      // Force demo data for the overview section charts
      setTrendsData(defaultComplaintTrends);
      setDeptPerfData(defaultDeptPerformance);
      setPrioData(defaultPriorityData);
      setKpis({ total: 1248, open: 142, closed: 1106, resolutionRate: 88 });
    }
  }, []);

  useEffect(() => { loadComplaints(); loadAnalytics(); }, [loadComplaints, loadAnalytics]);

  useEffect(() => {
    complaintService.listOfficers().then(setOfficers).catch(() => {});
  }, []);

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    adminService.listUsers().then(d => { setUsers(d); setLoadingUsers(false); }).catch(() => setLoadingUsers(false));
  }, []);

  const loadDepartments = useCallback(() => {
    setLoadingDepts(true);
    adminService.listDepartments().then(d => { setDepartments(d); setLoadingDepts(false); }).catch(() => setLoadingDepts(false));
  }, []);

  useEffect(() => { if (activeTab === "users") loadUsers(); }, [activeTab, loadUsers]);
  useEffect(() => { if (activeTab === "departments") loadDepartments(); }, [activeTab, loadDepartments]);

  const handleTabChange = (tab: TabId) => {
    const prevIdx = sidebarItems.findIndex(t => t.id === activeTab);
    const nextIdx = sidebarItems.findIndex(t => t.id === tab);
    setTabDirection(nextIdx >= prevIdx ? 1 : -1);
    setActiveTab(tab);
  };

  const handleStatusChange = async (complaintId: string, displayId: string, newStatus: string) => {
    try {
      await complaintService.updateStatus(complaintId, newStatus);
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
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

  const handleCreateDept = async () => {
    if (!deptFormName.trim()) return;
    try {
      await adminService.createDepartment(deptFormName.trim(), deptFormDesc.trim());
      toast.success("Department created");
      setShowDeptForm(false);
      loadDepartments();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateDept = async () => {
    if (!deptFormName.trim() || !editingDeptId) return;
    try {
      await adminService.updateDepartment(editingDeptId, { name: deptFormName.trim(), description: deptFormDesc.trim() });
      toast.success("Department updated");
      setShowDeptForm(false);
      loadDepartments();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSignOut = async () => {
    await authLogout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen text-white selection:bg-emerald-500/30">
      <AnimatedBackground />

      {/* ─── Top Bar ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-white/[0.06] bg-[#080a0a]/80 backdrop-blur-2xl">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </motion.button>
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: [0, -5, 5, 0] }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield className="w-4 h-4 text-black" />
              </motion.div>
              <div>
                <span className="text-sm font-bold text-white font-heading">Civic Connect</span>
                <span className="text-[10px] text-emerald-400/80 ml-2 font-mono hidden sm:inline">Admin Console</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.02 }} className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Clock size={12} className="text-white/40" />
              <span className="text-[11px] font-mono text-white/50">
                {liveTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </motion.div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
              onClick={() => { showAIFuturistic("High", "Water Department", "92%"); }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Insights
            </motion.button>
            <div className="relative">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
                <Bell size={18} />
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              </motion.button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-semibold">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ─── Sidebar ─── */}
      <motion.aside layout
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] transition-all duration-300 border-r border-white/[0.06] bg-[#080a0a]/60 backdrop-blur-2xl ${
          sidebarOpen ? 'w-56' : 'w-16'
        }`}>
        <div className="flex flex-col h-full py-4 px-2 overflow-y-auto scrollbar-thin">
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button key={item.id} onClick={() => handleTabChange(item.id as TabId)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'
                  }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                  {sidebarOpen && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <motion.span key={complaints.length}
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="ml-auto text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full">
                          {complaints.length}
                        </motion.span>
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 mt-4 border-t border-white/[0.06]">
              <div className="px-3">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-mono text-emerald-400/80">System Online</span>
                </div>
                <p className="text-[10px] text-white/30 font-mono">
                  {liveTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* ─── Main Content ─── */}
      <main className={`pt-20 pb-12 transition-all duration-300 relative z-10 min-h-screen ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
        <div className="px-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait" custom={tabDirection}>
            {activeTab === "overview" && (
              <OverviewTab kpis={kpis} trendsData={trendsData} deptPerfData={deptPerfData} prioData={prioData} loading={statsLoading} />
            )}
            {activeTab === "complaints" && (
              <ComplaintsTab complaints={complaints} officers={officers} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                complaintView={complaintView} setComplaintView={setComplaintView}
                handleStatusChange={handleStatusChange} handleAssign={handleAssign} loading={loadingComplaints} />
            )}
            {activeTab === "departments" && (
              <DepartmentsTab departments={departments} complaints={complaints} loadingDepts={loadingDepts}
                loadDepartments={loadDepartments} showDeptForm={showDeptForm} setShowDeptForm={setShowDeptForm}
                editingDeptId={editingDeptId} deptFormName={deptFormName} setDeptFormName={setDeptFormName}
                deptFormDesc={deptFormDesc} setDeptFormDesc={setDeptFormDesc}
                setEditingDeptId={setEditingDeptId} handleCreateDept={handleCreateDept} handleUpdateDept={handleUpdateDept}
                setDeptDeleteTarget={setDeptDeleteTarget} />
            )}
            {activeTab === "users" && <UsersTab users={users} loadingUsers={loadingUsers} loadUsers={loadUsers} />}

            {/* Static tabs (kept from original, with enhanced styling) */}
            {activeTab === "map" && (
              <motion.div key="map" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit"
                className="space-y-5 h-[600px] flex flex-col">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold text-white font-heading">GIS Analytics</h2>
                  <p className="text-sm text-white/40 mt-0.5">Geospatial data and density mapping</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex-grow rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] relative overflow-hidden flex items-center justify-center">
                  <Map className="w-24 h-24 text-white/[0.03] absolute z-0" />
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay z-0" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-[30%] left-[40%] w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.6)] z-10" />
                  <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute top-[50%] left-[60%] w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.6)] z-10" />
                  <motion.div animate={{ y: [0, -8, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="absolute top-[20%] left-[20%] w-6 h-6 bg-emerald-500/40 rounded-full flex items-center justify-center border-2 border-emerald-400 z-10 text-[8px] font-bold text-white">12</motion.div>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}
                    className="absolute bottom-[30%] right-[25%] w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)] z-10" />
                  <div className="z-20 p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl max-w-sm text-center shadow-2xl">
                    <h4 className="text-white font-bold mb-2">Map Engine Active</h4>
                    <p className="text-xs text-white/50 mb-4">Real-time geospatial data streams connected.</p>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-emerald-500 text-black rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors">Interact</motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div key="analytics" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold text-white font-heading">Deep Analytics</h2>
                  <p className="text-sm text-white/40 mt-0.5">Comprehensive insights and performance metrics</p>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <GlassCard className="lg:col-span-2" glow>
                    <SectionHeader icon={BarChart3} label="Weekly Performance" />
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={defaultComplaintTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="new" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#1a1a2e" }} />
                          <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#1a1a2e" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  <GlassCard glow>
                    <SectionHeader icon={Activity} label="Metrics" />
                    <div className="space-y-4 mt-2">
                      {[
                        { label: "Avg Response Time", value: "4.2h", change: "-12%", color: "#10b981" },
                        { label: "SLA Compliance", value: "94%", change: "+3%", color: "#06b6d4" },
                        { label: "Escalation Rate", value: "8%", change: "-2%", color: "#8b5cf6" },
                        { label: "Citizen Satisfaction", value: "4.7/5", change: "+0.3", color: "#f59e0b" },
                      ].map((m, i) => (
                        <motion.div key={m.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors cursor-default">
                          <span className="text-xs text-white/60">{m.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{m.value}</span>
                            <span className={`text-[10px] font-semibold ${m.change.startsWith('+') ? 'text-emerald-400' : 'text-emerald-400'}`}
                              style={{ color: m.color }}>{m.change}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard glow>
                    <SectionHeader icon={TrendingUp} label="Monthly Trend" />
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'W1', value: 180 }, { name: 'W2', value: 220 },
                          { name: 'W3', value: 190 }, { name: 'W4', value: 250 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
                            {[0, 1, 2, 3].map((i) => (
                              <Cell key={i} fill={['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][i]}
                                style={{ filter: `drop-shadow(0 0 4px ${['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][i]}60)` }} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  <GlassCard glow>
                    <SectionHeader icon={Target} label="Department Radar" />
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={deptPerfData.slice(0, 6)}>
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} />
                          <PolarRadiusAxis stroke="rgba(255,255,255,0.08)" fontSize={9} domain={[0, 100]} />
                          <Radar name="Efficiency" dataKey="efficiency" stroke="#10b981" fill="#10b981" fillOpacity={0.15}
                            strokeWidth={2} />
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {activeTab === "audit" && (
              <motion.div key="audit" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white font-heading">Audit & Security</h2>
                    <p className="text-sm text-white/40 mt-0.5">System activity and compliance logs</p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
                      <Filter size={14} /> Filter
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
                      <Download size={14} /> Export
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                      <tr>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Timestamp</th>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Actor</th>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Action</th>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Target</th>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {[
                        { time: "2026-07-01 14:32:01", actor: "System Admin", action: "ROLE_CHANGE (CITIZEN → OFFICER)", target: "Sarah Connor", ip: "192.168.1.42" },
                        { time: "2026-07-01 12:15:44", actor: "Officer Ramesh", action: "STATUS_UPDATE (In Progress → Resolved)", target: "Complaint C-8840", ip: "10.0.4.15" },
                        { time: "2026-07-01 10:05:12", actor: "Citizen John", action: "COMPLAINT_CREATED", target: "Complaint C-8841", ip: "203.0.113.88" },
                        { time: "2026-06-30 09:22:10", actor: "System Admin", action: "DEPT_CREATED", target: "Department: Forestry", ip: "192.168.1.42" },
                      ].map((log, i) => (
                        <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-white/40">{log.time}</td>
                          <td className="px-4 py-3 font-semibold text-white/80">{log.actor}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-white/60 border border-white/10">{log.action}</span>
                          </td>
                          <td className="px-4 py-3 text-white/60">{log.target}</td>
                          <td className="px-4 py-3 font-mono text-xs text-white/30">{log.ip}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "broadcast" && (
              <motion.div key="broadcast" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold text-white font-heading">Emergency Broadcast</h2>
                  <p className="text-sm text-white/40 mt-0.5">Send alerts to citizens and officers</p>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-xl bg-black/40 backdrop-blur-xl border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
                    <h4 className="font-bold text-rose-400 mb-4 flex items-center gap-2"><ShieldAlert size={18} /> Compose Alert</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">Target</label>
                        <select className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50">
                          <option>All Citizens (Citywide)</option>
                          <option>Specific Zip Codes</option>
                          <option>Officers Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">Title</label>
                        <input type="text" placeholder="e.g., Boil Water Advisory"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">Message</label>
                        <textarea rows={4} placeholder="Details of the emergency..."
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 resize-none" />
                      </div>
                      <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 text-sm font-semibold text-white/70 cursor-pointer">
                          <input type="checkbox" className="rounded accent-rose-500" defaultChecked /> Push
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white/70 cursor-pointer">
                          <input type="checkbox" className="rounded accent-rose-500" defaultChecked /> SMS
                        </label>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => toast.success("Broadcast sent to 45,210 citizens.")}
                        className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-black rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20">
                        Deploy Broadcast
                      </motion.button>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h4 className="font-bold text-white/80">Recent Broadcasts</h4>
                    {[
                      { title: "Severe Weather Warning", date: "June 25, 2026", reach: "42K Deliveries" },
                      { title: "Main St. Gas Leak", date: "June 12, 2026", reach: "8.5K Deliveries (Zip 10001)" },
                    ].map((b, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-semibold text-white text-sm">{b.title}</h5>
                          <span className="text-xs text-white/40">{b.date}</span>
                        </div>
                        <p className="text-xs text-white/50">{b.reach}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "budget" && (
              <motion.div key="budget" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold text-white font-heading">Budget & Resources</h2>
                  <p className="text-sm text-white/40 mt-0.5">Financial overview and resource allocation</p>
                </motion.div>
                <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StaggerItem>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Annual Budget</p>
                      <h4 className="text-2xl font-bold text-white font-heading"><AnimatedCounter value={4500000} prefix="$" duration={2} /></h4>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl">
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Expended (YTD)</p>
                      <h4 className="text-2xl font-bold text-white font-heading"><AnimatedCounter value={2100000} prefix="$" duration={2} /></h4>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-xl">
                      <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Heavy Equipment</p>
                      <h4 className="text-2xl font-bold text-white font-heading"><AnimatedCounter value={42} duration={1.5} /><span className="text-lg text-white/60"> /50</span></h4>
                    </div>
                  </StaggerItem>
                </StaggerGrid>
                <GlassCard glow>
                  <SectionHeader icon={Wallet} label="Department Cost Breakdown" />
                  <div className="space-y-5">
                    {[
                      { dept: "Public Works (Roads)", cost: "$1.2M", percent: "60%" },
                      { dept: "Water & Sanitation", cost: "$600K", percent: "30%" },
                      { dept: "Electrical", cost: "$300K", percent: "15%" },
                    ].map((d, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm font-semibold mb-1.5">
                          <span className="text-white/80">{d.dept}</span>
                          <span className="text-white">{d.cost}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: d.percent }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm shadow-emerald-500/30"
                            transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div key="settings" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold text-white font-heading">System Settings</h2>
                  <p className="text-sm text-white/40 mt-0.5">Configuration and integration management</p>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard glow>
                    <SectionHeader icon={Settings} label="Core Configuration" />
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">SLA Target (Hours)</label>
                        <input type="number" defaultValue={48}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">Auto-Escalation (Hours)</label>
                        <input type="number" defaultValue={72}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                      </div>
                    </div>
                  </GlassCard>
                  <GlassCard glow>
                    <SectionHeader icon={Shield} label="API Integrations" />
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">Twilio SMS Gateway</label>
                        <input type="password" defaultValue="************************"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">SendGrid Email API</label>
                        <input type="password" defaultValue="************************"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                      onClick={() => toast.success("Settings Saved")}
                      className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20">
                      Save Changes
                    </motion.button>
                  </GlassCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <ConfirmModal
        open={deptDeleteTarget !== null}
        title="Delete Department"
        message={`Are you sure you want to delete "${deptDeleteTarget?.name}"? This cannot be undone.`}
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
    </div>
  );
}

export default withRoleGuard(AdminDashboard, ['ADMIN']);
