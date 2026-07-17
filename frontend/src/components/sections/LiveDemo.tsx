"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, Mic, CheckCircle2, X, Brain, MessageSquareText, MapPin, ArrowRight, Zap, Sparkles, Loader2, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/services/api";

const DEPT_LABELS: Record<string, string> = {
  roads: "Roads Dept", drainage: "Drainage Dept", garbage: "Sanitation",
  water: "Water Works", streetlight: "Electrical Dept", electricity: "Power Distribution",
  safety: "Public Safety", traffic: "Traffic Management",
};

function ParticleField() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 8 + 6,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20 dark:bg-primary/10"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function ScanOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(var(--primary),0.8)]"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
    </motion.div>
  );
}

function ProcessingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8">
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-primary/40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
        />
        <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
          <motion.div
            className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
        </motion.div>
      </div>
      <div className="space-y-1.5 text-center">
        {["Vision Encoder", "Text Analysis", "Classification"].map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-2 text-xs text-muted-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.4 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
            />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ShimmerBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`relative inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border overflow-hidden ${color}`}>
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {children}
    </span>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    const duration = 800;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

export default function LiveDemo({ onViewMyComplaints }: { onViewMyComplaints?: () => void }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleProcessAI = async () => {
    if (!selectedFile && !textInput.trim()) {
      toast.error("Please upload an image or describe the issue"); return;
    }
    setLoading(true);
    setAnalysisResult(null);
    setShowScan(true);

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
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textInput }),
        });
        if (!res.ok) throw new Error(`Text analysis failed: ${res.status}`);
        const result = await res.json();
        data = {
          issue: result.analysis?.title || "Civic Issue",
          department: result.analysis?.department || "General",
          priority: (result.analysis?.priority || "low").toLowerCase(),
          complaint: result.analysis?.description || textInput,
          modality: "text-only",
          confidence: result.analysis?.confidence || "N/A",
        };
      }

      setAnalysisResult(data);
    } catch (err: any) {
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
      setShowScan(false);
    }
  };
const proceedToRegister = async () => {
  if (!analysisResult) return;

  let base64Image = "";
  if (selectedFile) {
    base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(selectedFile);
    });
  }

  const payload = {
    title: analysisResult.issue || "Civic Issue",
    description: analysisResult.complaint || textInput,
    request_note: analysisResult.request_note || "",
    department: analysisResult.department || "General",
    priority: analysisResult.priority || "low",
    imageUrl: base64Image,
    issue: analysisResult.issue,
    modality: analysisResult.modality,
  };

  sessionStorage.setItem("complaint_draft", JSON.stringify(payload));
  router.push("/citizen/complaint");
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
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        let extension = "webm";
        if (mimeType.includes("mp4")) extension = "mp4";
        else if (mimeType.includes("ogg")) extension = "ogg";
        else if (mimeType.includes("wav")) extension = "wav";

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());

        try {
          const fd = new FormData();
          fd.append("file", blob, `voice.${extension}`);
          const res = await fetch(`${API_BASE}/ai/transcribe`, { method: "POST", body: fd });
          const data = await res.json();
          if (data.transcription) {
            setTextInput(data.transcription);
            toast.success("Voice transcribed");
          }
        } catch { toast.error("Transcription failed"); }
      };

      mediaRecorder.start();
          } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const reset = () => {
    setLoading(false); setAnalysisResult(null); setShowScan(false);
    setSelectedFile(null); setAudioBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  const priorityColors: Record<string, string> = {
    high: "text-red-500 bg-red-500/20 border-red-500/40",
    medium: "text-amber-500 bg-amber-500/20 border-amber-500/40",
    low: "text-emerald-500 bg-emerald-500/20 border-emerald-500/40",
  };
  const priorityShimmers: Record<string, string> = {
    high: "border-red-500/40",
    medium: "border-amber-500/40",
    low: "border-emerald-500/40",
  };

  return (
    <section className="py-24 w-full bg-transparent relative overflow-hidden" id="live-demo">
      <ParticleField />
      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-[120px]"
        animate={{ scale: [1.2, 1, 1.2], rotate: [0, -45, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-4"
            animate={{ boxShadow: ["0 0 0px rgba(var(--primary),0)", "0 0 20px rgba(var(--primary),0.3)", "0 0 0px rgba(var(--primary),0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-3 h-3" /> Powered by Civic AI
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-3">
            Live{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
              AI Demo
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Upload a photo or describe the issue. Our multimodal AI classifies, prioritizes, and routes it instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="lg:order-1"
          >
            <motion.div variants={cardVariants} className="relative group h-full">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-primary/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 blur transition duration-500" />
              <div className="relative h-full flex flex-col bg-white/5 dark:bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                    <MessageSquareText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Describe the Issue</h3>
                    <p className="text-[10px] text-muted-foreground">Upload, type, or use voice</p>
                  </div>
                </div>

                {previewUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative h-64 rounded-xl overflow-hidden border border-primary/20 mb-4 group/image cursor-pointer flex-shrink-0"
                    onClick={() => setShowFullPreview(true)}
                  >
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" />
                    <AnimatePresence>{showScan && <ScanOverlay />}</AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(); }} 
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-all text-xs backdrop-blur-sm z-20"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] text-white/90 truncate flex-1">
                        {selectedFile?.name}
                      </div>
                      <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-32 border-2 border-dashed border-black/10 dark:border-white/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer mb-4 group/upload overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-teal-500/5"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <Upload className="w-7 h-7 mb-2 opacity-40 group-hover/upload:opacity-60 transition-opacity" />
                    <p className="text-xs font-medium">Drop photo or <span className="text-primary underline underline-offset-2">browse</span></p>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">JPG, PNG, WEBP</p>
                  </motion.div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                <div className="flex items-center gap-2 mb-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                      isRecording
                        ? "bg-red-500/20 text-red-400 border-red-500/30 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        : "bg-black/5 dark:bg-white/10 text-muted-foreground border-transparent hover:bg-black/10 dark:hover:bg-white/20"
                    }`}
                  >
                    <motion.div animate={isRecording ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5, repeat: Infinity }}>
                      <Mic className={`w-3.5 h-3.5 ${isRecording ? "text-red-400" : ""}`} />
                    </motion.div>
                    {isRecording ? "Recording..." : "Voice Input"}
                  </motion.button>
                  {audioBlob && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-primary font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Voice captured
                    </motion.span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                    placeholder='e.g., "road lo pedda gunta undi" or "water leakage"'
                    className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all pr-20"
                    onKeyDown={(e) => e.key === "Enter" && handleProcessAI()}
                  />
                  {textInput && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setTextInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md bg-black/10 dark:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProcessAI}
                  disabled={loading || (!selectedFile && !textInput.trim())}
                  className="w-full mt-auto py-3 bg-gradient-to-r from-primary to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-[0_8px_30px_rgba(0,200,140,0.4)] transition-all disabled:opacity-40 disabled:hover:shadow-none flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  />
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
                  ) : (
                    <><Zap className="w-4 h-4" /> Analyze with AI</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Results */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="lg:order-2"
          >
            <motion.div variants={cardVariants} className="relative group h-full">
              <motion.div
                className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-primary/30 via-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition duration-700"
                animate={analysisResult ? { opacity: [0.3, 0.6, 0.3] } : {}}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative h-full bg-white/5 dark:bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 dark:border-white/10 min-h-[400px] flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">AI Results</h3>
                    <p className="text-[10px] text-muted-foreground">Multimodal analysis output</p>
                  </div>
                  {analysisResult && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-semibold flex items-center gap-1"
                    >
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Complete
                    </motion.div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                      <ProcessingAnimation />
                    </motion.div>
                  ) : analysisResult ? (
                    <motion.div
                      key="results"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="flex-1 flex flex-col gap-3"
                    >
                      <motion.div variants={cardVariants} className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Issue", value: analysisResult.issue || "—", color: "text-primary" },
                          { label: "Department", value: DEPT_LABELS[analysisResult.department] || analysisResult.department, color: "text-primary" },
                          { label: "Priority", value: (analysisResult.priority || "low").toUpperCase(), badge: true },
                          { label: "Confidence", value: analysisResult.confidence ? `${analysisResult.confidence}` : (analysisResult.department_confidence ? `${analysisResult.department_confidence}%` : "—"), color: "text-emerald-500" },
                        ].map((item) => (
                          <motion.div
                            key={item.label}
                            whileHover={{ y: -2 }}
                            className="bg-white/70 dark:bg-black/50 rounded-xl p-3 border border-black/10 dark:border-white/10 hover:border-primary/30 transition-all shadow-sm"
                          >
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                            {item.badge ? (
                              <ShimmerBadge color={priorityShimmers[analysisResult.priority] || "border-emerald-500/40"}>
                                {item.value}
                              </ShimmerBadge>
                            ) : (
                              <div className={`text-sm font-semibold capitalize truncate ${item.color}`}>{item.value}</div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>

                      {analysisResult.complaint && (
  <motion.div
    variants={cardVariants}
    className="relative bg-gradient-to-br from-primary/5 to-teal-500/5 rounded-xl p-4 border border-primary/10 overflow-hidden"
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -skew-x-12"
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />

    <div className="text-[9px] text-primary/60 uppercase tracking-wider mb-1.5 font-semibold flex items-center gap-1.5">
      <Sparkles className="w-3 h-3" />
      Generated Summary
    </div>

    <motion.p
      className="text-sm leading-relaxed relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {analysisResult.complaint.split("").map((char: string, i: number) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.008 }}
          className="inline"
        >
          {char}
        </motion.span>
      ))}
    </motion.p>
  </motion.div>
)}

{analysisResult.request_note && (
  <motion.div
    variants={cardVariants}
    className="relative bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl p-4 border border-blue-500/10 overflow-hidden mt-4"
  >
    <div className="text-[9px] text-blue-400 uppercase tracking-wider mb-2 font-semibold flex items-center gap-1.5">
      <Sparkles className="w-3 h-3" />
      AI Generated Request Note
    </div>

    <p className="text-sm leading-relaxed whitespace-pre-line">
      {analysisResult.request_note}
    </p>
  </motion.div>
)}

                      <motion.div variants={cardVariants} className="flex gap-2 mt-auto pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={reset}
                          className="px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/20 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        >
                          Reset
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={proceedToRegister}
                          className="flex-1 py-2.5 bg-gradient-to-r from-primary to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-[0_8px_25px_rgba(0,200,140,0.4)] transition-all flex items-center justify-center gap-2 relative overflow-hidden group/reg"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <MapPin className="w-4 h-4" /> Register with Map
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <motion.div
                          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center border border-primary/10"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Brain className="w-7 h-7 text-primary/50" />
                        </motion.div>
                        <p className="text-sm text-muted-foreground font-medium">Awaiting input...</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">AI results will appear here</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { icon: Zap, label: "Instant Classification", desc: "Identifies issue type in seconds using multimodal AI" },
            { icon: Brain, label: "Smart Routing", desc: "Directs complaints to the correct department automatically" },
            { icon: Mic, label: "Voice & Image Support", desc: "Describe issues by voice or upload a photo — AI understands both" },
            { icon: Sparkles, label: "Priority Scoring", desc: "Assesses urgency so critical issues get attention first" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white/60 dark:bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-black/5 dark:border-white/10 hover:border-primary/30 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <h4 className="text-sm font-semibold mb-1">{item.label}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {onViewMyComplaints && (
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onViewMyComplaints}
              className="relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary/20 to-teal-500/20 backdrop-blur-xl border border-primary/40 rounded-2xl text-sm font-bold text-foreground hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all group overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{ x: ["-150%", "250%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/50"
                animate={{ opacity: [0, 1, 0], scale: [1, 1.05, 1.1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <ClipboardList className="w-5 h-5 text-primary relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">View My Complaints & Tracking</span>
              <ArrowRight className="w-5 h-5 text-primary relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/citizen/profile')}
              className="relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/40 rounded-2xl text-sm font-bold text-foreground hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all group overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{ x: ["-150%", "250%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-amber-500/50"
                animate={{ opacity: [0, 1, 0], scale: [1, 1.05, 1.1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <Sparkles className="w-5 h-5 text-amber-500 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Civic Score & Leaderboard</span>
              <ArrowRight className="w-5 h-5 text-amber-500 relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFullPreview && previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-12"
            onClick={() => setShowFullPreview(false)}
          >
            <button
              onClick={() => setShowFullPreview(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={previewUrl}
              alt="Full Preview"
              className="w-full h-full max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
