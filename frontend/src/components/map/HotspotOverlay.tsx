"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, Tooltip, useMap } from "react-leaflet";
import { Loader2, Zap } from "lucide-react";
import { API_BASE } from "@/services/api";

interface Hotspot {
  lat: number;
  lng: number;
  intensity: number;
  predicted_complaints: number;
  current_count: number;
  top_department: string;
  avg_resolution_days: number;
}

function HotspotCircles({ hotspots }: { hotspots: Hotspot[] }) {
  useMap();

  return (
    <>
      {hotspots.map((spot, i) => {
        const radius = Math.max(300, spot.intensity * 1200);
        const opacity = Math.min(0.6, spot.intensity * 0.7);
        return (
          <Circle
            key={i}
            center={[spot.lat, spot.lng]}
            radius={radius}
            pathOptions={{
              color: spot.intensity > 0.6 ? "#ef4444" : spot.intensity > 0.4 ? "#f59e0b" : "#22c55e",
              fillColor: spot.intensity > 0.6 ? "#ef4444" : spot.intensity > 0.4 ? "#f59e0b" : "#22c55e",
              fillOpacity: opacity,
              weight: 2,
              opacity: opacity + 0.2,
            }}
          >
            <Tooltip direction="top" permanent className="bg-black/90 border-white/10">
              <div className="text-[10px] space-y-0.5 min-w-[120px]">
                <p className="font-bold text-white text-xs">{spot.predicted_complaints} predicted</p>
                <p className="text-white/60">{spot.top_department}</p>
                <p className="text-white/40">{spot.current_count} current &middot; {spot.avg_resolution_days}d avg</p>
              </div>
            </Tooltip>
          </Circle>
        );
      })}
    </>
  );
}

interface HotspotOverlayProps {
  enabled: boolean;
}

export default function HotspotOverlay({ enabled }: HotspotOverlayProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPredicted, setTotalPredicted] = useState(0);
  const [analytics, setAnalytics] = useState<{
    total_complaints_30d: number;
    unresolved: number;
    resolution_rate: number;
    departments: { name: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/predictions/hotspots`).then((r) => r.json()),
      fetch(`${API_BASE}/predictions/analytics`).then((r) => r.json()),
    ])
      .then(([hotspotData, analyticsData]) => {
        setHotspots(hotspotData.hotspots || []);
        setTotalPredicted(hotspotData.total_predicted || 0);
        setAnalytics(analyticsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [enabled]);

  return (
    <>
      {enabled &&
        hotspots.length > 0 &&
        (!loading && hotspots.length > 0 ? (
          <HotspotCircles hotspots={hotspots} />
        ) : null)}

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 z-[1000] max-w-[220px]"
          >
            <div className="bg-black/85 backdrop-blur-md rounded-xl border border-white/10 shadow-xl p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  {loading ? "Loading..." : `${totalPredicted} Predicted`}
                </span>
                {loading && <Loader2 className="w-3 h-3 animate-spin text-white/40" />}
              </div>

              {hotspots.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        h.intensity > 0.6 ? "#ef4444" : h.intensity > 0.4 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/80 truncate font-medium">
                      {h.top_department}
                    </p>
                    <p className="text-[9px] text-white/40">
                      {h.predicted_complaints} next week &middot; {h.current_count} now
                    </p>
                  </div>
                </div>
              ))}

              {analytics && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/50">30d total</span>
                    <span className="text-white font-medium">{analytics.total_complaints_30d}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/50">Resolution</span>
                    <span className="text-emerald-400 font-medium">{analytics.resolution_rate}%</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
