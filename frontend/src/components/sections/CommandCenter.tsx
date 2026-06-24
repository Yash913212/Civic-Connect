"use client";

import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function CommandCenter() {
  return (
    <section className="py-24 md:py-32 w-full max-w-7xl mx-auto px-6">
      <div className="mb-16 text-center">
        <h2 className="text-2xl sm:text-4xl md:text-6xl font-heading font-bold mb-6">Municipal Command Center</h2>
        <p className="text-lg md:text-xl text-muted-foreground">Palantir-style dashboard for city administrators.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {[
          { title: "Total Complaints", value: "52,492", icon: Activity, color: "text-blue-500" },
          { title: "Resolved Cases", value: "48,102", icon: CheckCircle, color: "text-green-500" },
          { title: "Active Issues", value: "3,150", icon: Clock, color: "text-yellow-500" },
          { title: "Critical Alerts", value: "240", icon: AlertTriangle, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.title} className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-black/5 dark:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm text-muted-foreground font-medium">{stat.title}</div>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[400px]">
        <div className="col-span-1 md:col-span-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col h-auto md:h-full min-h-[300px] md:min-h-0">
          <h3 className="text-lg font-medium mb-4">Resolution Times</h3>
          <div className="flex-1 border-t border-b border-black/5 dark:border-white/10 relative flex items-end pb-4 gap-4 min-h-[160px]">
            {/* Mock Chart */}
            {[40, 60, 45, 80, 55, 90, 30].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/50 transition-colors rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="col-span-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col h-auto md:h-full min-h-[350px] md:min-h-0 overflow-hidden">
          <h3 className="text-lg font-medium mb-4">Live Alert Feed</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px] md:max-h-none">
            {[
              { type: "Water Leakage", loc: "Sector 4", time: "2m ago", severity: "high" },
              { type: "Road Damage", loc: "Highway 9", time: "15m ago", severity: "medium" },
              { type: "Garbage Overflow", loc: "Downtown", time: "1h ago", severity: "low" },
              { type: "Streetlight Out", loc: "Avenue 5", time: "2h ago", severity: "low" },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/5">
                <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-destructive' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{alert.type}</div>
                  <div className="text-xs text-muted-foreground">{alert.loc}</div>
                </div>
                <div className="text-xs text-muted-foreground">{alert.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
