"use client";

import { motion } from "framer-motion";
import {
  FileText,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export type ComplaintStage =
  | "pending"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

interface StageInfo {
  key: ComplaintStage;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const STAGES: StageInfo[] = [
  {
    key: "pending",
    label: "Pending",
    description: "Complaint submitted and under review",
    icon: FileText,
    color: "text-yellow-500 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  },
  {
    key: "assigned",
    label: "Assigned",
    description: "Officer assigned to your complaint",
    icon: UserCheck,
    color: "text-blue-500 border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  },
  {
    key: "in_progress",
    label: "In Progress",
    description: "Officer is actively working on it",
    icon: Clock,
    color: "text-orange-500 border-orange-400 bg-orange-50 dark:bg-orange-900/20",
  },
  {
    key: "resolved",
    label: "Resolved",
    description: "Complaint has been resolved",
    icon: CheckCircle2,
    color: "text-emerald-500 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    key: "rejected",
    label: "Rejected",
    description: "Complaint was not accepted",
    icon: XCircle,
    color: "text-red-500 border-red-400 bg-red-50 dark:bg-red-900/20",
  },
];

interface TimelineEntry {
  stage: ComplaintStage;
  date: string;
  note?: string;
}

interface ComplaintTimelineProps {
  entries: TimelineEntry[];
  currentStage: ComplaintStage;
}

export default function ComplaintTimeline({
  entries,
  currentStage,
}: ComplaintTimelineProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {STAGES.map((stage, i) => {
        const entry = entries.find((e) => e.stage === stage.key);
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isRejected = stage.key === "rejected";
        const StageIcon = stage.icon;
        const isPast = i < currentIndex;

        return (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative pb-6 last:pb-0 ${
              !isActive && !isRejected ? "opacity-40" : ""
            }`}
          >
            {/* Dot */}
            <div
              className={`absolute -left-8 mt-1 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center transition-all ${
                isCurrent
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 scale-110"
                  : isPast
                  ? "border-emerald-400 bg-emerald-100 dark:bg-emerald-800/40"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              }`}
            >
              <StageIcon
                className={`w-3.5 h-3.5 ${
                  isActive && !isRejected
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isRejected && currentStage === "rejected"
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              />
            </div>

            {/* Content */}
            <div
              className={`ml-2 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm"
                  : isPast
                  ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                  {stage.label}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-medium">
                      <Clock className="w-2.5 h-2.5" />
                      Current
                    </span>
                  )}
                </span>
                {entry?.date && (
                  <span className="text-[11px] text-gray-400">{entry.date}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {entry?.note || stage.description}
              </p>
            </div>
          </motion.div>
        );
      })}

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="ml-2 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
      >
        {currentStage === "resolved" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : currentStage === "rejected" ? (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        ) : (
          <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
        )}
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {currentStage === "resolved"
            ? "Complaint resolved successfully"
            : currentStage === "rejected"
            ? "Complaint was not accepted"
            : `${STAGES[currentIndex]?.label} — ${STAGES[currentIndex]?.description}`}
        </span>
      </motion.div>
    </div>
  );
}
