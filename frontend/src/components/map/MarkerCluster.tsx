"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";

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

interface MarkerClusterProps {
  markers: ClusterMarker[];
}

export default function MarkerCluster({ markers }: MarkerClusterProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const mcg = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let color = "#22c55e";
        const markers = cluster.getAllChildMarkers() as L.Marker[];
        const priorities = markers.map((m) => (m as any).__priority as string);
        if (priorities.some((p) => p === "high" || p === "critical" || p === "urgent")) {
          color = "#ef4444";
        } else if (priorities.some((p) => p === "medium")) {
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
      },
    });

    markers.forEach((m) => {
      const marker = L.marker(m.position, { icon: createIcon(m.priority) });
      (marker as any).__priority = m.priority;
      marker.bindPopup(`
        <div style="font-size:12px;line-height:1.5;max-width:200px;font-family:sans-serif;">
          <strong style="font-size:14px;">${m.title}</strong><br/>
          <span style="color:#666;">${m.address || ""}</span><br/>
          <span style="display:inline-block;margin-top:4px;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600;color:${PRIORITY_COLORS[m.priority?.toLowerCase()] || "#888"};background:${PRIORITY_COLORS[m.priority?.toLowerCase()] || "#888"}20;">${m.priority}</span>
          <span style="display:inline-block;margin-left:4px;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600;color:${STATUS_COLORS[m.status] || "#888"};background:${STATUS_COLORS[m.status] || "#888"}20;">${m.status}</span><br/>
          <span style="color:#888;font-size:10px;">${m.dept}</span>
        </div>
      `);
      mcg.addLayer(marker);
    });

    map.addLayer(mcg);
    clusterGroupRef.current = mcg;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, markers]);

  return null;
}
