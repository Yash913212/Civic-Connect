"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ThumbsUp, ExternalLink, Loader2, Search } from "lucide-react";
import { API_BASE } from "@/services/api";

interface Duplicate {
  id: string;
  title: string;
  description: string;
  status: string;
  department: string;
  location: string;
  similarity: number;
}

interface DuplicateWarningProps {
  description: string;
  department?: string;
  location?: string;
  onContinue: () => void;
}

export default function DuplicateWarning({
  description,
  department,
  location,
  onContinue,
}: DuplicateWarningProps) {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkDuplicates = useCallback(async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/check-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, department, location }),
      });
      const data = await res.json();
      setDuplicates(data.duplicates || []);
    } catch {
      // silently fail
    } finally {
      setChecked(true);
      setLoading(false);
    }
  }, [description, department, location]);

  if (dismissed) return null;

  return (
    <div className="space-y-3">
      {!checked && !loading && (
        <button
          onClick={checkDuplicates}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-medium"
        >
          <Search className="w-3.5 h-3.5" />
          Check for similar existing complaints
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-white/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Checking for similar complaints...
        </div>
      )}

      <AnimatePresence>
        {checked && duplicates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-400">
                    {duplicates.length} similar {duplicates.length === 1 ? "complaint" : "complaints"} found
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Consider upvoting an existing report instead
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {duplicates.slice(0, 3).map((dup) => (
                <div
                  key={dup.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white truncate">
                        {dup.title}
                      </span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        dup.status === "Resolved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : dup.status === "In Progress"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {dup.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 truncate">
                      {dup.location} &middot; {dup.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      {Math.round(dup.similarity * 100)}%
                    </span>
                    <a
                      href={`/citizen/complaints?id=${dup.id}`}
                      target="_blank"
                      className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-amber-500/10">
              <button
                onClick={() => setDismissed(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs font-semibold"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Continue anyway
              </button>
              <button
                onClick={onContinue}
                className="text-xs text-white/40 hover:text-white/60 transition-all"
              >
                Upvote existing instead
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {checked && duplicates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          No similar complaints found — looks like a new issue
        </motion.div>
      )}
    </div>
  );
}
