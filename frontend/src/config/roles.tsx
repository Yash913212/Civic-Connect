import { User, Briefcase, Shield, Activity } from "lucide-react";

export type Role = "CITIZEN" | "OFFICER" | "ADMIN";

export const ROLE_ORDER: Role[] = ["CITIZEN", "OFFICER", "ADMIN"];

export interface RoleStyle {
  color: string;
  accent: string;
  bgHover: string;
  bgActive: string;
  glowColor: string;
  pillBg: string;
  icon: React.ReactNode;
  label: string;
  emoji: string;
}

export const roleStyles: Record<Role, RoleStyle> = {
  CITIZEN: {
    color: "from-emerald-500/25 via-emerald-500/10 to-transparent",
    accent: "text-emerald-400",
    bgHover: "hover:bg-emerald-500/10",
    bgActive: "bg-emerald-500/20 border-emerald-500/60",
    glowColor: "shadow-[0_0_30px_rgba(59,130,246,0.5)]",
    pillBg: "bg-emerald-500/25 border border-emerald-400/50 shadow-[0_0_20px_rgba(59,130,246,0.35)]",
    icon: <User size={17} />,
    label: "Public Portal",
    emoji: "🌐",
  },
  OFFICER: {
    color: "from-emerald-500/25 via-emerald-500/10 to-transparent",
    accent: "text-emerald-400",
    bgHover: "hover:bg-emerald-500/10",
    bgActive: "bg-emerald-500/20 border-emerald-500/60",
    glowColor: "shadow-[0_0_30px_rgba(16,185,129,0.5)]",
    pillBg: "bg-emerald-500/25 border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    icon: <Briefcase size={17} />,
    label: "Officer Gateway",
    emoji: "🛡️",
  },
  ADMIN: {
    color: "from-orange-500/25 via-orange-500/10 to-transparent",
    accent: "text-orange-400",
    bgHover: "hover:bg-orange-500/10",
    bgActive: "bg-orange-500/20 border-orange-500/60",
    glowColor: "shadow-[0_0_30px_rgba(245,158,11,0.5)]",
    pillBg: "bg-orange-500/25 border border-orange-400/50 shadow-[0_0_20px_rgba(245,158,11,0.35)]",
    icon: <Shield size={17} />,
    label: "Admin Console",
    emoji: "⚡",
  },
};

export interface RoleColors {
  bg: string;
  hex: string;
}

export const roleColors: Record<Role, RoleColors> = {
  CITIZEN: { bg: "bg-emerald-500/20 text-emerald-500", hex: "#3B82F6" },
  OFFICER: { bg: "bg-green-500/20 text-green-500", hex: "#22C55E" },
  ADMIN: { bg: "bg-purple-500/20 text-purple-500", hex: "#A855F7" },
};

export const roleIcons: Record<Role, React.ReactNode> = {
  CITIZEN: <User size={20} />,
  OFFICER: <Briefcase size={20} />,
  ADMIN: <Shield size={20} />,
};

export const roleDetails: Record<Role, { title: string; description: string }> = {
  CITIZEN: { title: "Citizen", description: "Civic Reporting & Tracking" },
  OFFICER: { title: "Officer", description: "Field Operations Management" },
  ADMIN: { title: "Admin", description: "Governance Analytics" },
};

export const dashRoutes: Record<Role, string> = {
  CITIZEN: "/citizen/dashboard",
  OFFICER: "/officer/dashboard",
  ADMIN: "/admin/dashboard",
};

export const portalLabels: Record<Role, string> = {
  CITIZEN: "Citizen Portal",
  OFFICER: "Officer Portal",
  ADMIN: "Admin Portal",
};

export function getPortalLink(role: Role): string {
  return dashRoutes[role];
}

export function getPortalLabel(role: Role): string {
  return portalLabels[role];
}
