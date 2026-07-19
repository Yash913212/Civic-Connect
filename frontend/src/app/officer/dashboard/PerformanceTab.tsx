"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Activity, Target, TrendingUp, BarChart3, FileText, MapPin, AlertTriangle, Users, Award, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import type { ComplaintData } from "@/services/complaintService";
import { gamificationService, type GamificationProfile, type LeaderboardEntry } from "@/services/gamificationService";

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

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.97 }),
};

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

function ActivityFeed({ complaints }: { complaints: ComplaintData[] }) {
  const resolvedComplaints = complaints.filter(c => c.status === "Resolved");
  
  const activities = resolvedComplaints.slice(0, 3).map(c => ({
    icon: CheckCircle,
    text: `C-${c.id.substring(0, 4).toUpperCase()} marked as Resolved`,
    time: "Recently",
    color: "#10b981"
  }));

  // Fallback default activities
  if (activities.length < 5) {
    const fallbacks = [
      { icon: FileText, text: "New complaint assigned to you", time: "2m ago", color: "#10b981" },
      { icon: MapPin, text: "Field visit requested at 5th Ave", time: "1h ago", color: "#06b6d4" },
      { icon: AlertTriangle, text: "Backup requested at Main St.", time: "2h ago", color: "#f59e0b" },
      { icon: Users, text: "Shift swap approved", time: "4h ago", color: "#8b5cf6" },
      { icon: Award, text: "Performance rating: 4.8/5", time: "6h ago", color: "#f97316" },
    ];
    activities.push(...fallbacks.slice(0, 5 - activities.length));
  }

  return (
    <div className="space-y-1">
      {activities.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors group cursor-default">
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0" style={{ color: a.color }}>
              <Icon size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate group-hover:text-white/90 transition-colors">{a.text}</p>
            </div>
            <span className="text-[10px] text-white/30 shrink-0">{a.time}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function PerformanceTab({ complaints, loading }: { complaints: ComplaintData[]; loading: boolean }) {
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const resolutionRate = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0;

  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {}
    }
  }, []);

  useEffect(() => {
    async function fetchGamificationData() {
      try {
        const [profileData, leaderboardData] = await Promise.all([
          gamificationService.getProfile(),
          gamificationService.getLeaderboard(10, "OFFICER")
        ]);
        setProfile(profileData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error("Failed to load officer gamification data", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchGamificationData();
  }, [complaints]);

  // Compute recent awards dynamically
  const resolvedComplaints = complaints.filter(c => c.status === "Resolved");
  const recentAwards = resolvedComplaints.map(c => {
    let pts = 25;
    if (c.priority === "Critical") pts = 150;
    else if (c.priority === "High") pts = 100;
    else if (c.priority === "Medium") pts = 50;

    return {
      title: `Resolved ${c.priority} Task (C-${c.id.substring(0, 4).toUpperCase()})`,
      points: pts
    };
  });

  // Default mock recent awards if none are resolved yet
  if (recentAwards.length === 0) {
    recentAwards.push(
      { title: "Under 2Hr SLA Resolution", points: 50 },
      { title: "5-Star Citizen Rating", points: 100 }
    );
  }

  // Helper to resolve officer rank title
  const getRankTitle = (lvl: number) => {
    if (lvl >= 10) return "Master Responder";
    if (lvl >= 9) return "Senior Resolver";
    if (lvl >= 8) return "Field Expert";
    if (lvl >= 6) return "Active Duty";
    return "Cadet Officer";
  };

  const pointsVal = profile?.points ?? 3450;
  const levelVal = profile?.level ?? 8;
  const progressVal = profile?.level_progress_percentage ?? 75;
  const toNextVal = profile?.points_to_next_level ?? 550;
  const nextRank = getRankTitle(levelVal + 1);

  // Render leaderboard entries (fall back to mock entries if empty/loading)
  const renderedLeaderboard = leaderboard.length > 0 
    ? leaderboard.map(entry => ({
        rank: entry.rank,
        name: entry.name,
        points: entry.points,
        badge: getRankTitle(entry.level),
        isMe: entry.user_id === currentUser?.id || entry.name === currentUser?.full_name
      }))
    : [
        { rank: 1, name: "Officer Sarah", points: 4250, badge: "Master Responder", isMe: false },
        { rank: 2, name: "Officer Marcus", points: 3890, badge: "Senior Resolver", isMe: false },
        { rank: 3, name: "You", points: 3450, badge: "Field Expert", isMe: true },
        { rank: 4, name: "Officer David", points: 3100, badge: "Active Duty", isMe: false },
      ];

  return (
    <motion.div key="performance" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">Performance Metrics</h2>
        <p className="text-sm text-slate-500 dark:text-white/40 mt-0.5">Track your field performance and resolution stats</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard glow className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <SectionHeader icon={Trophy} label="Officer Bonus Points" />
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-20 h-20 rounded-full border-4 border-amber-500/30 flex items-center justify-center bg-black/40">
              <Trophy className="w-8 h-8 text-amber-500" />
              <div className="absolute -bottom-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-black">Lvl {levelVal}</div>
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{pointsVal.toLocaleString()} <span className="text-sm font-medium text-slate-500 dark:text-white/50">PTS</span></h3>
              <p className="text-xs text-amber-400 font-semibold mb-2">Rank: {getRankTitle(levelVal)}</p>
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 animate-pulse" style={{ width: `${progressVal}%` }} />
              </div>
              <p className="text-[9px] text-slate-500 dark:text-white/40 mt-1">{toNextVal} pts to Next Rank ({nextRank})</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">Recent Point Awards</h4>
            {recentAwards.slice(0, 3).map((award, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-black/40 rounded-lg border border-white/5">
                <span className="text-slate-300 dark:text-white/80">{award.title}</span>
                <span className="text-emerald-400 font-bold">+{award.points} pts</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard glow>
          <SectionHeader icon={Users} label="Department Leaderboard" />
          <div className="space-y-3">
            {renderedLeaderboard.map((off, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${off.isMe ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-black/40 border-white/[0.06] hover:bg-white/[0.03]'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${off.rank === 1 ? 'bg-amber-400 text-black shadow-amber-500/30' : off.rank === 2 ? 'bg-slate-300 text-black' : off.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white/50'}`}>
                  {off.rank}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${off.isMe ? 'text-amber-400' : 'text-slate-900 dark:text-white'}`}>{off.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-white/50">{off.badge}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{off.points.toLocaleString()} <span className="text-[10px] text-emerald-400/60">pts</span></p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard glow>
        <SectionHeader icon={Activity} label="Recent Activity" />
        <ActivityFeed complaints={complaints} />
      </GlassCard>
    </motion.div>
  );
}
