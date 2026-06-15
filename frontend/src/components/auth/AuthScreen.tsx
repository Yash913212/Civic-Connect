"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardPreview } from "./DashboardPreview";
import { AuthForm } from "./AuthForm";
import { User, Briefcase, Shield } from "lucide-react";

export type Role = "CITIZEN" | "OFFICER" | "ADMIN";

const ROLE_ORDER: Role[] = ["CITIZEN", "OFFICER", "ADMIN"];

const roleConfigs: Record<
  Role,
  {
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
> = {
  CITIZEN: {
    color: "from-blue-500/25 via-blue-500/10 to-transparent",
    accent: "text-blue-400",
    bgHover: "hover:bg-blue-500/10",
    bgActive: "bg-blue-500/20 border-blue-500/60",
    glowColor: "shadow-[0_0_30px_rgba(59,130,246,0.5)]",
    pillBg: "bg-blue-500/25 border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.35)]",
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

export function AuthScreen() {
  const [role, setRole] = useState<Role>("CITIZEN");
  const prevIndexRef = useRef<number>(0);

  const currentIndex = ROLE_ORDER.indexOf(role);

  const handleRoleChange = (newRole: Role) => {
    prevIndexRef.current = ROLE_ORDER.indexOf(role);
    setRole(newRole);
  };

  // Slide direction: +1 = going right (upgrading), -1 = going left (downgrading)
  const direction = currentIndex >= prevIndexRef.current ? 1 : -1;

  const progressPercent = ((currentIndex + 1) / ROLE_ORDER.length) * 100;

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden flex relative selection:bg-white/20">

      {/* ── Animated background gradient per role ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className={`absolute inset-0 bg-gradient-to-br ${roleConfigs[role].color} opacity-40 mix-blend-screen pointer-events-none`}
        />
      </AnimatePresence>

      {/* ── Horizontal sweep flash on role change ── */}
      <AnimatePresence>
        <motion.div
          key={`sweep-${role}`}
          initial={{ x: direction > 0 ? "-100%" : "100%", opacity: 0.18 }}
          animate={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={`absolute inset-0 pointer-events-none z-20 bg-gradient-to-r ${roleConfigs[role].color}`}
        />
      </AnimatePresence>

      {/* ── Ring pulse ripple emanating from the role selector ── */}
      <AnimatePresence>
        <motion.div
          key={`ring-${role}`}
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          className={`absolute left-[25%] top-[42%] -translate-x-1/2 -translate-y-1/2
            w-16 h-16 rounded-full pointer-events-none z-30 border-2
            ${role === "CITIZEN" ? "border-blue-400" : role === "OFFICER" ? "border-emerald-400" : "border-orange-400"}
          `}
        />
      </AnimatePresence>

      {/* ── Noise texture ── */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="w-full flex flex-col lg:flex-row relative z-10">

        {/* ────── Left: Auth Form ────── */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 border-r border-white/5 bg-black/40 backdrop-blur-3xl">
          <div className="w-full max-w-md flex flex-col gap-7">

            {/* Header */}
            <div className="flex flex-col gap-1.5 text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold tracking-tight text-glow"
              >
                CivicConnect
              </motion.h1>
              <p className="text-white/50 text-sm">Enterprise AI Governance Platform</p>
            </div>

            {/* ── Role Selector ── */}
            <div className="flex items-stretch gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md relative">
              {ROLE_ORDER.map((r) => {
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`
                      flex-1 relative flex items-center justify-center gap-2
                      py-2.5 px-3 rounded-xl text-sm font-medium
                      transition-colors duration-200
                      ${isActive ? roleConfigs[r].accent : "text-white/45 " + roleConfigs[r].bgHover}
                    `}
                    style={{ isolation: "isolate" }}
                  >
                    {/* Spring-animated sliding pill */}
                    {isActive && (
                      <motion.span
                        layoutId="role-active-pill"
                        className={`absolute inset-0 rounded-xl ${roleConfigs[r].pillBg}`}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                          mass: 0.7,
                        }}
                        style={{ zIndex: -1 }}
                      />
                    )}

                    {/* Icon: spins in when becoming active */}
                    <motion.span
                      animate={
                        isActive
                          ? { rotate: 0, scale: 1.15, opacity: 1 }
                          : { rotate: 0, scale: 1, opacity: 0.45 }
                      }
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      className="flex-shrink-0"
                    >
                      {roleConfigs[r].icon}
                    </motion.span>

                    {/* Label */}
                    <span className="hidden sm:inline relative z-10 tracking-wide">
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Progress bar: tracks privilege level ── */}
            <div className="relative -mt-3">
              <div className="h-[3px] bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    role === "CITIZEN"
                      ? "bg-gradient-to-r from-blue-600 to-blue-400"
                      : role === "OFFICER"
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      : "bg-gradient-to-r from-orange-600 to-orange-400"
                  }`}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 24 }}
                />
              </div>

              {/* Animated role badge */}
              <div className="mt-2.5 flex items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`badge-${role}`}
                    initial={{ opacity: 0, y: 5, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -5, filter: "blur(5px)" }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest
                      px-2.5 py-1 rounded-md bg-white/5 border border-white/10
                      ${roleConfigs[role].accent}`}
                  >
                    <span>{roleConfigs[role].emoji}</span>
                    <span>{roleConfigs[role].label}</span>
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* ── Auth Form: slides in from direction of navigation ── */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={role}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    opacity: 0,
                    x: dir > 0 ? 40 : -40,
                    filter: "blur(6px)",
                  }),
                  center: {
                    opacity: 1,
                    x: 0,
                    filter: "blur(0px)",
                  },
                  exit: (dir: number) => ({
                    opacity: 0,
                    x: dir > 0 ? -40 : 40,
                    filter: "blur(6px)",
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              >
                <AuthForm role={role} />
              </motion.div>
            </AnimatePresence>

          </div>
        </div>

        {/* ────── Right: Dashboard Preview ────── */}
        <div className="hidden lg:flex w-1/2 items-center justify-center relative">
          <DashboardPreview role={role} />
        </div>

      </div>
    </div>
  );
}
