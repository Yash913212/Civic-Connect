"use client";

import { withRoleGuard } from "@/middleware/roleGuard";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  ClipboardList, Map, Award, Clock,
  CheckCircle, Camera, Search, Filter, MessageSquare,
  LogOut, Bell, AlertTriangle, Building2, ChevronDown, RefreshCw,
  Truck, CalendarDays, CloudOff, Send, PackagePlus, Clock4, User,
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
import { showUploadProgress, showTextLoading, showResolution, showAdminAlert, showSystemStatus } from "@/components/ui/CustomToasts";
import { complaintService, type ComplaintData } from "@/services/complaintService";
import dynamic from "next/dynamic";

const OfficerMapView = dynamic(() => import("@/components/map/OfficerMapView"), { ssr: false });

// ─── Data ──────────────────────────────────────────────────────────────

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
    High: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
    Medium: "bg-amber-500/15 border-amber-500/25 text-amber-400",
    Low: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: "bg-slate-500/15 border-slate-500/25 text-slate-400",
    Assigned: "bg-blue-500/15 border-blue-500/25 text-blue-400",
    "In Progress": "bg-amber-500/15 border-amber-500/25 text-amber-400",
    Resolved: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.Pending}`}>
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

// ─── Tilt Card ─────────────────────────────────────────────────────────

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
    { id: 1, title: "New Complaint Assigned", desc: "C-8846: Traffic signal at junction", time: "2 min ago", type: "info" },
    { id: 2, title: "Complaint Resolved", desc: "C-8842: Water pipe burst fixed", time: "15 min ago", type: "success" },
    { id: 3, title: "Dispatch Alert", desc: "Backup requested at Main St.", time: "1 hour ago", type: "urgent" },
    { id: 4, title: "Shift Reminder", desc: "Night shift starts at 8PM", time: "2 hours ago", type: "assignment" },
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

// ─── Activity Feed ─────────────────────────────────────────────────────

function ActivityFeed() {
  const activities = useMemo(() => [
    { icon: FileText, text: "New complaint assigned to you", time: "2m ago", color: "#10b981" },
    { icon: CheckCircle, text: "C-8842 marked as Resolved", time: "15m ago", color: "#10b981" },
    { icon: MapPin, text: "Field visit requested at 5th Ave", time: "1h ago", color: "#06b6d4" },
    { icon: AlertTriangle, text: "Backup requested at Main St.", time: "2h ago", color: "#f59e0b" },
    { icon: Users, text: "Shift swap approved", time: "4h ago", color: "#8b5cf6" },
    { icon: Award, text: "Performance rating: 4.8/5", time: "6h ago", color: "#f97316" },
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

// ─── Chart tooltip ─────────────────────────────────────────────────────

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

// ─── Staggered grid ────────────────────────────────────────────────────

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

// ─── Animated Background ───────────────────────────────────────────────

function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060a0a] via-[#080c0c] to-[#0a0e0e]" />

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
          background: "radial-gradient(circle, #06b6d4, transparent)",
          left: `calc(100% - ${mousePos.x}px - 20vw)`,
          top: `calc(${mousePos.y}px - 20vw)`,
        }}
        transition={{ type: "spring", stiffness: 25, damping: 35 }}
      />

      <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/[0.03] blur-[150px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-cyan-500/[0.03] blur-[150px] animate-blob animation-delay-2000" />
      <div className="absolute top-[40%] right-[30%] w-[25vw] h-[25vw] rounded-full bg-amber-500/[0.02] blur-[120px] animate-blob animation-delay-4000" />

      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
    </div>
  );
}

// ─── Performance Tab ───────────────────────────────────────────────────

function PerformanceTab({ complaints, loading }: { complaints: ComplaintData[]; loading: boolean }) {
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const resolutionRate = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0;

  return (
    <motion.div key="performance" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white font-heading">Performance Metrics</h2>
        <p className="text-sm text-white/40 mt-0.5">Track your field performance and resolution stats</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label="Resolution Rate" value={resolutionRate} suffix="%" trend="+2%" color="#10b981" delay={0} loading={loading} />
        <StatCard icon={Clock} label="Avg Completion" value={2.4} suffix="h" trend="-0.3h" color="#06b6d4" delay={0.08} loading={loading} />
        <StatCard icon={Activity} label="Cases Handled" value={complaints.length} color="#8b5cf6" delay={0.16} loading={loading} />
        <StatCard icon={Target} label="Satisfaction" value={4.8} suffix="/5" trend="+0.2" color="#f59e0b" delay={0.24} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard glow>
          <SectionHeader icon={TrendingUp} label="Daily Workload Trend" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workloadData}>
                <defs>
                  <linearGradient id="ot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tasks" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#ot)"
                  dot={{ r: 3, fill: "#06b6d4", strokeWidth: 2, stroke: "#1a1a2e" }}
                  activeDot={{ r: 5, stroke: "#06b6d4", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={BarChart3} label="Resolution vs Target" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<CustomTooltip />} />
                <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" animationDuration={1500} />
                <Bar dataKey="target" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} name="Target" animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard glow>
        <SectionHeader icon={Activity} label="Recent Activity" />
        <ActivityFeed />
      </GlassCard>
    </motion.div>
  );
}

// ─── Comms Hub Tab ─────────────────────────────────────────────────────

function CommsHubTab() {
  return (
    <motion.div key="comms" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5 flex flex-col h-[600px]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white font-heading">Comms Hub</h2>
        <p className="text-sm text-white/40 mt-0.5">Dispatch communications and team coordination</p>
      </motion.div>
      <GlassCard className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="w-1/3 border-r border-white/10 pr-4 flex flex-col gap-2">
          {[
            { name: "Admin Control", msg: "I need backup at Main St.", active: true },
            { name: "Citizen (C-8840)", msg: "Can you provide the gate code?", active: false },
            { name: "Dispatch Center", msg: "Night shift schedule updated", active: false },
          ].map((chat, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className={`p-3 rounded-xl cursor-pointer transition-all ${
                chat.active
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'hover:bg-white/[0.03] border border-transparent'
              }`}>
              <h4 className="font-bold text-sm text-white">{chat.name}</h4>
              <p className="text-xs text-white/50 truncate">{chat.msg}</p>
            </motion.div>
          ))}
        </div>
        <div className="w-2/3 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            <div className="flex flex-col gap-1 items-end">
              <div className="px-4 py-2 bg-emerald-500 text-white rounded-2xl rounded-tr-sm text-sm max-w-[80%] shadow-lg shadow-emerald-500/20">
                I am on site at Main St. We need a tow truck.
              </div>
              <span className="text-[10px] text-white/30">10:42 AM</span>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <div className="px-4 py-2 bg-white/10 text-white rounded-2xl rounded-tl-sm text-sm max-w-[80%]">
                Copy that. Dispatching a tow truck now. ETA 15 mins.
              </div>
              <span className="text-[10px] text-white/30">10:44 AM</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div className="px-4 py-2 bg-emerald-500 text-white rounded-2xl rounded-tr-sm text-sm max-w-[80%] shadow-lg shadow-emerald-500/20">
                Roger that. Waiting on site.
              </div>
              <span className="text-[10px] text-white/30">10:46 AM</span>
            </div>
          </div>
          <div className="mt-auto relative">
            <input type="text" placeholder="Type a message..."
              className="w-full bg-black/30 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all" />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/30">
              <Send size={14} />
            </motion.button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Resources Tab ─────────────────────────────────────────────────────

function ResourcesTab() {
  return (
    <motion.div key="resources" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">Resource & Equipment</h2>
          <p className="text-sm text-white/40 mt-0.5">Request and track field equipment</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
          <PackagePlus size={16} /> New Request
        </motion.button>
      </motion.div>

      <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Tow Truck", status: "Pending", desc: "Requested for complaint C-8840 to remove abandoned vehicle blocking drainage work.", time: "2 hours ago", icon: Truck, color: "#f59e0b" },
          { title: "Excavator (Mini)", status: "Approved", desc: "Required for pipe replacement at 5th Ave.", time: "Approved 1 day ago", icon: Truck, color: "#10b981" },
          { title: "Safety Barricades", status: "Delivered", desc: "For road work at junction 12.", time: "Delivered 3 hours ago", icon: Shield, color: "#06b6d4" },
          { title: "Portable Generator", status: "Pending", desc: "Backup power for night operation at Sector 7.", time: "Requested 30 mins ago", icon: Zap, color: "#f59e0b" },
        ].map((r, i) => {
          const Icon = r.icon;
          const statusColor = r.status === "Approved" || r.status === "Delivered" ? "text-emerald-400 bg-emerald-500/15" : "text-amber-400 bg-amber-500/15";
          return (
            <StaggerItem key={i}>
              <TiltCard>
                <motion.div whileHover={{ y: -3 }}
                  className="p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <motion.div whileHover={{ rotate: [0, -10, 10, 0] }}
                      className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                      style={{ color: r.color }}>
                      <Icon size={20} />
                    </motion.div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>
                      {r.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-2">{r.title}</h4>
                  <p className="text-xs text-white/50 mb-4 leading-relaxed">{r.desc}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                    <Clock size={10} /> {r.time}
                  </div>
                </motion.div>
              </TiltCard>
            </StaggerItem>
          );
        })}
      </StaggerGrid>
    </motion.div>
  );
}

// ─── Schedule Tab ──────────────────────────────────────────────────────

function ScheduleTab() {
  return (
    <motion.div key="schedule" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white font-heading">Shift Management</h2>
        <p className="text-sm text-white/40 mt-0.5">View and manage your duty schedule</p>
      </motion.div>

      <GlassCard glow>
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Clock4 size={28} className="text-emerald-400" />
            </motion.div>
            <div>
              <h4 className="font-bold text-white text-lg">Current Shift</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-white/50">08:00 AM - 04:00 PM</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
            Log Break
          </motion.button>
        </div>

        <SectionHeader icon={CalendarDays} label="Upcoming Shifts" />
        <div className="space-y-3">
          {[
            { day: "Tomorrow", time: "08:00 AM - 04:00 PM", role: "Primary Response" },
            { day: "Thursday", time: "12:00 PM - 08:00 PM", role: "Evening Patrol" },
            { day: "Friday", time: "Off Duty", role: "Rest Day" },
            { day: "Saturday", time: "06:00 AM - 02:00 PM", role: "Weekend Support" },
          ].map((shift, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ x: 2, borderColor: 'rgba(255,255,255,0.12)' }}
              className="flex justify-between items-center p-4 rounded-xl border border-white/[0.06] hover:bg-white/[0.02] transition-all">
              <div>
                <p className="font-bold text-white text-sm">{shift.day}</p>
                <p className="text-xs text-white/50 mt-0.5">{shift.time}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                shift.time === 'Off Duty'
                  ? 'bg-white/5 border-white/10 text-white/50'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {shift.role}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard glow>
        <SectionHeader icon={Award} label="Shift Stats" />
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Hours This Week", value: "32h", color: "#10b981" },
            { label: "On-Time Rate", value: "98%", color: "#06b6d4" },
            { label: "Days Off Left", value: "4", color: "#8b5cf6" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-xs text-white/50">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1 font-heading" style={{ color: s.color }}>{s.value}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Main Officer Dashboard ────────────────────────────────────────────

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
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      } catch {}
    }
  }, []);

  const loadComplaints = useCallback(() => {
    setLoading(true);
    const toastId = showTextLoading("Sync", "Connecting to Civic DB");
    complaintService.getAll()
      .then(data => {
        setComplaints(data);
        toast.dismiss(toastId);
        showSystemStatus("Sync Complete", "Complaints loaded successfully");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.dismiss(toastId);
        showSystemStatus("Sync Error", "Loaded offline data", true);
        toast.error("Failed to load complaints");
      });
  }, []);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

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
      showSystemStatus("Status Update", `Complaint updated to ${newStatus}`);
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
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const criticalCount = complaints.filter(c => c.priority === "Critical").length;

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
                <span className="text-[10px] text-emerald-400/80 ml-2 font-mono hidden sm:inline">Officer Console</span>
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
              onClick={() => loadComplaints()}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-white/70">
              <RefreshCw className="w-3.5 h-3.5" /> Sync
            </motion.button>
            <div className="relative">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
                <Bell size={18} />
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
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
              const count = item.id === 'tasks' ? activeCount : undefined;
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
                      {count !== undefined && (
                        <motion.span key={count}
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="ml-auto text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">
                          {count}
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
                  <span className="text-[10px] font-mono text-emerald-400/80">Online</span>
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

            {activeTab === "tasks" && (
              <motion.div key="tasks" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setMyTasksOnly(!myTasksOnly)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        myTasksOnly
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}>
                      <ClipboardList size={16} /> My Tasks ({myTaskCount})
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadComplaints}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors">
                      <RefreshCw size={16} />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Stat Cards */}
                <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StaggerItem>
                    <StatCard icon={ClipboardList} label="Active Cases" value={activeCount} color="#f59e0b" />
                  </StaggerItem>
                  <StaggerItem>
                    <StatCard icon={User} label="My Tasks" value={myTaskCount} color="#06b6d4" />
                  </StaggerItem>
                  <StaggerItem>
                    <StatCard icon={CheckCircle} label="Resolved" value={resolvedCount} trend="+8%" color="#10b981" />
                  </StaggerItem>
                  <StaggerItem>
                    <StatCard icon={AlertTriangle} label="Critical" value={criticalCount} color="#ef4444" />
                  </StaggerItem>
                </StaggerGrid>

                {/* Task List + Detail Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Task List */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                    {loading && filteredComplaints.length === 0 && (
                      <div className="space-y-3">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06]">
                            <Shimmer className="w-1/3 h-3 mb-3" />
                            <Shimmer className="w-2/3 h-4 mb-2" />
                            <Shimmer className="w-1/2 h-3" />
                          </div>
                        ))}
                      </div>
                    )}
                    {!loading && filteredComplaints.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="p-8 text-center text-white/40 text-sm">
                        {searchQuery ? "No complaints match your search." : "No complaints in the system yet."}
                      </motion.div>
                    )}
                    {filteredComplaints.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, type: "spring", stiffness: 100, damping: 20 }}
                        onClick={() => setSelectedTask(c.id)}
                        whileHover={{ x: 2 }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedTask === c.id
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                            : 'bg-black/40 backdrop-blur-xl border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-emerald-400/80">#{c.id.substring(0, 8)}</span>
                          <PriorityBadge priority={c.priority} />
                        </div>
                        <h4 className="font-bold text-white text-sm mb-2">{c.title}</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/50 flex items-center gap-1">
                            <Building2 size={10} /> {c.dept}
                          </span>
                          <span className="flex items-center gap-1">
                            {c.assigned_name && (
                              <span className="text-[10px] text-emerald-400 mr-1">({c.assigned_name})</span>
                            )}
                            <StatusBadge status={c.status} />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Task Detail Panel */}
                  <GlassCard className="h-full flex flex-col">
                    {selectedComplaint ? (
                      <>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">{selectedComplaint.title}</h3>
                            <span className="text-xs font-mono text-emerald-400/80">ID: #{selectedComplaint.id.substring(0, 8)}</span>
                          </div>
                          <StatusDropdown
                            current={selectedComplaint.status}
                            onChange={(s) => handleStatusChange(selectedComplaint.id, s)}
                          />
                        </div>

                        <div className="space-y-6 flex-grow">
                          <div>
                            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-sm text-white/70 leading-relaxed">{selectedComplaint.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Department</h4>
                              <p className="text-sm font-semibold text-emerald-400">{selectedComplaint.dept}</p>
                            </div>
                            <div>
                              <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Priority</h4>
                              <PriorityBadge priority={selectedComplaint.priority} />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Location</h4>
                            <p className="text-sm text-white/70">{selectedComplaint.address || selectedComplaint.location}</p>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3">Field Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => showUploadProgress()}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all group">
                                <motion.div whileHover={{ rotate: [0, -10, 10, 0] }}>
                                  <Camera size={22} className="text-emerald-400" />
                                </motion.div>
                                <span className="text-xs font-semibold text-white">Upload Evidence</span>
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => toast.success("Notes saved to case file.")}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all group">
                                <motion.div whileHover={{ rotate: [0, -10, 10, 0] }}>
                                  <MessageSquare size={22} className="text-emerald-400" />
                                </motion.div>
                                <span className="text-xs font-semibold text-white">Add Notes</span>
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 mt-6">
                          <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3">Quick Status Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            {["Assigned", "In Progress", "Resolved"].map(s => (
                              <motion.button
                                key={s}
                                whileHover={selectedComplaint.status !== s ? { scale: 1.05 } : {}}
                                whileTap={{ scale: 0.95 }}
                                disabled={selectedComplaint.status === s}
                                onClick={() => handleStatusChange(selectedComplaint.id, s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  selectedComplaint.status === s
                                    ? 'opacity-30 cursor-not-allowed'
                                    : 'cursor-pointer hover:bg-white/10'
                                } ${
                                  s === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                  s === 'In Progress' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                  'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}>
                                {s === 'Resolved' && <CheckCircle size={12} className="inline mr-1" />}
                                {s === 'In Progress' && <Activity size={12} className="inline mr-1" />}
                                {s}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                          <ClipboardList className="w-20 h-20 mb-4 text-white/20" />
                        </motion.div>
                        <p className="text-sm font-semibold text-white/60">Select a complaint from the list<br/>to view details and take action.</p>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {activeTab === "map" && (
              <motion.div key="map" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit"
                className="space-y-5 h-[600px] flex flex-col">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold text-white font-heading">Field Operations Map</h2>
                  <p className="text-sm text-white/40 mt-0.5">Real-time geospatial view of all complaints</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex-grow rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
                  <OfficerMapView />
                </motion.div>
              </motion.div>
            )}

            {activeTab === "performance" && <PerformanceTab key="performance" complaints={complaints} loading={loading} />}
            {activeTab === "comms" && <CommsHubTab key="comms" />}
            {activeTab === "resources" && <ResourcesTab key="resources" />}
            {activeTab === "schedule" && <ScheduleTab key="schedule" />}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default withRoleGuard(OfficerDashboard, ['OFFICER', 'ADMIN']);
