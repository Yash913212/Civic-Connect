"use client";

import { withRoleGuard } from "@/middleware/roleGuard";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Clock, AlertTriangle, Building2, Search, MapPin, RefreshCw, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { complaintService, type ComplaintData } from "@/services/complaintService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    High: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    Medium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    Low: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Unassigned: "bg-slate-500/15 border-slate-500/30 text-slate-400",
    Assigned: "bg-teal-500/15 border-teal-500/30 text-teal-400",
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

function ProgressStepper({ status }: { status: string }) {
  const steps = [
    { label: "Submitted", desc: "Complaint received by portal" },
    { label: "Assigned", desc: "Assigned to department officer" },
    { label: "In Progress", desc: "Officer is investigating/fixing" },
    { label: "Resolved", desc: "Issue resolved and verified" },
  ];

  let currentStep = 0; // default Submitted
  if (status === "Assigned") {
    currentStep = 1;
  } else if (status === "In Progress" || status === "Escalated") {
    currentStep = 2;
  } else if (status === "Resolved") {
    currentStep = 3;
  }

  return (
    <div className="mt-4 border-t border-black/5 dark:border-white/5 pt-4">
      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3">Resolution Progress</p>
      <div className="relative flex justify-between items-center w-full max-w-2xl">
        {/* Connection line background */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-black/10 dark:bg-white/10 -z-0" />
        {/* Connection line active fill */}
        <div 
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-primary to-purple-500 -z-0 transition-all duration-500 ease-out" 
          style={{ width: `${(currentStep / 3) * 88}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStep;
          return (
            <div key={step.label} className="flex flex-col items-center text-center flex-1 relative z-10">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all duration-300 ${
                  isCompleted 
                    ? "bg-gradient-to-r from-primary to-purple-500 border-transparent text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] scale-105" 
                    : "bg-white dark:bg-zinc-900 border-black/10 dark:border-white/10 text-muted-foreground"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 transition-colors duration-200 ${
                isCompleted ? "text-foreground font-bold" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
              <span className="text-[8px] text-muted-foreground/60 hidden md:block max-w-[120px] leading-tight mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CitizenComplaints() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ComplaintData | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    complaintService.getMy()
      .then(data => {
        setComplaints(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (c: ComplaintData) => {
    setDeleteTarget(c);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await complaintService.delete(deleteTarget.id);
      setComplaints(prev => prev.filter(x => x.id !== deleteTarget.id));
      toast.success("Complaint deleted");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const startEdit = (c: ComplaintData) => {
    setEditingId(c.id);
    setEditTitle(c.title);
    setEditDesc(c.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDesc("");
  };

  const saveEdit = async (c: ComplaintData) => {
    try {
      const updated = await complaintService.update(c.id, { title: editTitle, description: editDesc });
      setComplaints(prev => prev.map(x => x.id === c.id ? { ...x, ...updated } : x));
      toast.success("Complaint updated");
      cancelEdit();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = complaints.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="bg-transparent text-foreground min-h-screen pt-24 pb-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button onClick={() => router.push('/citizen/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <motion.span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-4"
            >
              <ClipboardList className="w-3 h-3" /> Track Status
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Complaints</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Monitor the status of your submitted issues</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all w-44" />
            </div>
            <button onClick={load} className="p-2 bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your complaints...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mb-4" />
            <p className="text-sm text-rose-400 font-semibold mb-2">Could not load complaints</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <button onClick={load} className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm font-semibold text-primary hover:bg-primary/20 transition-all">Retry</button>
          </div>
        )}

        {!loading && !error && complaints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No complaints yet</h3>
            <p className="text-sm text-muted-foreground">Use the AI Demo on the dashboard to submit your first complaint.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-white/70 dark:bg-black/50 backdrop-blur-xl rounded-2xl p-5 border border-black/10 dark:border-white/10 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 blur transition duration-500" />
                <div className="relative flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1 flex flex-col sm:flex-row gap-4 items-start w-full">
                      <div className="shrink-0 w-full sm:w-36 h-48 sm:h-32 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm relative group/img">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
                        <img
  src={
    c.image_url
      ? `http://localhost:8000${c.image_url}`
      : "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80"
  }
  alt={c.title}
  className="w-full h-full object-cover"
/>
                      </div>
                      <div className="flex-1 w-full flex flex-col h-full justify-between">
                        <div>
                          {editingId === c.id ? (
                            <div className="space-y-2 mb-3">
                              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50" />
                              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                                className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(c)}
                                  className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-lg text-xs font-semibold text-primary hover:bg-primary/20 transition-all">Save</button>
                                <button onClick={cancelEdit}
                                  className="px-3 py-1 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-mono text-muted-foreground">#{c.id.substring(0, 8)}</span>
                                <h4 className="font-bold text-foreground text-lg">{c.title}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">{c.description}</p>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-black/5 dark:border-white/5 mt-auto">
                          <span className="flex items-center gap-1 font-medium"><Building2 size={12} className="text-primary/70" /> {c.dept}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-teal-500/70" /> {c.address?.substring(0, 40) || c.location}</span>
                          <span className="flex items-center gap-1"><Clock size={12} className="text-amber-500/70" /> {new Date(c.time).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-black/5 dark:border-white/5 mt-2 lg:mt-0 lg:w-[140px]">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => startEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <ProgressStepper status={c.status} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Complaint"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}

export default withRoleGuard(CitizenComplaints, ['CITIZEN', 'ADMIN']);
