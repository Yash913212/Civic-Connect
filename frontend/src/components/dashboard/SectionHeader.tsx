"use client";

export function SectionHeader({ icon: Icon, label, action, badge }: { icon: any; label: string; action?: React.ReactNode; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-white font-heading">{label}</h3>
        {badge && <span className="text-[10px] font-mono text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {action}
    </div>
  );
}
