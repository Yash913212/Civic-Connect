"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Send } from "lucide-react";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.97 }),
};

export function CommsHubTab() {
  return (
    <motion.div key="comms" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5 flex flex-col h-[600px]">
      <div>
        <h2 className="text-xl font-bold text-white font-heading">Comms Hub</h2>
        <p className="text-sm text-white/40 mt-0.5">Dispatch communications and team coordination</p>
      </div>
      <GlassCard className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="w-1/3 border-r border-white/10 pr-4 flex flex-col gap-2">
          {[
            { name: "Admin Control", msg: "I need backup at Main St.", active: true },
            { name: "Citizen (C-8840)", msg: "Can you provide the gate code?", active: false },
            { name: "Dispatch Center", msg: "Night shift schedule updated", active: false },
          ].map((chat, i) => (
            <div key={i} className={`p-3 rounded-xl cursor-pointer transition-all ${
              chat.active ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/[0.03] border border-transparent'
            }`}>
              <h4 className="font-bold text-sm text-white">{chat.name}</h4>
              <p className="text-xs text-white/50 truncate">{chat.msg}</p>
            </div>
          ))}
        </div>
        <div className="w-2/3 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            <div className="flex flex-col gap-1 items-end">
              <div className="px-4 py-2 bg-emerald-500 text-white rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
                I am on site at Main St. We need a tow truck.
              </div>
              <span className="text-[10px] text-white/30">10:42 AM</span>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <div className="px-4 py-2 bg-white/10 text-white rounded-2xl rounded-tl-sm text-sm max-w-[80%]">
                Copy that. Dispatching a tow truck now. ETA 15 mins.
              </div>
              <span className="text-[10px] text-white/30">10:44 AM</span>
            </div>
          </div>
          <div className="mt-auto relative">
            <input type="text" placeholder="Type a message..."
              className="w-full bg-black/30 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/30">
              <Send size={14} />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
