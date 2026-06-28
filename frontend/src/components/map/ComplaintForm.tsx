"use client";

import { useState, useEffect } from "react";
import { MapPin, Send, CheckCircle2, Loader2, Upload, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import MapPicker from "./MapPicker";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || "http://localhost:8000";

interface LocationResult {
  lat: string;
  lng: string;
  display_name: string;
}

interface DraftData {
  title: string;
  description: string;
  department: string;
  priority: string;
  imageUrl: string;
  issue: string;
  modality: string;
}

export default function ComplaintForm() {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [showUpload, setShowUpload] = useState(false);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualPreview, setManualPreview] = useState<string | null>(null);
  const [manualDescription, setManualDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("complaint_draft");
    if (stored) {
      try {
        setDraft(JSON.parse(stored));
        sessionStorage.removeItem("complaint_draft");
      } catch {}
    }
  }, []);

  const submitComplaint = async () => {
    if (!selectedLocation) {
      toast.error("Please select a location on the map");
      return;
    }
    setStatus("submitting");
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        title: draft?.title || manualFile?.name || "Civic Issue",
        description: draft?.description || manualDescription || "No description provided",
        location: selectedLocation.display_name,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.display_name,
        department: draft?.department || "General",
        priority: (draft?.priority || "low").charAt(0).toUpperCase() + (draft?.priority || "low").slice(1),
        image_url: draft?.imageUrl || "",
      };
      const res = await fetch(`${API_BASE}/complaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("done");
      toast.success("Complaint registered!");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
    } catch {
      toast.error("Failed to register complaint");
      setStatus("error");
    }
  };

  const handleManualFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setManualFile(file);
    if (manualPreview) URL.revokeObjectURL(manualPreview);
    setManualPreview(URL.createObjectURL(file));
  };

  const runAIAnalysis = async () => {
    if (!manualFile && !manualDescription.trim()) {
      toast.error("Upload an image or describe the issue"); return;
    }
    setIsAnalyzing(true);
    try {
      if (manualFile) {
        const fd = new FormData();
        fd.append("file", manualFile);
        if (manualDescription.trim()) fd.append("description", manualDescription);
        const res = await fetch(`${API_BASE}/ai/analyze`, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Analysis failed");
        const data = await res.json();
        setDraft({
          title: data.issue || "Civic Issue",
          description: data.complaint || manualDescription,
          department: data.department || "General",
          priority: (data.priority || "low").toLowerCase(),
          imageUrl: "",
          issue: data.issue,
          modality: data.modality,
        });
      } else {
        const res = await fetch(`${API_BASE}/analyze_text`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: manualDescription }),
        });
        if (!res.ok) throw new Error("Analysis failed");
        const result = await res.json();
        setDraft({
          title: result.analysis?.title || "Civic Issue",
          description: result.analysis?.description || manualDescription,
          department: result.analysis?.department || "General",
          priority: (result.analysis?.priority || "low").toLowerCase(),
          imageUrl: "",
          issue: result.analysis?.title,
          modality: "text-only",
        });
      }
      setShowUpload(false);
      toast.success("AI analysis complete");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const priorityColor = (p: string) => {
    const map: Record<string, string> = {
      high: "text-red-500 bg-red-500/10 border-red-500/30",
      medium: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      low: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    };
    return map[p?.toLowerCase()] || map.low;
  };

  if (status === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Complaint Registered!</h3>
        <p className="text-muted-foreground mb-1">Routed to {draft?.department || "concerned department"}.</p>
        <p className="text-xs text-muted-foreground mb-8">Track its status from your dashboard.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all">
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* AI Analysis Summary */}
      {draft ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="bg-black/5 dark:bg-white/5 border border-primary/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(var(--primary),0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Analysis Results</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Issue</div>
                <div className="text-sm font-semibold capitalize mt-0.5">{draft.issue || "—"}</div>
              </div>
              <div className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Department</div>
                <div className="text-sm font-semibold text-primary mt-0.5">{draft.department}</div>
              </div>
              <div className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Priority</div>
                <div className="mt-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityColor(draft.priority)}`}>
                    {(draft.priority || "low").toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Modality</div>
                <div className="text-sm font-semibold capitalize mt-0.5">{draft.modality || "text"}</div>
              </div>
            </div>
            {draft.description && (
              <div className="mt-3 bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Summary</div>
                <p className="text-sm text-muted-foreground">{draft.description}</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-6 text-center">
            <Brain className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">No AI analysis yet. Upload a photo or describe an issue on the Live Demo first, or analyze here.</p>
            <button onClick={() => setShowUpload(!showUpload)} className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all">
              {showUpload ? "Cancel" : "Analyze Here"}
            </button>

            {showUpload && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 space-y-3 text-left max-w-md mx-auto">
                <input type="file" accept="image/*" className="hidden" id="manual-upload" onChange={handleManualFile} />
                {manualPreview ? (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                    <img src={manualPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => { setManualFile(null); if (manualPreview) URL.revokeObjectURL(manualPreview); setManualPreview(null); }} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white text-xs">✕</button>
                  </div>
                ) : (
                  <label htmlFor="manual-upload" className="flex items-center justify-center h-24 border-2 border-dashed border-black/10 dark:border-white/20 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
                    <Upload className="w-5 h-5 text-muted-foreground mr-2" />
                    <span className="text-xs text-muted-foreground">Upload photo</span>
                  </label>
                )}
                <textarea
                  value={manualDescription} onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={2}
                  className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
                />
                <button onClick={runAIAnalysis} disabled={isAnalyzing || (!manualFile && !manualDescription.trim())}
                  className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Map */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Select Location on Map
        </h3>
        <MapPicker onLocationSelect={setSelectedLocation} selectedLocation={selectedLocation} />
      </div>

      {/* Submit */}
      {draft && (
        <button
          onClick={submitComplaint}
          disabled={!selectedLocation || status === "submitting"}
          className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-base"
        >
          {status === "submitting" ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-5 h-5" /> Submit Complaint</>
          )}
        </button>
      )}
    </div>
  );
}
