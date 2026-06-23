"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Mic, CheckCircle2, X, Brain, Eye, MessageSquareText, Speech, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || "http://localhost:8000";

const DEPT_COLORS: Record<string, string> = {
  roads: "bg-amber-500", drainage: "bg-cyan-500", garbage: "bg-emerald-500",
  water: "bg-blue-500", streetlight: "bg-yellow-400", electricity: "bg-orange-500",
  safety: "bg-red-500", traffic: "bg-purple-500",
};

const DEPT_LABELS: Record<string, string> = {
  roads: "Roads Dept", drainage: "Drainage Dept", garbage: "Sanitation",
  water: "Water Works", streetlight: "Electrical Dept", electricity: "Power Distribution",
  safety: "Public Safety", traffic: "Traffic Management",
};

const safeNum = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function LiveDemo() {
  const [step, setStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("te");
  const [activeTab, setActiveTab] = useState<"upload" | "voice">("upload");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (loading) {
      setStep(1);
      const t2 = setTimeout(() => setStep(2), 1200);
      const t3 = setTimeout(() => setStep(3), 2500);
      return () => { clearTimeout(t2); clearTimeout(t3); };
    }
  }, [loading]);

  const reset = () => {
    setStep(0); setLoading(false); setAnalysisResult(null);
    setUploadedFile(null); setSelectedFile(null); setAudioBlob(null);
    setComplaintStatus("idle");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProcessAI = async () => {
    if (!selectedFile && !textInput.trim()) {
      toast.error("Please upload an image or describe the issue"); return;
    }
    setLoading(true);
    setAnalysisResult(null);

    try {
      let data: any;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (textInput.trim()) formData.append("description", textInput);
        const res = await fetch(`${API_BASE}/ai/analyze`, { method: "POST", body: formData });
        if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
        data = await res.json();
      } else {
        const res = await fetch(`${API_BASE}/analyze_text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textInput }),
        });
        if (!res.ok) throw new Error(`Text analysis failed: ${res.status}`);
        const result = await res.json();
        data = {
          issue: result.analysis?.title || result.analysis?.department || "Unknown",
          department: result.analysis?.department || "General",
          department_confidence: parseFloat(result.analysis?.confidence) || 0,
          priority: (result.analysis?.priority || "low").toLowerCase(),
          priority_confidence: 0,
          vision_confidence: 0,
          text_confidence: parseFloat(result.analysis?.confidence) || 0,
          complaint: result.analysis?.description || textInput,
          modality: "text-only",
        };
      }

      setAnalysisResult(data);
      setStep(4);

    } catch (err: any) {
      toast.error(`Analysis failed: ${err.message}`);
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setIsRecording(true);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());

        try {
          const fd = new FormData();
          fd.append("file", blob, "voice.webm");
          fd.append("language", selectedLanguage);
          const res = await fetch(`${API_BASE}/ai/transcribe`, { method: "POST", body: fd });
          const data = await res.json();
          if (data.transcription) {
            setTextInput(data.transcription);
            toast.success("Voice transcribed");
          }
        } catch { toast.error("Transcription failed"); }
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      }, 5000);
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const handleRegisterComplaint = async () => {
    if (!analysisResult) return;
    setComplaintStatus("submitting");
    try {
      const payload = {
        title: analysisResult.issue || "Civic Issue",
        description: analysisResult.complaint || textInput,
        location: "Auto-detected",
        department: analysisResult.department || "General",
        priority: (analysisResult.priority || "low").charAt(0).toUpperCase() + (analysisResult.priority || "low").slice(1),
        image_url: "",
      };
      const res = await fetch(`${API_BASE}/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setComplaintStatus("done");
      toast.success(`Complaint registered — ${analysisResult.department}`);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch {
      setComplaintStatus("error");
      toast.error("Failed to register complaint. Try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const Bar = ({ label, value, maxVal, color }: { label: string; value: number; maxVal: number; color: string }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 truncate text-right text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (value / maxVal) * 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="w-12 text-right font-mono text-muted-foreground">{value.toFixed(1)}%</span>
    </div>
  );

  const PriorityBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      high: "bg-red-500/20 text-red-400 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[level] || colors.low}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  return (
    <section className="py-32 w-full bg-transparent relative" id="live-demo">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-heading font-bold mb-4 text-center"
        >
          Live AI Demo
        </motion.h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Upload a photo, describe the issue in Telugu/English/Hindi, or use voice.
          Our multimodal AI analyzes both image and text together.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Input */}
          <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-6 flex flex-col h-[700px]">
            <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-primary" />
              1. Input
            </h3>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab("upload")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "upload" ? "bg-primary text-white" : "bg-black/10 dark:bg-white/10 text-muted-foreground"}`}>
                <Upload className="w-4 h-4 inline mr-1" /> Image
              </button>
              <button onClick={() => setActiveTab("voice")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "voice" ? "bg-primary text-white" : "bg-black/10 dark:bg-white/10 text-muted-foreground"}`}>
                <Speech className="w-4 h-4 inline mr-1" /> Voice
              </button>
            </div>

            {activeTab === "upload" && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div onClick={() => { if (!selectedFile) fileInputRef.current?.click(); }}
                  className="flex-1 border-2 border-dashed border-black/10 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:bg-black/5 dark:bg-white/5 transition-colors cursor-pointer mb-4 relative overflow-hidden min-h-[180px]">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      </div>
                      {step === 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handleFileChange({ target: { files: null } } as any); }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white/80 hover:text-white z-10">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-10 h-10 mb-3 mx-auto opacity-50" />
                      <p className="text-sm">Upload civic issue photo</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "voice" && (
              <div className="flex-1 flex flex-col items-center justify-center mb-4 border-2 border-dashed border-black/10 dark:border-white/20 rounded-2xl p-6">
                <button
                  onMouseDown={startRecording} onMouseUp={stopRecording}
                  onTouchStart={startRecording} onTouchEnd={stopRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-red-500 scale-110 shadow-lg shadow-red-500/30" : "bg-primary/20 hover:bg-primary/30"}`}>
                  <Mic className={`w-8 h-8 ${isRecording ? "text-white animate-pulse" : "text-primary"}`} />
                </button>
                <p className="text-sm text-muted-foreground mt-4">
                  {isRecording ? "Recording... release to stop" : "Hold to record (max 5s)"}
                </p>
                {audioBlob && <p className="text-xs text-primary mt-2">Voice captured!</p>}
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="mt-4 px-3 py-2 rounded-lg bg-black/10 dark:bg-white/10 text-sm">
                  <option value="te">Telugu</option>
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                </select>
              </div>
            )}

            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-black/5 dark:border-white/10">
              <p className="text-xs text-muted-foreground mb-2">Describe issue (Telugu/English/Hindi):</p>
              {selectedFile && !textInput.trim() && (
                <p className="text-[10px] text-amber-500 mb-1 flex items-center gap-1">
                  Tip: Describe the issue for best accuracy
                </p>
              )}
              <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                placeholder="'road lo pedda gunta undi' or 'water leakage'"
                className="w-full bg-transparent border-b border-black/10 dark:border-white/20 text-sm py-2 focus:outline-none focus:border-primary"
                onKeyDown={(e) => e.key === "Enter" && handleProcessAI()} />
              <button onClick={handleProcessAI} disabled={loading || (!selectedFile && !textInput.trim())}
                className="w-full mt-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {loading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> AI Analyzing...</span>
                ) : (
                  <><Brain className="w-4 h-4" /> Analyze with Multimodal AI</>
                )}
              </button>
            </div>
          </div>

          {/* Center: Pipeline */}
          <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-6 flex flex-col h-[700px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <h3 className="text-xl font-medium mb-6 relative z-10 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              2. AI Pipeline
            </h3>

            <div className="flex-1 flex flex-col justify-center gap-5 relative z-10">
              {[
                { id: 1, text: "Vision Encoder (EfficientNetB0) — analyzing image", icon: Eye },
                { id: 2, text: "Text Encoder (MuRIL Transformer) — reading description", icon: MessageSquareText },
                { id: 3, text: "Fusion Layer — combining vision + text signals", icon: Brain },
                { id: 4, text: "Department & Priority Classification", icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0
                      ${step >= item.id ? 'border-primary bg-primary text-white' :
                        step === item.id - 1 ? 'border-primary text-primary animate-pulse' :
                          'border-black/10 dark:border-white/20 text-transparent'}`}
                    >
                      {step >= item.id ? <CheckCircle2 className="w-4 h-4" /> :
                       step === item.id - 1 ? <Icon className="w-4 h-4 animate-pulse" /> :
                       <Icon className="w-4 h-4 text-muted-foreground/30" />}
                    </div>
                    <span className={`${step >= item.id ? 'text-foreground' : 'text-muted-foreground'} text-xs font-mono`}>
                      {item.text}
                    </span>
                  </div>
                );
              })}

              {step >= 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-primary font-mono">
                    ✅ Complete — {analysisResult?.modality === "vision+text" ? "Multimodal (Vision + Text)" : analysisResult?.modality === "text-only" ? "Text-only (MuRIL)" : "Vision-only (EfficientNetB0)"}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Results */}
          <div className="bg-black/5 dark:bg-white/5 border border-primary/30 rounded-3xl p-6 flex flex-col h-[700px] overflow-hidden shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              3. Results
            </h3>

            <AnimatePresence mode="wait">
              {step >= 4 && analysisResult ? (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-3 overflow-y-auto scrollbar-thin">
                  {/* Image thumbnail */}
                  {previewUrl && (
                    <div className="relative h-32 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                      <img src={previewUrl} alt="Uploaded" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <span className="text-xs text-white/80 font-medium capitalize">{analysisResult.issue || "Issue"}</span>
                      </div>
                    </div>
                  )}

                  {/* Issue + Department + Priority */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Issue</div>
                      <div className="text-sm font-semibold capitalize">{analysisResult.issue || "—"}</div>
                    </div>
                    <div className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Department</div>
                      <div className="text-sm font-semibold text-primary">{DEPT_LABELS[analysisResult.department] || analysisResult.department}</div>
                    </div>
                    <div className="bg-white/80 dark:bg-black/40 rounded-xl p-3 border border-black/5 dark:border-white/10">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Priority</div>
                      <PriorityBadge level={analysisResult.priority || "low"} />
                    </div>
                  </div>

                  {/* Confidence scores */}
                  <div className="bg-white/80 dark:bg-black/40 rounded-xl p-4 border border-black/5 dark:border-white/10">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Confidence Scores</div>
                    <div className="space-y-1.5">
                      {analysisResult.modality !== "text-only" && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Vision (EfficientNetB0)</span>
                          <span className="font-mono font-semibold">{safeNum(analysisResult.vision_confidence).toFixed(1)}%</span>
                        </div>
                      )}
                      {analysisResult.modality !== "vision-only" && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Text (MuRIL)</span>
                          <span className="font-mono font-semibold">{safeNum(analysisResult.text_confidence).toFixed(1)}%</span>
                        </div>
                      )}
                      <div className="h-px bg-black/10 dark:bg-white/10 my-1" />
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Overall Department</span>
                        <span className="font-mono text-primary">{safeNum(analysisResult.department_confidence).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Overall Priority</span>
                        <span className="font-mono text-primary">{safeNum(analysisResult.priority_confidence).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Department probability bars */}
                  {analysisResult.all_department_scores && (
                    <div className="bg-white/80 dark:bg-black/40 rounded-xl p-4 border border-black/5 dark:border-white/10">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Department Routing Scores</div>
                      <div className="space-y-1.5">
                        {Object.entries(analysisResult.all_department_scores as Record<string, number>)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 6)
                          .map(([dept, score]) => (
                            <Bar key={dept} label={DEPT_LABELS[dept] || dept} value={safeNum(score)} maxVal={100} color={DEPT_COLORS[dept] || "bg-primary"} />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* AI Caption */}
                  {analysisResult.ai_caption && (
                    <div className="bg-white/80 dark:bg-black/40 rounded-xl p-4 border border-black/5 dark:border-white/10">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI Caption (BLIP)</div>
                      <p className="text-sm italic text-muted-foreground">"{analysisResult.ai_caption}"</p>
                    </div>
                  )}

                  {/* Citizen Description */}
                  <div className="bg-white/80 dark:bg-black/40 rounded-xl p-4 border border-black/5 dark:border-white/10">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Citizen Description</div>
                    <p className="text-sm">{textInput || "Not provided"}</p>
                  </div>

                  {/* Generated Note */}
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <div className="text-xs text-primary/80 uppercase tracking-wider mb-2">Generated Municipal Note</div>
                    <p className="text-sm leading-7">"{analysisResult.complaint || analysisResult.issue}"</p>
                  </div>

                  {/* Register Complaint button */}
                  {complaintStatus === "idle" && (
                    <button onClick={handleRegisterComplaint}
                      className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Register Complaint
                    </button>
                  )}
                  {complaintStatus === "submitting" && (
                    <button disabled
                      className="w-full py-3 bg-primary/60 text-white font-medium rounded-xl flex items-center justify-center gap-2">
                      <span className="animate-spin">⟳</span> Registering...
                    </button>
                  )}
                  {complaintStatus === "done" && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Complaint Registered
                    </div>
                  )}
                  {complaintStatus === "error" && (
                    <button onClick={handleRegisterComplaint}
                      className="w-full py-3 bg-rose-500/20 border border-rose-500/30 text-rose-500 font-medium rounded-xl hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2">
                      Retry Registration
                    </button>
                  )}

                  {/* Reset button */}
                  <button onClick={reset}
                    className="mt-2 py-2 px-4 text-xs text-muted-foreground hover:text-foreground border border-black/10 dark:border-white/10 rounded-lg transition-colors self-center flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Try another complaint
                  </button>
                </motion.div>
              ) : (
                <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed border-black/5 dark:border-white/10 rounded-2xl">
                  <div className="text-center">
                    {loading ? (
                      <>
                        <div className="w-10 h-10 mx-auto mb-3 relative">
                          <div className="absolute inset-0 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                        <p className="text-sm animate-pulse">AI analyzing your complaint...</p>
                      </>
                    ) : (
                      <>
                        <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Upload an image and describe the issue</p>
                        <p className="text-xs mt-1">Multimodal AI will analyze both signals</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
