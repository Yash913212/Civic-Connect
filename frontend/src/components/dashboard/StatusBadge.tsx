"use client";

const colors: Record<string, string> = {
  Pending: "bg-slate-500/15 border-slate-500/25 text-slate-400",
  Assigned: "bg-blue-500/15 border-blue-500/25 text-blue-400",
  "In Progress": "bg-amber-500/15 border-amber-500/25 text-amber-400",
  Resolved: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.Pending}`}>
      {status}
    </span>
  );
}
