/**
 * Pure utility formatters for complaint data.
 * Extracted to avoid transitive ESM imports (react-leaflet) in Jest tests.
 */

export const formatDepartment = (dept: string) => {
  if (!dept) return "General";
  const d = dept.toLowerCase();
  if (d.includes("road")) return "Roads";
  if (d.includes("drain")) return "Drainage";
  if (d.includes("garb") || d.includes("sanit") || d.includes("wast")) return "Garbage";
  if (d.includes("water")) return "Water";
  if (d.includes("light")) return "Streetlight";
  if (d.includes("elect")) return "Electricity";
  if (d.includes("safe")) return "Safety";
  if (d.includes("traf")) return "Traffic";
  return "General";
};

export const formatPriority = (pri: string) => {
  if (!pri) return "Low";
  const p = pri.toLowerCase();
  if (p.includes("crit") || p.includes("urg") || p.includes("emer")) return "Critical";
  if (p.includes("high")) return "High";
  if (p.includes("med")) return "Medium";
  return "Low";
};
