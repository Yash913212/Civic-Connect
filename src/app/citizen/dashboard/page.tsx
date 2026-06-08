"use client";

import { useEffect, useState } from "react";
import { withRoleGuard } from "@/middleware/roleGuard";
import { ComplaintService, Complaint } from "@/services/complaints.service";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, MapPin, Plus, FileText, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/authContext";

function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isReporting, setIsReporting] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", location: "" });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const data = await ComplaintService.getMyComplaints();
      setComplaints(data);
    } catch (error) {
      console.error("Failed to load complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await ComplaintService.create(formData);
      setFormData({ title: "", description: "", location: "" });
      setIsReporting(false);
      await loadComplaints();
    } catch (error) {
      console.error("Failed to submit complaint:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ['SUBMITTED', 'ASSIGNED'].includes(c.status)).length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'ASSIGNED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'IN_PROGRESS': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'RESOLVED':
      case 'CLOSED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <main className="bg-[#050505] text-white min-h-screen relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505] z-0 pointer-events-none" />
      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Citizen'}
          </h1>
          <p className="text-gray-400 text-lg">Manage your civic reports and track their resolution progress.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Reports', value: stats.total, icon: FileText, color: 'text-white' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-blue-400' },
            { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'text-amber-400' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-400' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                <stat.icon className={`w-5 h-5 ${stat.color} opacity-70`} />
              </div>
              <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-semibold text-white/90">Your Reports</h2>
              <button 
                onClick={() => setIsReporting(!isReporting)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
              >
                <Plus className={`w-4 h-4 transition-transform duration-300 ${isReporting ? 'rotate-45' : ''}`} />
                {isReporting ? 'Cancel' : 'New Report'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isReporting ? (
                <motion.form
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  onSubmit={handleSubmit}
                  className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    Submit a New Issue
                  </h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Issue Title</label>
                      <input 
                        required
                        type="text" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        placeholder="E.g., Large pothole on Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          required
                          type="text" 
                          value={formData.location}
                          onChange={e => setFormData({...formData, location: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                          placeholder="Address or landmark"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Detailed Description</label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none"
                        placeholder="Describe the issue in detail..."
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitLoading}
                      className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                      {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit to Command Center'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : complaints.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.01]">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl text-white/80 font-medium">No reports yet</h3>
                      <p className="text-gray-500 mt-2">Your submitted issues will appear here.</p>
                    </div>
                  ) : (
                    complaints.map((complaint, idx) => (
                      <motion.div 
                        key={complaint.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium tracking-wide ${getStatusColor(complaint.status)}`}>
                              {complaint.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">{new Date(complaint.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-lg font-medium text-white/90 truncate mb-1">{complaint.title}</h4>
                          <p className="text-sm text-gray-500 truncate">{complaint.location}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white/90 mb-4">Activity Timeline</h3>
              <div className="relative pl-4 border-l border-white/10 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <p className="text-sm font-medium text-white/80">System Online</p>
                  <p className="text-xs text-gray-500 mt-1">Ready for new reports</p>
                </div>
                {complaints.slice(0, 3).map((c, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white/20" />
                    <p className="text-sm font-medium text-white/80">Report Updated</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{c.title}</p>
                    <p className="text-xs text-blue-400 mt-1">{c.status.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default withRoleGuard(CitizenDashboard, ['CITIZEN', 'ADMIN']);
