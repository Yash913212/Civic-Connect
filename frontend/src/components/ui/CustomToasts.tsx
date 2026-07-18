"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  Camera, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  Loader2, 
  ScanLine,
  Activity,
  User,
  MapPin,
  Clock,
  Shield
} from "lucide-react";

// Helper for glass container
const GlassContainer = ({ children, className = "", glowingColor = "cyan" }: { children: React.ReactNode, className?: string, glowingColor?: string }) => {
  const colorMap: Record<string, string> = {
    cyan: "border-teal-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    emerald: "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    rose: "border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    orange: "border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]",
    purple: "border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl bg-black/60 backdrop-blur-xl border ${colorMap[glowingColor] || colorMap.cyan} p-4 w-80 md:w-96 ${className}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${glowingColor}-500/10 blur-[50px] -z-10 rounded-full`} />
      {children}
    </motion.div>
  );
};

// 1. Upload Experience
export const UploadProgressToast = ({ t }: { t: string | number }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => toast.dismiss(t), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [t]);

  return (
    <GlassContainer glowingColor="cyan">
      <div className="flex items-start gap-4">
        <div className="relative">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle cx="20" cy="20" r="18" className="stroke-white/10" strokeWidth="3" fill="none" />
            <motion.circle
              cx="20" cy="20" r="18"
              className="stroke-teal-400" strokeWidth="3" fill="none"
              strokeDasharray="113"
              strokeDashoffset={113 - (113 * progress) / 100}
              transition={{ duration: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal-400">
            {progress}%
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm mb-1">
            <Camera className="w-4 h-4 text-teal-400" />
            📸 Image Processing
          </div>
          <div className="text-xs text-white/60">
            <span className="flex items-center gap-1">
              <ScanLine className="w-3 h-3 animate-pulse text-teal-400" />
              Analyzing uploaded evidence...
            </span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-teal-500/80 uppercase">
            AI preparing complaint data...
          </div>
        </div>
      </div>
    </GlassContainer>
  );
};

// 2. AI Analysis Checklist
export const AIAnalysisToast = ({ t }: { t: string | number }) => {
  const [step, setStep] = useState(0);

  const steps = [
    "Detecting category",
    "Determining severity",
    "Identifying department",
    "Generating report"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= steps.length) {
          clearInterval(timer);
          setTimeout(() => toast.dismiss(t), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [steps.length, t]);

  return (
    <GlassContainer glowingColor="purple">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-sm mb-2">🤖 Civic AI Engine</div>
          <div className="text-xs text-white/60 mb-3">Analyzing infrastructure issue...</div>
          <div className="space-y-1.5">
            {steps.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {idx < step ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : idx === step ? (
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                )}
                <span className={idx <= step ? "text-white/90" : "text-white/30"}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassContainer>
  );
};

// 3. Success Complaint
export const ComplaintSuccessToast = ({ trackingId }: { trackingId: string, t?: string | number }) => (
  <GlassContainer glowingColor="emerald">
    <div className="flex gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
        <div className="relative p-2 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
          <Check className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-white mb-1">✅ Complaint Registered</h4>
        <div className="text-xs text-white/60 mb-2">Assigned to Civic Processing Queue</div>
        <div className="inline-flex flex-col bg-black/40 border border-emerald-500/20 rounded-md p-2">
          <span className="text-[9px] uppercase text-emerald-500/70 font-bold tracking-wider mb-0.5">Tracking ID Generated</span>
          <span className="text-xs font-mono text-emerald-400 font-bold">{trackingId}</span>
        </div>
      </div>
    </div>
  </GlassContainer>
);

// 4. Officer Assigned
export const OfficerAssignedToast = ({ department, expectedTime }: { department: string, expectedTime: string }) => (
  <GlassContainer glowingColor="cyan">
    <div className="flex gap-4 items-center">
      <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400">
        <User className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white mb-2">👮 Officer Assigned</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded p-1.5 border border-white/5">
            <span className="text-[9px] text-white/40 block uppercase">Department</span>
            <span className="text-[10px] text-teal-400 font-semibold">{department}</span>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-white/5">
            <span className="text-[9px] text-white/40 block uppercase">Expected Response</span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> {expectedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  </GlassContainer>
);

// 5. Complaint Resolved
export const ResolutionToast = () => (
  <GlassContainer glowingColor="emerald">
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.5)]">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white mb-1">🎉 Issue Resolved</h4>
        <p className="text-xs text-white/70">Resolution Uploaded</p>
        <button className="mt-2 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded px-2 py-1 transition-colors">
          Review & Confirm Completion
        </button>
      </div>
    </div>
  </GlassContainer>
);

// 6. Admin Alerts
export const AdminAlertToast = ({ location, severity }: { location: string, severity: string }) => (
  <GlassContainer glowingColor="rose" className="border-rose-500/50 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-rose-400 mb-2">🚨 Immediate Attention Required</h4>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/50">Location:</span>
            <span className="text-white font-semibold flex items-center gap-1"><MapPin className="w-3 h-3"/>{location}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/50">Severity:</span>
            <span className="text-rose-500 font-bold uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">{severity}</span>
          </div>
        </div>
      </div>
    </div>
  </GlassContainer>
);

// 7. Text Loading Process
export const TextLoadingToast = ({ t, title, task }: { t: string | number, title: string, task: string }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => toast.dismiss(t), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [t]);

  const blocks = Math.floor(progress / 10);
  const emptyBlocks = 10 - blocks;
  const bar = "█".repeat(blocks) + "░".repeat(emptyBlocks);

  return (
    <GlassContainer glowingColor="purple">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-bold text-white flex justify-between items-center">
          <span>{title}</span>
          <span className="text-purple-400 font-mono text-xs">{progress}%</span>
        </div>
        <div className="text-purple-500 font-mono text-xs tracking-widest">{bar}</div>
        <div className="text-[10px] text-white/50">{task}...</div>
      </div>
    </GlassContainer>
  );
};

// 8. Futuristic Command Card
export const AIFuturisticToast = ({ severity, department, confidence }: { severity: string, department: string, confidence: string }) => (
  <GlassContainer glowingColor="cyan" className="!w-96">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-teal-500/20 animate-pulse" />
        <Cpu className="w-6 h-6 text-teal-400 relative z-10" />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Civic Intelligence Engine
        </h4>
        <p className="text-[10px] text-white/60 mb-3 font-mono">Scanning uploaded evidence...</p>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col justify-center">
             <span className="text-[8px] uppercase text-white/40">Severity</span>
             <span className={`text-[10px] font-bold ${severity === 'High' ? 'text-rose-400' : 'text-amber-400'}`}>{severity}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col justify-center">
             <span className="text-[8px] uppercase text-white/40">Department</span>
             <span className="text-[10px] font-bold text-white">{department}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col justify-center">
             <span className="text-[8px] uppercase text-white/40">Confidence</span>
             <span className="text-[10px] font-bold text-emerald-400 font-mono">{confidence}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col justify-center">
             <span className="text-[8px] uppercase text-white/40">Status</span>
             <span className="text-[10px] font-bold text-teal-400">Analysis Complete</span>
          </div>
        </div>
      </div>
    </div>
  </GlassContainer>
);

// 9. System Status
export const SystemStatusToast = ({ title, message, isError = false }: { title: string, message: string, isError?: boolean }) => (
  <GlassContainer glowingColor={isError ? "rose" : "cyan"}>
    <div className="flex gap-4 items-center">
      <div className={`p-2 rounded-xl ${isError ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : 'bg-teal-500/20 text-teal-400 border-teal-500/30'} border`}>
        {isError ? <AlertTriangle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${isError ? 'text-rose-400' : 'text-teal-400'} mb-1`}>{title}</h4>
        <div className="text-xs text-white/60 font-mono">{message}</div>
      </div>
    </div>
  </GlassContainer>
);

// API Functions
export const showSystemStatus = (title: string, message: string, isError = false) => {
  toast.custom(() => <SystemStatusToast title={title} message={message} isError={isError} />);
};

export const showUploadProgress = () => {
  const id = toast.custom((t) => <UploadProgressToast t={t} />, { duration: 2500 });
  return id;
};

export const showAIAnalysis = () => {
  const id = toast.custom((t) => <AIAnalysisToast t={t} />, { duration: 3500 });
  return id;
};

export const showComplaintSuccess = (trackingId: string) => {
  toast.custom((t) => <ComplaintSuccessToast t={t} trackingId={trackingId} />);
};

export const showOfficerAssigned = (department: string, expectedTime: string) => {
  toast.custom(() => <OfficerAssignedToast department={department} expectedTime={expectedTime} />);
};

export const showResolution = () => {
  toast.custom(() => <ResolutionToast />);
};

export const showAdminAlert = (location: string, severity: string) => {
  toast.custom(() => <AdminAlertToast location={location} severity={severity} />);
};

export const showTextLoading = (title: string, task: string) => {
  const id = toast.custom((t) => <TextLoadingToast t={t} title={title} task={task} />, { duration: 2000 });
  return id;
};

export const showAIFuturistic = (severity: string, department: string, confidence: string) => {
  toast.custom(() => <AIFuturisticToast severity={severity} department={department} confidence={confidence} />);
};
