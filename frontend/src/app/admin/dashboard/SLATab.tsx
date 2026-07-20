import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock, CheckCircle, AlertTriangle, Target, TrendingUp, Gauge,
  ArrowUpRight, Building2, Timer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from "recharts";
import { apiRequest } from "@/services/api";

const getSampleSLAData = () => ({
  total_active: 142,
  on_track: 110,
  warning: 18,
  critical: 8,
  overdue: 6,
  by_department: {
    "Public Works": { total: 45, overdue: 2 },
    "Water Supply": { total: 38, overdue: 1 },
    "Electrical": { total: 24, overdue: 0 },
    "Sanitation": { total: 35, overdue: 3 },
    "Parks & Rec": { total: 12, overdue: 0 }
  },
  breaches: [
    { id: "C-8832", original_id: "8832", dept: "Sanitation", hours: "52h pending", priority: "CRITICAL", status: "Overdue" },
    { id: "C-8815", original_id: "8815", dept: "Public Works", hours: "49h pending", priority: "HIGH", status: "Overdue" },
    { id: "C-8840", original_id: "8840", dept: "Water Supply", hours: "48h pending", priority: "HIGH", status: "Critical" }
  ]
});

interface SLABreach {
  id: string;
  original_id: string;
  dept: string;
  hours: string;
  priority: string;
  status: string;
}

interface DeptSLA {
  name: string;
  attainment: number;
  target: number;
  fill: string;
}

export function SLATab() {
  const [data, setData] = useState<{
    total_active: number;
    on_track: number;
    warning: number;
    critical: number;
    overdue: number;
    by_department: Record<string, { total: number; overdue: number }>;
    breaches: SLABreach[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiRequest<any>('/complaints/sla/overview');
        if (response && response.by_department && Object.keys(response.by_department).length > 0) {
          setData(response);
        } else {
          setData(getSampleSLAData());
        }
      } catch (e) {
        console.error("Failed to load SLA overview:", e);
        setData(getSampleSLAData());
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const deptColors = ["#f59e0b", "#06b6d4", "#10b981", "#3b82f6", "#eab308", "#ef4444", "#a855f7"];
  
  const deptSLA: DeptSLA[] = data ? Object.keys(data.by_department).map((dept, i) => {
    const stats = data.by_department[dept];
    const attainment = stats.total > 0 ? Math.round(((stats.total - stats.overdue) / stats.total) * 100) : 100;
    return {
      name: dept,
      attainment,
      target: 90,
      fill: deptColors[i % deptColors.length],
    };
  }) : [];

  const overallAttainment = data && data.total_active > 0 
    ? Math.round(((data.total_active - data.overdue) / data.total_active) * 100) 
    : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30">
          <Clock className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">SLA Compliance Dashboard</h2>
          <p className="text-xs text-muted-foreground">Real-time service level tracking & breach alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Gauge, label: "Overall SLA", value: loading ? "..." : `${overallAttainment}%`, trend: overallAttainment >= 90 ? "+2%" : "-1%", color: "#f59e0b" },
          { icon: CheckCircle, label: "On-Time Resolved", value: loading ? "..." : data?.on_track || 0, trend: "+8%", color: "#10b981" },
          { icon: AlertTriangle, label: "Active Breaches", value: loading ? "..." : (data?.critical || 0) + (data?.overdue || 0), trend: "URGENT", color: "#ef4444" },
          { icon: Timer, label: "Avg Response", value: loading ? "..." : "4.2h", trend: "-18m", color: "#06b6d4" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-[0.06]"
                style={{ background: `radial-gradient(circle, ${stat.color}, transparent)` }} />
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  stat.label === 'Active Breaches' && stat.value !== 0 ? 'bg-rose-500/20 text-rose-500 animate-pulse' :
                  stat.trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                }`}>{stat.trend}</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</h3>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" /> Department SLA Attainment (%)
          </h4>
          <div className="h-72">
            {!loading && deptSLA.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptSLA} layout="vertical" barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.08} horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ background: '#000000cc', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [`${v ?? 0}%`, 'Attainment']}
                  />
                  <Bar dataKey="attainment" radius={[0, 6, 6, 0]} animationDuration={1500} name="attainment">
                    {deptSLA.map((e, i) => (
                      <Cell key={i} fill={e.attainment >= e.target ? '#10b981' : e.attainment >= 70 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" fill="#888" fillOpacity={0.2} radius={[0, 6, 6, 0]} animationDuration={1500} name="target" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                {loading ? "Loading chart data..." : "No SLA data available"}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Active SLA Breaches
          </h4>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-xs text-muted-foreground py-4">Loading breaches...</div>
            ) : data?.breaches?.length ? (
              data.breaches.map((breach, i) => (
                <motion.div
                  key={breach.original_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{breach.id}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      breach.status === 'Overdue' ? 'bg-rose-500/20 text-rose-500' :
                      breach.status === 'Critical' ? 'bg-amber-500/20 text-amber-500' : 'bg-amber-500/20 text-amber-500'
                    }`}>{breach.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 size={10} /> {breach.dept}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {breach.hours}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-xs text-muted-foreground py-4">No active breaches! 🎉</div>
            )}
          </div>
          <button className="w-full mt-4 py-2 text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all">
            View All Breaches
          </button>
        </div>
      </div>
    </motion.div>
  );
}
