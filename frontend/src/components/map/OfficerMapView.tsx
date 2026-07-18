"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Loader2, MapPin, Layers, RefreshCw, Zap } from "lucide-react";
import "@/lib/leafletSetup";
import MarkerCluster from "./MarkerCluster";
import HotspotOverlay from "./HotspotOverlay";

import { complaintService } from "@/services/complaintService";

const DEFAULT_CENTER: [number, number] = [17.385, 78.4867];

interface Complaint {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  dept: string;
  priority: string;
  status: string;
  image_url: string | null;
  time: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STATUS_COLORS: Record<string, string> = {
  "Pending": "#6b7280",
  "Assigned": "#3b82f6",
  "In Progress": "#f59e0b",
  "Resolved": "#22c55e",
};

function createMarkerIcon(priority: string, isSelected: boolean) {
  const color = PRIORITY_COLORS[priority?.toLowerCase()] || "#6b7280";
  const size = isSelected ? 16 : 12;
  return L.divIcon({
    className: "custom-marker-icon",
    html: `<div style="
      width: ${size * 2}px; height: ${size * 2}px;
      background: ${color};
      border: 3px solid ${isSelected ? '#fff' : color};
      border-radius: 50%;
      box-shadow: 0 2px 12px ${color}80, 0 0 0 ${isSelected ? 6 : 2}px rgba(0,0,0,0.2), 0 0 ${isSelected ? 20 : 0}px ${color}40;
      transition: all 0.2s;
    "></div>`,
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
    popupAnchor: [0, -size],
  });
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1 });
  }, [center, map]);
  return null;
}

function LiveIndicator({ loading, lastUpdated, newCount }: { loading: boolean; lastUpdated: Date | null; newCount: number }) {
  return (
    <div className="flex items-center gap-3">
      {newCount > 0 && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          +{newCount} new
        </motion.span>
      )}
      <div className="flex items-center gap-1.5">
        <motion.span
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-400" : "bg-emerald-400"}`}
        />
        <span className="text-[10px] text-white/50">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString()}`
            : loading
              ? "Loading..."
              : "Waiting for data"}
        </span>
      </div>
    </div>
  );
}

export default function OfficerMapView() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [useClustering, setUseClustering] = useState(true);
  const [showPredictions, setShowPredictions] = useState(false);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newCount, setNewCount] = useState(0);
  const newCountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await complaintService.getAll();
      const valid = data.filter((c: Complaint) => c.latitude && c.longitude && !isNaN(parseFloat(c.latitude)));
      setComplaints((prev) => {
        if (prev.length > 0 && valid.length > prev.length) {
          setNewCount(valid.length - prev.length);
          if (newCountTimerRef.current) clearTimeout(newCountTimerRef.current);
          newCountTimerRef.current = setTimeout(() => setNewCount(0), 5000);
        }
        return valid;
      });
      setStats({
        total: valid.length,
        high: valid.filter((c: Complaint) => c.priority?.toLowerCase() === "high" || c.priority?.toLowerCase() === "urgent" || c.priority?.toLowerCase() === "critical").length,
        medium: valid.filter((c: Complaint) => c.priority?.toLowerCase() === "medium").length,
        low: valid.filter((c: Complaint) => c.priority?.toLowerCase() === "low").length,
      });
      setLastUpdated(new Date());
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    const interval = setInterval(fetchComplaints, 30000);
    return () => {
      clearInterval(interval);
      if (newCountTimerRef.current) clearTimeout(newCountTimerRef.current);
    };
  }, [fetchComplaints]);

  const filteredComplaints = useMemo(() => complaints.filter((c) => {
    if (selectedPriority && c.priority?.toLowerCase() !== selectedPriority) return false;
    if (selectedStatus && c.status?.toLowerCase() !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.title?.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q) || c.dept?.toLowerCase().includes(q);
    }
    return true;
  }), [complaints, selectedPriority, selectedStatus, searchQuery]);

  const clusterMarkers = useMemo(() => filteredComplaints
    .filter((c) => c.latitude && c.longitude && !isNaN(parseFloat(c.latitude)) && !isNaN(parseFloat(c.longitude)))
    .map((c) => ({
      position: [parseFloat(c.latitude!), parseFloat(c.longitude!)] as [number, number],
      title: c.title,
      priority: c.priority,
      status: c.status,
      dept: c.dept,
      address: c.address || c.location,
      complaintId: c.id,
    })), [filteredComplaints]);

  const handleMarkerClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    if (complaint.latitude && complaint.longitude) {
      setMapCenter([parseFloat(complaint.latitude), parseFloat(complaint.longitude)]);
    }
  };

  const priorities = ["high", "medium", "low"];
  const statuses = ["Pending", "Assigned", "In Progress", "Resolved"];

  return (
    <div className="space-y-4 h-full flex flex-col p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, address, department..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        <div className="flex gap-1">
          {priorities.map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPriority(selectedPriority === p ? null : p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedPriority === p
                  ? 'ring-2 ring-offset-1 ring-white/20 bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
              style={{ borderColor: selectedPriority === p ? PRIORITY_COLORS[p] : undefined }}
            >
              {PRIORITY_LABELS[p]}
            </motion.button>
          ))}
        </div>

        <select
          value={selectedStatus || ""}
          onChange={(e) => setSelectedStatus(e.target.value || null)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        >
          <option value="" className="bg-black">All Status</option>
          {statuses.map((s) => (<option key={s} value={s.toLowerCase()} className="bg-black">{s}</option>))}
        </select>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setUseClustering(!useClustering)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            useClustering
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:bg-white/10"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {useClustering ? "Clustered" : "Markers"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPredictions(!showPredictions)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            showPredictions
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
              : "bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:bg-white/10"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {showPredictions ? "Hide Predictions" : "Predictions"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchComplaints}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      <div className="flex gap-4 text-xs text-white/40 items-center flex-wrap">
        <span>Total: <strong className="text-white">{stats.total}</strong></span>
        <span className="text-rose-400">High: <strong>{stats.high}</strong></span>
        <span className="text-amber-400">Medium: <strong>{stats.medium}</strong></span>
        <span className="text-emerald-400">Low: <strong>{stats.low}</strong></span>
        <div className="flex-1" />
        <LiveIndicator loading={loading} lastUpdated={lastUpdated} newCount={newCount} />
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.06] relative min-h-[400px]">
        {loading && complaints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
          </div>
        )}

        {complaints.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <MapPin className="w-12 h-12 mx-auto mb-3 text-white/20" />
              </motion.div>
              <p className="text-sm text-white/50">No geo-tagged complaints yet</p>
              <p className="text-xs text-white/30 mt-1">Complaints submitted from the citizen map will appear here</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur-md rounded-xl px-3 py-2.5 border border-white/10 shadow-xl text-[10px] space-y-1.5">
          <p className="font-semibold text-[9px] uppercase tracking-wider text-white/40">Status</p>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-white/60">{status}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 right-4 z-[1000] bg-black/80 backdrop-blur-md rounded-xl px-3 py-2.5 border border-white/10 shadow-xl text-[10px] space-y-1.5">
          <p className="font-semibold text-[9px] uppercase tracking-wider text-white/40">Priority</p>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize text-white/60">{priority}</span>
            </div>
          ))}
        </div>

        <MapContainer
          center={mapCenter || DEFAULT_CENTER}
          zoom={mapCenter ? 14 : 11}
          className="h-full w-full z-0"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} />

          <HotspotOverlay enabled={showPredictions} />

          {useClustering ? (
            <MarkerCluster markers={clusterMarkers} />
          ) : (
            filteredComplaints.map((c) => {
              if (!c.latitude || !c.longitude) return null;
              const lat = parseFloat(c.latitude);
              const lng = parseFloat(c.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <Marker
                  key={c.id}
                  position={[lat, lng]}
                  icon={createMarkerIcon(c.priority, selectedComplaint?.id === c.id)}
                  eventHandlers={{ click: () => handleMarkerClick(c) }}
                >
                  <Popup>
                    <div className="text-xs space-y-1.5 max-w-[200px] bg-black/90">
                      <p className="font-semibold text-sm text-white">{c.title}</p>
                      <p className="text-white/60">{c.address || c.location}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: `${PRIORITY_COLORS[c.priority?.toLowerCase()] || "#888"}20`, color: PRIORITY_COLORS[c.priority?.toLowerCase()] || "#888" }}
                        >{c.priority}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: `${STATUS_COLORS[c.status] || "#888"}20`, color: STATUS_COLORS[c.status] || "#888" }}
                        >{c.status}</span>
                      </div>
                      <p className="text-white/40">{c.dept}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          )}
        </MapContainer>
      </div>
    </div>
  );
}
