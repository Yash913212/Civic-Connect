"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, Mic, Play, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { showUploadProgress, showAIAnalysis, showComplaintSuccess, showTextLoading } from "@/components/ui/CustomToasts";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LiveDemo() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [aiResult, setAiResult] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);
  const handleProcessAI = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in or register to upload an image and process with AI.");
      router.push("/");
      return;
    }

    if (!selectedFile) {
      alert("Please upload image");
      return;
    }

    const formData = new FormData();

    formData.append("file", selectedFile);

    if (textInput.trim()) {
      formData.append("description", textInput);
    }

    try {

      setLoading(true);

      const rawApiUrl = "http://127.0.0.1:8000";

      console.log("API URL:", rawApiUrl);

      const response = await fetch(
        `${rawApiUrl}/ai/analyze`,
        {
          method: "POST",
          body: formData
        }
      );

      const data =
        await response.json();

      console.log(data);

      setAiResult(data);

      setAnalysisResult({
        title: data.issue,

        department:
          data.issue === "roads"
            ? "Roads Department"
            : data.issue === "garbage"
              ? "Sanitation"
              : data.issue === "water"
                ? "Water Department"
                : data.issue === "drainage"
                  ? "Drainage Department"
                  : data.issue === "streetlight"
                    ? "Electrical Department"
                    : "General Department",

        priority:
          data.confidence > 85
            ? "High"
            : data.confidence > 70
              ? "Medium"
              : "Low",

        confidence:
          `${data.confidence}%`,

        description:
          data.complaint
      });

      setStep(1);

      setTimeout(() => setStep(2), 1000);
      setTimeout(() => setStep(3), 2000);
      setTimeout(() => setStep(4), 3000);

    } catch (error) {

      console.error(
        "AI Error:",
        error
      );

    } finally {

      setLoading(false);

    }
  };

  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    department: string;
    priority: string;
    confidence: string;
    description: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [textInput, setTextInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState("en-IN");
  const [isListening, setIsListening] = useState(false);

  const startSpeechRecognition = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in or register to use voice input.");
      router.push("/");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = selectedLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    toast.success(
      `🎤 Listening in ${selectedLanguage === "en-IN"
        ? "English"
        : selectedLanguage === "te-IN"
          ? "Telugu"
          : "Hindi"
      }`
    );

    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[0][0].transcript;

      setTextInput(transcript);

      setIsListening(false);

      toast.success("✅ Voice captured");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);

      if (
        event.error === "no-speech" ||
        event.error === "aborted"
      ) {
        return;
      }

      toast.error("Unable to recognize speech");
    };
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const simulateProcessing = async (file?: File, text?: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in or register to upload an image and process with AI.");
      router.push("/");
      return;
    }

    setStep(1);

    let aiAnalysis = null;
    let uploadedImageUrl = null;

    if (file) {
      setUploadedFile(file);
      if (!previewUrl) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }

      try {
        const toastId = showUploadProgress();
        const formData = new FormData();
        formData.append("file", file);
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/api";
        const baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
        const uploadRes = await fetch(`${baseUrl}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.detail || `Upload failed with status ${uploadRes.status}`);
        }

        toast.dismiss(toastId);
        const uploadData = await uploadRes.json();
        aiAnalysis = uploadData.analysis;
        uploadedImageUrl = uploadData.imageUrl;
      } catch (error: any) {
        console.error("Image upload failed:", error);
        toast.error(`❌ Upload failed: ${error.message}`);
        setUploadedFile(null);
        setPreviewUrl(null);
        setStep(0);
        return;
      }
    } else if (text) {
      try {
        const toastId = showTextLoading("Analyzing Text", "Processing civic issue description");
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/api";
        const baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
        const analyzeRes = await fetch(`${baseUrl}/analyze_text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!analyzeRes.ok) throw new Error("Analysis failed");
        const analyzeData = await analyzeRes.json();

        toast.dismiss(toastId);
        aiAnalysis = analyzeData.analysis;
      } catch (error) {
        console.error("Text analysis failed:", error);
        toast.error("❌ Analysis failed.");
        setStep(0);
        return;
      }
    }

    if (aiAnalysis) {
      setAnalysisResult({
        title: aiAnalysis.issueDetected || aiAnalysis.title || "Unknown Issue",
        department: aiAnalysis.department || "General",
        priority: aiAnalysis.priority || "Low",
        confidence: aiAnalysis.confidence || "0%",
        description: aiAnalysis.summary || aiAnalysis.description || "No description."
      });

      try {
        const analysisToastId = showAIAnalysis();
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/api";
        const baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
        const res = await fetch(`${baseUrl}/complaint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: String(aiAnalysis.issueDetected || aiAnalysis.title || "Road Damage (Pothole)"),
            description: String(aiAnalysis.summary || aiAnalysis.description || "Severe road surface degradation observed."),
            location: "Determining via GPS...",
            department: String(aiAnalysis.department || "General"),
            priority: String(aiAnalysis.priority || "Low"),
            ...(uploadedImageUrl ? { image_url: uploadedImageUrl } : {})
          }),
        });
        if (!res.ok) throw new Error("Complaint submission failed");

        // Wait for analysis toast to "finish" visually
        setTimeout(() => {
          toast.dismiss(analysisToastId);
          showComplaintSuccess(`CC-2026-${Math.floor(1000 + Math.random() * 9000)}`);

          // Trigger confetti for major achievement
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 3000);

      } catch (error) {
        console.error("Backend connection failed:", error);
        toast.error("❌ Unable to submit complaint. Please try again.");
      }
    }

    setTimeout(() => setStep(2), 1500);
    setTimeout(() => setStep(3), 4000); // Give AI a bit more time to look realistic
    setTimeout(() => setStep(4), 5500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast.error("Please sign in or register to upload an image and process with AI.");
      router.push("/");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setSelectedFile(file);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      toast.error("Please sign in or register to upload an image and process with AI.");
      router.push("/");
      return;
    }
    if (step > 0 && step < 4) return;
    fileInputRef.current?.click();
  };

  const handleDiscard = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setStep(0);
    setAnalysisResult(null);
  };
  const formatIssueName = (issue?: string) => {
    if (!issue) return "Unknown Issue";

    const issueMap: Record<string, string> = {
      garbage: "Garbage Accumulation",
      pothole: "Road Pothole",
      drainage: "Blocked Drainage",
      streetlight: "Broken Street Light",
      waterleak: "Water Leakage",
    };

    return issueMap[issue.toLowerCase()] || issue;
  };

  return (

    <section className="py-32 w-full bg-transparent relative">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-heading font-bold mb-16 text-center">Live AI Demo</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Input */}
          <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-8 flex flex-col h-[650px]">
            <h3 className="text-xl font-medium mb-6">1. Input</h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={handleUploadClick}
              className="flex-1 border-2 border-dashed border-black/10 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:bg-black/5 dark:bg-white/5 transition-colors cursor-pointer mb-6 group min-h-[160px] relative overflow-hidden"
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-primary" />
                    <p className="text-slate-900 dark:text-white font-medium text-center px-4 truncate max-w-full">
                      {uploadedFile?.name || 'Image Uploaded'}
                    </p>
                  </div>
                  {step !== 1 && step !== 2 && step !== 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDiscard();
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors z-20"
                      aria-label="Discard image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-4 group-hover:text-primary transition-colors" />
                  <p>Upload Image</p>
                </>
              )}
            </div>

            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-black/5 dark:border-white/10 mt-4 shadow-sm dark:shadow-none">
              <p className="text-sm text-muted-foreground mb-2">Or describe issue...</p>
              {isListening && (
                <p className="text-red-500 text-sm font-medium mb-2 animate-pulse">
                  🎤 Listening...
                </p>
              )}
              <p className="text-xs text-primary mb-2">
                Voice Language:
                {selectedLanguage === "en-IN"
                  ? " English"
                  : selectedLanguage === "te-IN"
                    ? " Telugu"
                    : " Hindi"}
              </p>
              <div className="flex flex-col gap-3">

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Massive pothole on Main St."
                  className="w-full bg-transparent border-b border-black/10 dark:border-white/20 text-slate-600 dark:text-white/80 focus:outline-none focus:border-primary py-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && textInput)
                      simulateProcessing(undefined, textInput);
                  }}
                />

                <div className="flex items-center gap-3 mt-2">

                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg bg-slate-800 text-white border border-slate-600 text-sm"
                  >
                    <option value="en-IN">English</option>
                    <option value="te-IN">Telugu</option>
                    <option value="hi-IN">Hindi</option>
                  </select>

                  <button
                    onClick={() => {
                      startSpeechRecognition();
                    }}

                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-primary/20 text-primary hover:bg-primary hover:text-slate-900 dark:text-white"
                      }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                </div>

              </div>

              <button
                onClick={handleProcessAI}
                className="w-full mt-4 py-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Process with AI
              </button>

              {loading && (
                <p className="text-center mt-3 animate-pulse text-primary">
                  🤖 AI is analyzing...
                </p>
              )}

            </div>
          </div>

          {/* Center: Processing */}
          <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-8 flex flex-col h-[650px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <h3 className="text-xl font-medium mb-6 relative z-10">2. AI Pipeline</h3>

            <div className="flex-1 flex flex-col justify-center gap-6 relative z-10 min-h-[150px]">
              {[
                { id: 1, text: "Analyzing Image (OpenRouter AI)..." },
                { id: 2, text: "Extracting Context & Severity..." },
                { id: 3, text: "Routing to Department..." },
              ].map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 
                    ${step > idx ? 'border-primary bg-primary text-slate-900 dark:text-white' :
                      step === idx + 1 ? 'border-primary text-primary animate-pulse' : 'border-black/10 dark:border-white/20 text-transparent'}`}
                  >
                    {step > idx && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={`${step >= idx + 1 ? 'text-slate-900 dark:text-white' : 'text-muted-foreground'} font-mono text-sm`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Results */}
          <div className="bg-black/5 dark:bg-white/5 border border-primary/30 rounded-3xl p-8 flex flex-col h-[650px] overflow-hidden shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h3 className="text-xl font-medium mb-6">3. Results</h3>

            <AnimatePresence>
              {step === 4 ? (

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-4 overflow-hidden"
                >

                  <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Issue</div>
                    <div className="text-lg font-medium">
                      {formatIssueName(analysisResult?.title)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Department</div>
                      <div className="text-primary font-medium truncate" title={analysisResult?.department || "Public Works"}>
                        {analysisResult?.department || "Public Works"}
                      </div>
                    </div>


                    <div className="bg-background rounded-xl p-4 border border-destructive/50">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Priority
                      </div>

                      <div className="text-destructive font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                        {analysisResult?.priority || "High"}
                      </div>
                    </div>

                    <div className="col-span-2 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Confidence
                      </div>

                      <div className="text-green-400 font-bold">
                        {analysisResult?.confidence || "0%"}
                      </div>
                    </div>
                    <div className="col-span-2 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Citizen Description
                      </div>

                      <div className="text-slate-900 dark:text-white">
                        {textInput || "No description provided"}
                      </div>
                    </div>

                  </div>

                  <div className="bg-primary/10 rounded-xl p-5 border border-primary/20 flex-1 overflow-y-auto break-words scrollbar-thin scrollbar-thumb-white/20">
                    <div className="text-xs text-primary/80 uppercase tracking-wider mb-2">Generated Note</div>
                    <p className="text-base leading-8 text-white">
                      "{analysisResult?.description || "Severe road surface degradation observed. Immediate patch repair recommended."}"
                    </p>
                    {analysisResult?.confidence && (
                      <p className="text-xs text-primary/60 mt-2 font-mono">
                        AI Confidence Score: {analysisResult.confidence}
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed border-black/5 dark:border-white/10 rounded-2xl">
                  Awaiting Input...
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section >
  );
}
