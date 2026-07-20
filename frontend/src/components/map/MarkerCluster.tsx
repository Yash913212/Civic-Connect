"use client";

import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup } from "react-leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface ClusterMarker {
  position: [number, number];
  title: string;
  priority: string;
  status: string;
  dept: string;
  address: string;
  complaintId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  "Unassigned": "#6b7280",
  "Assigned": "#3b82f6",
  "In Progress": "#f59e0b",
  "Escalated": "#ef4444",
  "Resolved": "#22c55e",
};

function createIcon(priority: string) {
  const color = PRIORITY_COLORS[priority?.toLowerCase()] || "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px ${color}80;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount();
  let color = "#22c55e";
  const markers = cluster.getAllChildMarkers();
  const priorities: string[] = markers.map((m: any) => m.options.priority as string);
  
  if (priorities.some((p: string) => p === "high" || p === "critical" || p === "urgent")) {
    color = "#ef4444";
  } else if (priorities.some((p: string) => p === "medium")) {
    color = "#f59e0b";
  }

  return L.divIcon({
    className: "",
    html: `<div style="
      width:44px;height:44px;border-radius:50%;
      background:${color}dd;border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;color:white;
      box-shadow:0 3px 12px ${color}60;
    ">${count}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

interface MarkerClusterProps {
  markers: ClusterMarker[];
}

export default function MarkerCluster({ markers }: MarkerClusterProps) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={60}
    >
      {markers.map((m, idx) => (
        <Marker
          key={m.complaintId || idx}
          position={m.position}
          icon={createIcon(m.priority)}
          // @ts-expect-error - passing priority to marker options for cluster icon styling
          priority={m.priority?.toLowerCase()}
        >
          <Popup>
            <div style={{ fontSize: "12px", lineHeight: "1.5", maxWidth: "200px", fontFamily: "sans-serif" }}>
              <strong style={{ fontSize: "14px" }}>{m.title}</strong><br/>
              <span style={{ color: "#666" }}>{m.address || ""}</span><br/>
              <span style={{
                display: "inline-block", marginTop: "4px", padding: "1px 8px", borderRadius: "4px",
                fontSize: "11px", fontWeight: 600,
                color: PRIORITY_COLORS[m.priority?.toLowerCase()] || "#888",
                background: `${PRIORITY_COLORS[m.priority?.toLowerCase()] || "#888"}20`
              }}>{m.priority}</span>
              <span style={{
                display: "inline-block", marginLeft: "4px", padding: "1px 8px", borderRadius: "4px",
                fontSize: "11px", fontWeight: 600,
                color: STATUS_COLORS[m.status] || "#888",
                background: `${STATUS_COLORS[m.status] || "#888"}20`
              }}>{m.status}</span><br/>
              <span style={{ color: "#888", fontSize: "10px" }}>{m.dept}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}
