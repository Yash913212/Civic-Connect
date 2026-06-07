"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardPreview } from "./DashboardPreview";
import { AuthForm } from "./AuthForm";
import { User, Briefcase, Shield } from "lucide-react";

export type Role = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export function AuthScreen() {
  const [role, setRole] = useState<Role>('CITIZEN');

  const roleConfigs = {
    CITIZEN: {
      color: "from-blue-500/20 via-blue-500/10 to-transparent",
      accent: "text-blue-500",
      bgHover: "hover:bg-blue-500/10",
      bgActive: "bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      icon: <User size={18} />,
      transitionAnimation: "glow"
    },
    OFFICER: {
      color: "from-green-500/20 via-green-500/10 to-transparent",
      accent: "text-green-500",
      bgHover: "hover:bg-green-500/10",
      bgActive: "bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
      icon: <Briefcase size={18} />,
      transitionAnimation: "pulse"
    },
    ADMIN: {
      color: "from-orange-500/20 via-orange-500/10 to-transparent",
      accent: "text-orange-500",
      bgHover: "hover:bg-orange-500/10",
      bgActive: "bg-orange-500/20 border-orange-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      icon: <Shield size={18} />,
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden flex relative selection:bg-white/20">
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 bg-gradient-to-br ${roleConfigs[role].color} opacity-40 mix-blend-screen pointer-events-none`}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      <div className="w-full flex flex-col lg:flex-row relative z-10">
        {/* Left Side: Auth Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 border-r border-white/5 bg-black/40 backdrop-blur-3xl">
          <div className="w-full max-w-md flex flex-col gap-8">
            
            <div className="flex flex-col gap-2 text-center lg:text-left">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold tracking-tight text-glow"
              >
                CivicConnect
              </motion.h1>
              <p className="text-white/60">Enterprise AI Governance Platform</p>
            </div>

            {/* Role Selector */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
              {(Object.keys(roleConfigs) as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-300 border border-transparent
                    ${role === r ? roleConfigs[r].bgActive + ' ' + roleConfigs[r].accent : 'text-white/60 ' + roleConfigs[r].bgHover}
                  `}
                >
                  {roleConfigs[r].icon}
                  <span className="hidden sm:inline">{r.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            {/* Form */}
            <AuthForm role={role} />

          </div>
        </div>

        {/* Right Side: Dashboard Preview */}
        <div className="hidden lg:flex w-1/2 items-center justify-center relative">
          <DashboardPreview role={role} />
        </div>
      </div>
    </div>
  );
}
