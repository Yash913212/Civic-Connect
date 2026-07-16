"use client";

const styles: Record<string, string> = {
  Critical: "bg-rose-500/15 border-rose-500/25 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]",
  High: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  Medium: "bg-amber-500/15 border-amber-500/25 text-amber-400",
  Low: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}
