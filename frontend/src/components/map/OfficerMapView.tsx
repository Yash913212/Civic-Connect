"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Loader2, MapPin, Layers } from "lucide-react";
import "@/lib/leafletSetup";
import MarkerCluster from "./MarkerCluster";
import { API_BASE, getAuthHeaders } from "@/services/api";
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
  "Unassigned": "#6b7280",
  "Assigned": "#3b82f6",
  "In Progress": "#f59e0b",
  "Escalated": "#ef4444",
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
      box-shadow: 0 2px 8px ${color}80, 0 0 0 ${isSelected ? 4 : 2}px rgba(0,0,0,0.1);
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

export default function OfficerMapView() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [useClustering, setUseClustering] = useState(true);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newCount, setNewCount] = useState(0);
  const newCountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
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
  const statuses = ["Unassigned", "Assigned", "In Progress", "Escalated", "Resolved"];

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, address, department..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-1">
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(selectedPriority === p ? null : p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedPriority === p ? "ring-2 ring-offset-1 ring-black/20 dark:ring-white/20" : "opacity-60 hover:opacity-100"
              }`}
              style={{ backgroundColor: `${PRIORITY_COLORS[p]}20`, borderColor: `${PRIORITY_COLORS[p]}40`, color: PRIORITY_COLORS[p] }}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>

        <select
          value={selectedStatus || ""}
          onChange={(e) => setSelectedStatus(e.target.value || null)}
          className="px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">All Status</option>
          {statuses.map((s) => (<option key={s} value={s.toLowerCase()}>{s}</option>))}
        </select>

        <button
          onClick={() => setUseClustering(!useClustering)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
            useClustering ? "bg-primary text-white border-primary" : "bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20"
          }`}
        >
          <Layers className="w-4 h-4" />
          {useClustering ? "Clustered" : "Markers"}
        </button>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground items-center flex-wrap">
        <span>Total: <strong>{stats.total}</strong></span>
        <span style={{ color: PRIORITY_COLORS.high }}>High: <strong>{stats.high}</strong></span>
        <span style={{ color: PRIORITY_COLORS.medium }}>Medium: <strong>{stats.medium}</strong></span>
        <span style={{ color: PRIORITY_COLORS.low }}>Low: <strong>{stats.low}</strong></span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {newCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold animate-pulse">
              +{newCount} new
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-[10px]">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : loading
                  ? "Loading..."
                  : "Waiting for data"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-black/10 dark:border-white/20 relative min-h-[400px]">
        {loading && complaints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {complaints.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground z-10">
            <div className="text-center">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No geo-tagged complaints yet</p>
              <p className="text-xs mt-1">Complaints submitted from the citizen map will appear here</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg px-3 py-2 border border-black/10 dark:border-white/20 shadow-lg text-[10px] space-y-1">
          <p className="font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Status</p>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{status}</span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg px-3 py-2 border border-black/10 dark:border-white/20 shadow-lg text-[10px] space-y-1">
          <p className="font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Priority</p>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{priority}</span>
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
                    <div className="text-xs space-y-1 max-w-[200px]">
                      <p className="font-semibold text-sm">{c.title}</p>
                      <p className="text-muted-foreground">{c.address || c.location}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: `${PRIORITY_COLORS[c.priority?.toLowerCase()] || "#888"}20`, color: PRIORITY_COLORS[c.priority?.toLowerCase()] || "#888" }}
                        >{c.priority}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: `${STATUS_COLORS[c.status] || "#888"}20`, color: STATUS_COLORS[c.status] || "#888" }}
                        >{c.status}</span>
                      </div>
                      <p className="text-muted-foreground">{c.dept}</p>
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
