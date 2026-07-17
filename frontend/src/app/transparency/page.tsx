"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  MapPin,
  RefreshCw
} from "lucide-react";
import { API_BASE } from "@/services/api";

interface PublicStats {
  total_complaints: number;
  resolution_rate: number;
  avg_resolution_hours: number;
  recent_complaints_7d: number;
  status_distribution: Record<string, number>;
  department_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
}

interface TrendingIssue {
  department: string;
  count: number;
}

interface DepartmentPerformance {
  department: string;
  total_complaints: number;
  resolved: number;
  resolution_rate: number;
  avg_resolution_hours: number;
}

interface WardStats {
  ward: string;
  total: number;
  resolved: number;
  pending: number;
}

export default function TransparencyPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [trending, setTrending] = useState<{ top_departments: TrendingIssue[]; top_locations: TrendingIssue[] } | null>(null);
  const [performance, setPerformance] = useState<DepartmentPerformance[]>([]);
  const [wards, setWards] = useState<WardStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, trendingRes, perfRes, wardsRes] = await Promise.all([
        fetch(`${API_BASE}/transparency/public/stats`),
        fetch(`${API_BASE}/transparency/public/trending`),
        fetch(`${API_BASE}/transparency/public/performance`),
        fetch(`${API_BASE}/transparency/public/wards`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (trendingRes.ok) setTrending(await trendingRes.json());
      if (perfRes.ok) setPerformance(await perfRes.json());
      if (wardsRes.ok) setWards(await wardsRes.json());
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch transparency data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatHours = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Public <span className="text-emerald-500">Transparency</span> Portal
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Real-time city governance metrics. See how we&apos;re performing on civic issue resolution.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </motion.div>

        {/* Key Metrics */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-slate-400 text-sm">Total Complaints</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_complaints.toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-slate-400 text-sm">Resolution Rate</span>
              </div>
              <p className="text-3xl font-bold text-emerald-500">{stats.resolution_rate}%</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-slate-400 text-sm">Avg. Resolution Time</span>
              </div>
              <p className="text-3xl font-bold text-white">{formatHours(stats.avg_resolution_hours)}</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-slate-400 text-sm">Last 7 Days</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.recent_complaints_7d}</p>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Department Distribution */}
          {stats && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                Complaints by Department
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.department_distribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([dept, count]) => {
                    const percentage = (count / stats.total_complaints) * 100;
                    return (
                      <div key={dept}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">{dept}</span>
                          <span className="text-slate-400">{count}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* Trending Issues */}
          {trending && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Trending Issues (30 Days)
              </h3>
              <div className="space-y-3">
                {trending.top_departments.map((item, index) => (
                  <div key={item.department} className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm font-mono w-6">#{index + 1}</span>
                    <div className="flex-1">
                      <span className="text-slate-200">{item.department}</span>
                    </div>
                    <span className="text-emerald-500 font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Department Performance */}
        {performance.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              Department Performance Rankings
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Resolved</th>
                    <th className="pb-3 font-medium">Resolution Rate</th>
                    <th className="pb-3 font-medium">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((dept, index) => (
                    <tr key={dept.department} className="border-b border-slate-700/50">
                      <td className="py-4 text-slate-400 font-mono">#{index + 1}</td>
                      <td className="py-4 text-white font-medium">{dept.department}</td>
                      <td className="py-4 text-slate-300">{dept.total_complaints}</td>
                      <td className="py-4 text-emerald-500">{dept.resolved}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500"
                              style={{ width: `${dept.resolution_rate}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-sm">{dept.resolution_rate}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300">{formatHours(dept.avg_resolution_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Ward Statistics */}
        {wards.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              Area-wise Complaint Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wards.slice(0, 9).map((ward) => (
                <div key={ward.ward} className="bg-slate-700/30 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2 truncate">{ward.ward}</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total: {ward.total}</span>
                    <span className="text-emerald-500">Resolved: {ward.resolved}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${ward.total > 0 ? (ward.resolved / ward.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Refresh Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </motion.div>
      </div>
    </div>
  );
}
