import { motion } from "framer-motion";
import { Activity, Shield } from "lucide-react";

export function AdminWidgets() {
  return (
    <motion.div
      key="admin-widgets"
      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex items-center justify-center max-w-7xl mx-auto w-full"
    >
      <motion.div
        initial={{ x: -50, y: -100, opacity: 0 }}
        animate={{ x: -420, y: -120, opacity: 0.8 }}
        transition={{ duration: 1.2, delay: 0.1, type: "spring", bounce: 0.4 }}
        className="absolute hidden lg:grid w-72 h-44 bg-slate-200/60 dark:bg-orange-900/20 border border-slate-300 dark:border-orange-500/30 rounded-2xl backdrop-blur-xl p-5 grid-cols-2 gap-4 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      >
        <div>
          <div className="text-orange-600 dark:text-orange-300 text-[10px] font-semibold uppercase tracking-wider">Total Departments</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">12</div>
        </div>
        <div>
          <div className="text-orange-600 dark:text-orange-300 text-[10px] font-semibold uppercase tracking-wider">Active Officers</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">148</div>
        </div>
        <div className="col-span-2 mt-2">
          <div className="text-orange-600 dark:text-orange-300 text-[10px] font-semibold uppercase tracking-wider mb-2 flex justify-between">
            <span>Resolution Rate</span>
            <span className="text-orange-800 dark:text-orange-100">88%</span>
          </div>
          <div className="w-full h-1.5 bg-orange-950/50 rounded-full overflow-hidden">
            <motion.div className="h-full bg-orange-400" initial={{ width: 0 }} animate={{ width: "88%" }} transition={{ duration: 1, delay: 0.5 }} />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 50, y: 100, opacity: 0 }}
        animate={{ x: 420, y: 120, opacity: 0.8 }}
        transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
        className="absolute hidden lg:flex w-64 h-48 bg-slate-200/60 dark:bg-orange-900/20 border border-slate-300 dark:border-orange-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      >
        <div className="text-orange-600 dark:text-orange-300 text-xs font-semibold tracking-wide uppercase mb-4">System Analytics</div>
        <div className="flex gap-3 h-24">
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex-1 rounded-xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-inner"
          >
            <Activity size={24} />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex-1 rounded-xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-inner"
          >
            <Shield size={24} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
