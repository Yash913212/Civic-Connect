import { motion } from "framer-motion";

export function CitizenWidgets() {
  return (
    <motion.div
      key="citizen-widgets"
      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex items-center justify-center max-w-7xl mx-auto w-full"
    >
      <motion.div
        initial={{ x: -50, y: -100, opacity: 0 }}
        animate={{ x: -400, y: -150, opacity: 0.8 }}
        transition={{ duration: 1.2, delay: 0.1, type: "spring", bounce: 0.4 }}
        className="absolute hidden lg:flex w-64 h-32 bg-slate-200/60 dark:bg-emerald-900/20 border border-slate-300 dark:border-emerald-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col justify-between shadow-[0_0_30px_rgba(59,130,246,0.15)]"
      >
        <div className="text-emerald-600 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase">Complaints Submitted</div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          1,204 <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-full">+12%</span>
        </div>
        <div className="w-full h-1.5 bg-emerald-950/50 rounded-full overflow-hidden mt-2">
          <motion.div className="h-full bg-emerald-400" initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1, delay: 0.5 }} />
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 50, y: 100, opacity: 0 }}
        animate={{ x: 400, y: 150, opacity: 0.8 }}
        transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
        className="absolute hidden lg:flex w-64 h-48 bg-slate-200/60 dark:bg-emerald-900/20 border border-slate-300 dark:border-emerald-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col shadow-[0_0_30px_rgba(59,130,246,0.15)]"
      >
        <div className="text-emerald-600 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-4">Resolution Progress</div>
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-950/50" />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 border-r-emerald-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          />
          <div className="text-lg font-bold text-slate-900 dark:text-white">84%</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute hidden lg:block left-[15%] top-[60%] text-emerald-400"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      </motion.div>
    </motion.div>
  );
}
