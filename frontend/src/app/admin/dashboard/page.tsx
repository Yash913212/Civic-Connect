"use client";

import { withRoleGuard } from "@/middleware/roleGuard";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, Map, Settings, AlertTriangle,
  FolderOpen, Activity, Clock, Bell,
  LogOut, Filter, Search,
  TrendingUp, Shield, BarChart3, RefreshCw, ChevronDown, Trash2,
  ShieldAlert, Radio, Wallet, Menu, ChevronLeft, LayoutDashboard,
  Plus, Edit3, List, Grid3X3, Sparkles,
  Target,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { showAIFuturistic } from "@/components/ui/CustomToasts";
import { complaintService, type OfficerData } from "@/services/complaintService";
import { adminService, type UserData, type DepartmentData } from "@/services/adminService";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PriorityBadge } from "@/components/dashboard/PriorityBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ROLE_ORDER } from "@/config/roles";
import { Shimmer } from "@/components/dashboard/Shimmer";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { OverviewTab } from "./OverviewTab";
import { NotificationPanel } from "./NotificationPanel";
import { AnimatedBackground } from "./AnimatedBackground";

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
  { id: "C-8839", title: "Pedda gunta road meeda", description: "Road issue on main road", dept: "Roads Dept", priority: "Critical", status: "Pending", time: "2 hours ago" },
  { id: "C-8840", title: "Drainage block ayipoyindi", description: "Drainage blocked near junction", dept: "Drainage Dept", priority: "High", status: "Pending", time: "5 hours ago" },
  { id: "C-8841", title: "Overflowing garbage bin on main road", description: "Garbage bin overflowing", dept: "Sanitation", priority: "Medium", status: "Assigned", time: "1 day ago" },
  { id: "C-8842", title: "Water pipe burst street flooded", description: "Water pipe burst on main road", dept: "Water Works", priority: "Critical", status: "In Progress", time: "4 hours ago" },
  { id: "C-8843", title: "Street light not working complete dark", description: "Street light not working", dept: "Electrical Dept", priority: "High", status: "Assigned", time: "6 hours ago" },
  { id: "C-8844", title: "Exposed electric wire dangerous", description: "Exposed wire near school", dept: "Power Distribution", priority: "Critical", status: "Pending", time: "1 hour ago" },
  { id: "C-8845", title: "Open manhole no cover dangerous", description: "Open manhole on sidewalk", dept: "Public Safety", priority: "Critical", status: "Pending", time: "30 mins ago" },
  { id: "C-8846", title: "Traffic signal not working at junction", description: "Traffic signal malfunctioning", dept: "Traffic Management", priority: "High", status: "Assigned", time: "3 hours ago" },
];

const sidebarItems = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "complaints", icon: FolderOpen, label: "Complaints", badge: true },
  { id: "departments", icon: Building2, label: "Departments" },
  { id: "users", icon: Users, label: "Users" },
  { id: "map", icon: Map, label: "GIS Map" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "audit", icon: Shield, label: "Audit" },
  { id: "broadcast", icon: Radio, label: "Broadcast" },
  { id: "budget", icon: Wallet, label: "Budget" },
  { id: "settings", icon: Settings, label: "Settings" },
] as const;

type TabId = typeof sidebarItems[number]['id'];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.97 }),
};

const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

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

function OfficerAssignDropdown({ officers, currentOfficerId, currentOfficerName, onAssign }: {
  officers: { id: string; full_name: string }[]; currentOfficerId: string | null; currentOfficerName: string | null;
  onAssign: (officerId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
        <Users size={12} className="text-white/40" />
        <span className="text-white/70">{currentOfficerName || 'Assign'}</span>
        <ChevronDown size={12} className="text-white/40" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-1 z-20 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[180px] overflow-hidden">
            <button onClick={() => { onAssign(null); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/50 hover:bg-white/5 transition-colors">
              Unassign
            </button>
            <div className="border-t border-white/[0.06] my-1" />
            {officers.map(o => (
              <button key={o.id} onClick={() => { onAssign(o.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors ${
                  o.id === currentOfficerId ? 'text-emerald-400' : 'text-white/70'
                }`}>
                {o.full_name}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

function UserRow({ user, onUpdate, index, departments }: {
  user: UserData; onUpdate: () => void; index: number; departments: DepartmentData[];
}) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    setBusy(true); setRoleOpen(false);
    try { await adminService.updateRole(user.id, newRole); toast.success("Role updated"); onUpdate(); }
    catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const handleDepartmentChange = async (newDept: string | null) => {
    setBusy(true); setDeptOpen(false);
    try { await adminService.updateUserDepartment(user.id, newDept); toast.success("Department updated"); onUpdate(); }
    catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const handleToggleActive = async () => {
    setBusy(true);
    try { await adminService.toggleActive(user.id); toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`); onUpdate(); }
    catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const adminRoleColors: Record<string, string> = { ADMIN: "text-rose-400 bg-rose-500/10 border-rose-500/20", OFFICER: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", CITIZEN: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  return (
    <motion.tr key={user.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
      className={`hover:bg-white/[0.02] transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-black">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <span className="text-sm font-semibold text-white">{user.full_name}</span>
            <span className="text-xs text-white/40 block">{user.email}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <button onClick={() => setRoleOpen(!roleOpen)} disabled={busy}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${adminRoleColors[user.role] || adminRoleColors.CITIZEN}`}>
            {user.role}
          </button>
          {roleOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute left-0 top-full mt-1 z-20 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[120px]">
                {ROLE_ORDER.map(r => (
                  <button key={r} onClick={() => handleRoleChange(r)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 ${r === user.role ? 'text-emerald-400' : 'text-white/70'}`}>{r}</button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <button onClick={() => setDeptOpen(!deptOpen)} disabled={busy}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-white/10 bg-white/5 text-white/60 cursor-pointer">
            {user.department || 'None'}
          </button>
          {deptOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDeptOpen(false)} />
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute left-0 top-full mt-1 z-20 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px] max-h-40 overflow-y-auto">
                <button onClick={() => handleDepartmentChange(null)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/50 hover:bg-white/5">None</button>
                {departments.map(d => (
                  <button key={d.id} onClick={() => handleDepartmentChange(d.name)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 ${d.name === user.department ? 'text-emerald-400' : 'text-white/70'}`}>{d.name}</button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleToggleActive} disabled={busy}
          className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            user.is_active ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
          }`}>
          {user.is_active ? 'Disable' : 'Enable'}
        </motion.button>
      </td>
    </motion.tr>
  );
}

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

function ComplaintsTab({ complaints, officers, searchQuery, setSearchQuery, complaintView, setComplaintView, handleStatusChange, handleAssign }: {
  complaints: any[]; officers: OfficerData[]; searchQuery: string; setSearchQuery: (s: string) => void;
  complaintView: "list" | "grid"; setComplaintView: (v: "list" | "grid") => void;
  handleStatusChange: (id: string, did: string, s: string) => void; handleAssign: (id: string, did: string, oid: string | null) => void;
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
          <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setComplaintView("list")}
              className={`p-1.5 rounded ${complaintView === "list" ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}`}>
              <List size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setComplaintView("grid")}
              className={`p-1.5 rounded ${complaintView === "grid" ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}`}>
              <Grid3X3 size={16} />
            </motion.button>
          </div>
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
                  <div className={`p-2.5 rounded-xl border ${
                    item.priority === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                    item.priority === 'High' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    item.priority === 'Medium' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}>
                    <AlertTriangle size={18} />
                  </div>
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
  departments: DepartmentData[]; complaints: any[]; loadingDepts: boolean; loadDepartments: () => void;
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
          <p className="text-sm text-white/40 mt-0.5">{departments.length} departments</p>
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
        <div className="p-16 text-center text-white/40 text-sm">No departments yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept, i) => {
            const caseCount = complaints.filter(c => c.dept.toLowerCase() === dept.name.toLowerCase()).length;
            const maxCases = Math.max(1, ...departments.map(d => complaints.filter(c => c.dept.toLowerCase() === d.name.toLowerCase()).length));
            const pct = Math.round((caseCount / maxCases) * 100);
            const colors = [{bar:"#f59e0b",label:"amber"},{bar:"#06b6d4",label:"cyan"},{bar:"#10b981",label:"emerald"},{bar:"#3b82f6",label:"blue"},{bar:"#eab308",label:"yellow"},{bar:"#f97316",label:"orange"},{bar:"#ef4444",label:"rose"},{bar:"#a855f7",label:"purple"}][i % 8];
            return (
              <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className={`p-5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.12] transition-all ${!dept.is_active ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <Building2 size={20} />
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

function UsersTab({ users, loadingUsers, loadUsers, departments }: { users: UserData[]; loadingUsers: boolean; loadUsers: () => void; departments: DepartmentData[] }) {
  return (
    <motion.div key="users" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">User Management</h2>
          <p className="text-sm text-white/40 mt-0.5">{users.length} users</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadUsers}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors">
          <RefreshCw size={14} /> Refresh
        </motion.button>
      </div>
      <div className="rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
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
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Department</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Status</th>
                  <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => <UserRow key={u.id} user={u} departments={departments} onUpdate={loadUsers} index={i} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AdminDashboard() {
  const { logout: authLogout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [tabDirection, setTabDirection] = useState(1);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [liveTime, setLiveTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [officers, setOfficers] = useState<OfficerData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptFormName, setDeptFormName] = useState("");
  const [deptFormDesc, setDeptFormDesc] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptDeleteTarget, setDeptDeleteTarget] = useState<any>(null);
  const [complaintView, setComplaintView] = useState<"list" | "grid">("list");
  const [notifOpen, setNotifOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const [trendsData] = useState(defaultComplaintTrends);
  const [deptPerfData] = useState(defaultDeptPerformance);
  const [prioData] = useState(defaultPriorityData);
  const [kpis] = useState({ total: 1248, open: 142, closed: 1106, resolutionRate: 88 });

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setStatsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const loadComplaints = useCallback(() => {
    complaintService.getAll()
      .then(data => {
        setComplaints([...data, ...complaintFallbacks]);
      })
      .catch(() => {
        setComplaints(complaintFallbacks);
      });
  }, []);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

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
      if (newStatus === "Resolved") confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAssign = async (complaintId: string, displayId: string, officerId: string | null) => {
    try {
      const result = await complaintService.assignOfficer(complaintId, officerId);
      setComplaints(prev => prev.map(c =>
        c.id === complaintId ? { ...c, assigned_to: result.assigned_to, assigned_name: result.assigned_name, status: result.status } : c
      ));
      toast.success(`#${displayId} → ${result.message}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCreateDept = async () => {
    if (!deptFormName.trim()) return;
    try { await adminService.createDepartment(deptFormName.trim(), deptFormDesc.trim()); toast.success("Department created"); setShowDeptForm(false); loadDepartments(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateDept = async () => {
    if (!deptFormName.trim() || !editingDeptId) return;
    try { await adminService.updateDepartment(editingDeptId, { name: deptFormName.trim(), description: deptFormDesc.trim() }); toast.success("Department updated"); setShowDeptForm(false); loadDepartments(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleSignOut = async () => { await authLogout(); window.location.href = "/"; };

  return (
    <div className="min-h-screen text-white selection:bg-emerald-500/30">
      <AnimatedBackground />

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
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Clock size={12} className="text-white/40" />
              <span className="text-[11px] font-mono text-white/50">
                {liveTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button onClick={() => { showAIFuturistic("High", "Water Department", "92%"); }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Insights
            </button>
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              </button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-semibold">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <aside className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] transition-all duration-300 border-r border-white/[0.06] bg-[#080a0a]/60 backdrop-blur-2xl ${
        sidebarOpen ? 'w-56' : 'w-16'
      }`}>
        <div className="flex flex-col h-full py-4 px-2 overflow-y-auto">
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => handleTabChange(item.id as TabId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'
                  }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                  {sidebarOpen && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span className="ml-auto text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full">
                          {complaints.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="pt-4 mt-4 border-t border-white/[0.06]">
              <div className="px-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-mono text-emerald-400/80">System Online</span>
                </div>
                <p className="text-[10px] text-white/30 font-mono">
                  {liveTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className={`pt-20 pb-12 transition-all duration-300 relative z-10 min-h-screen ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
        <div className="px-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait" custom={tabDirection}>
            {activeTab === "overview" && (
              <OverviewTab kpis={kpis} trendsData={trendsData} deptPerfData={deptPerfData} prioData={prioData} loading={statsLoading} />
            )}
            {activeTab === "complaints" && (
              <ComplaintsTab complaints={complaints} officers={officers} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                complaintView={complaintView} setComplaintView={setComplaintView}
                handleStatusChange={handleStatusChange} handleAssign={handleAssign} />
            )}
            {activeTab === "departments" && (
              <DepartmentsTab departments={departments} complaints={complaints} loadingDepts={loadingDepts}
                loadDepartments={loadDepartments} showDeptForm={showDeptForm} setShowDeptForm={setShowDeptForm}
                editingDeptId={editingDeptId} deptFormName={deptFormName} setDeptFormName={setDeptFormName}
                deptFormDesc={deptFormDesc} setDeptFormDesc={setDeptFormDesc}
                setEditingDeptId={setEditingDeptId} handleCreateDept={handleCreateDept} handleUpdateDept={handleUpdateDept}
                setDeptDeleteTarget={setDeptDeleteTarget} />
            )}
            {activeTab === "users" && <UsersTab users={users} loadingUsers={loadingUsers} loadUsers={loadUsers} departments={departments} />}

            {activeTab === "map" && (
              <motion.div key="map" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5 h-[600px] flex flex-col">
                <div>
                  <h2 className="text-xl font-bold text-white font-heading">GIS Analytics</h2>
                  <p className="text-sm text-white/40 mt-0.5">Geospatial data and density mapping</p>
                </div>
                <div className="flex-grow rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] relative overflow-hidden flex items-center justify-center">
                  <Map className="w-24 h-24 text-white/[0.03] absolute z-0" />
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay z-0" />
                  <div className="z-20 p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl max-w-sm text-center shadow-2xl">
                    <h4 className="text-white font-bold mb-2">Map Engine Active</h4>
                    <p className="text-xs text-white/50 mb-4">Real-time geospatial data streams connected.</p>
                    <button className="px-6 py-2 bg-emerald-500 text-black rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors">Interact</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div key="analytics" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white font-heading">Deep Analytics</h2>
                  <p className="text-sm text-white/40 mt-0.5">Comprehensive insights and performance metrics</p>
                </div>
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
                      ].map((m) => (
                        <div key={m.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                          <span className="text-xs text-white/60">{m.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{m.value}</span>
                            <span className="text-[10px] font-semibold text-emerald-400">{m.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard glow>
                    <SectionHeader icon={TrendingUp} label="Monthly Trend" />
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{name:'W1',value:180},{name:'W2',value:220},{name:'W3',value:190},{name:'W4',value:250}]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.12)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
                            {[0,1,2,3].map((i) => (<Cell key={i} fill={['#10b981','#8b5cf6','#f59e0b','#06b6d4'][i]} />))}
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
                          <Radar name="Efficiency" dataKey="efficiency" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white font-heading">Audit & Security</h2>
                    <p className="text-sm text-white/40 mt-0.5">System activity logs</p>
                  </div>
                </div>
                <div className="rounded-xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                      <tr>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Timestamp</th>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Actor</th>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Action</th>
                        <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-white/40">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {[
                        { time: "2026-07-01 14:32:01", actor: "System Admin", action: "ROLE_CHANGE", target: "Sarah Connor" },
                        { time: "2026-07-01 12:15:44", actor: "Officer Ramesh", action: "STATUS_UPDATE", target: "Complaint C-8840" },
                        { time: "2026-07-01 10:05:12", actor: "Citizen John", action: "COMPLAINT_CREATED", target: "Complaint C-8841" },
                      ].map((log, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-mono text-xs text-white/40">{log.time}</td>
                          <td className="px-4 py-3 font-semibold text-white/80">{log.actor}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-white/60">{log.action}</span></td>
                          <td className="px-4 py-3 text-white/60">{log.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "broadcast" && (
              <motion.div key="broadcast" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white font-heading">Emergency Broadcast</h2>
                  <p className="text-sm text-white/40 mt-0.5">Send alerts to citizens and officers</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-black/40 backdrop-blur-xl border border-rose-500/20">
                    <h4 className="font-bold text-rose-400 mb-4 flex items-center gap-2"><ShieldAlert size={18} /> Compose Alert</h4>
                    <div className="space-y-4">
                      <select className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                        <option>All Citizens (Citywide)</option>
                        <option>Officers Only</option>
                      </select>
                      <input type="text" placeholder="e.g., Boil Water Advisory"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30" />
                      <textarea rows={4} placeholder="Details of the emergency..."
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none" />
                      <button onClick={() => toast.success("Broadcast sent")}
                        className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-black rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20">
                        Deploy Broadcast
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "budget" && (
              <motion.div key="budget" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white font-heading">Budget & Resources</h2>
                  <p className="text-sm text-white/40 mt-0.5">Financial overview</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Annual Budget</p>
                    <h4 className="text-2xl font-bold text-white font-heading"><AnimatedCounter value={4500000} prefix="$" duration={2} /></h4>
                  </div>
                  <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Expended (YTD)</p>
                    <h4 className="text-2xl font-bold text-white font-heading"><AnimatedCounter value={2100000} prefix="$" duration={2} /></h4>
                  </div>
                  <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Heavy Equipment</p>
                    <h4 className="text-2xl font-bold text-white font-heading"><AnimatedCounter value={42} duration={1.5} /><span className="text-lg text-white/60"> /50</span></h4>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div key="settings" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white font-heading">System Settings</h2>
                  <p className="text-sm text-white/40 mt-0.5">Configuration management</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard glow>
                    <SectionHeader icon={Settings} label="Core Configuration" />
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">SLA Target (Hours)</label>
                        <input type="number" defaultValue={48} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">Auto-Escalation (Hours)</label>
                        <input type="number" defaultValue={72} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <ConfirmModal open={deptDeleteTarget !== null} title="Delete Department"
        message={`Are you sure? This cannot be undone.`} confirmLabel="Delete" variant="danger"
        onConfirm={async () => {
          if (!deptDeleteTarget) return;
          try { await adminService.deleteDepartment(deptDeleteTarget.id); toast.success("Department deleted"); loadDepartments(); }
          catch (err: any) { toast.error(err.message); }
          finally { setDeptDeleteTarget(null); }
        }}
        onCancel={() => setDeptDeleteTarget(null)} />
    </div>
  );
}

export default withRoleGuard(AdminDashboard, ['ADMIN']);
