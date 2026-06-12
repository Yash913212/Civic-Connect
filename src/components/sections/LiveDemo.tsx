"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Mic, Play, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { showUploadProgress, showAIAnalysis, showComplaintSuccess, showTextLoading } from "@/components/ui/CustomToasts";

export default function LiveDemo() {
  const [step, setStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    department: string;
    priority: string;
    confidence: string;
    description: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const simulateProcessing = async (file?: File, text?: string) => {
    setStep(1);
    
    let aiAnalysis = null;
    let uploadedImageUrl = null;

    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

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
    if (e.target.files && e.target.files[0]) {
      simulateProcessing(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="py-32 w-full bg-transparent relative">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-heading font-bold mb-16 text-center">Live AI Demo</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[600px]">
          {/* Left: Input */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col h-auto lg:h-full min-h-[350px] lg:min-h-0">
            <h3 className="text-xl font-medium mb-6">1. Input</h3>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            
            <div 
              onClick={handleUploadClick}
              className="flex-1 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:bg-white/5 transition-colors cursor-pointer mb-6 group min-h-[160px] relative overflow-hidden"
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-primary" />
                    <p className="text-white font-medium text-center px-4 truncate max-w-full">
                      {uploadedFile?.name || 'Image Uploaded'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-4 group-hover:text-primary transition-colors" />
                  <p>Upload Image</p>
                </>
              )}
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-4">
              <p className="text-sm text-muted-foreground mb-2">Or describe issue...</p>
              <div className="flex justify-between items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Massive pothole on Main St."
                  className="flex-1 bg-transparent border-b border-white/20 text-white/80 focus:outline-none focus:border-primary py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && textInput) simulateProcessing(undefined, textInput);
                  }}
                />
                <button 
                  onClick={() => {
                    if (textInput) simulateProcessing(undefined, textInput);
                    else alert("Microphone Activated. Listening...");
                  }}
                  className="p-3 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                if (uploadedFile) simulateProcessing(uploadedFile);
                else if (textInput) simulateProcessing(undefined, textInput);
                else alert("Please upload an image or describe the issue.");
              }}
              className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Process with AI
            </button>
          </div>

          {/* Center: Processing */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col h-auto lg:h-full min-h-[250px] lg:min-h-0 relative overflow-hidden">
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
                    ${step > idx ? 'border-primary bg-primary text-white' :
                      step === idx + 1 ? 'border-primary text-primary animate-pulse' : 'border-white/20 text-transparent'}`}
                  >
                    {step > idx && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={`${step >= idx + 1 ? 'text-white' : 'text-muted-foreground'} font-mono text-sm`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Results */}
          <div className="bg-white/5 border border-primary/30 rounded-3xl p-8 flex flex-col h-auto lg:h-full min-h-[300px] lg:min-h-0 shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h3 className="text-xl font-medium mb-6">3. Results</h3>

            <AnimatePresence>
              {step === 4 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-4"
                >
                  <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Issue</div>
                    <div className="text-lg font-medium">{analysisResult?.title || "Road Damage (Pothole)"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Department</div>
                      <div className="text-primary font-medium truncate" title={analysisResult?.department || "Public Works"}>
                        {analysisResult?.department || "Public Works"}
                      </div>
                    </div>
                    <div className="bg-background rounded-xl p-4 border border-destructive/50">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Priority</div>
                      <div className="text-destructive font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                        {analysisResult?.priority || "High"}
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 flex-1 overflow-y-auto max-h-[140px] scrollbar-thin scrollbar-thumb-white/20">
                    <div className="text-xs text-primary/80 uppercase tracking-wider mb-2">Generated Note</div>
                    <p className="text-sm leading-relaxed text-white/90">
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
                <div className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed border-white/10 rounded-2xl">
                  Awaiting Input...
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
