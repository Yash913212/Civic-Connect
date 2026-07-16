import { motion } from "framer-motion";

export function OfficerWidgets() {
  return (
    <motion.div
      key="officer-widgets"
      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex items-center justify-center max-w-7xl mx-auto w-full"
    >
      <motion.div
        initial={{ x: 50, y: -100, opacity: 0 }}
        animate={{ x: 400, y: -150, opacity: 0.8 }}
        transition={{ duration: 1.2, delay: 0.1, type: "spring", bounce: 0.4 }}
        className="absolute hidden lg:flex w-64 h-36 bg-slate-200/60 dark:bg-green-900/20 border border-slate-300 dark:border-green-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col justify-between shadow-[0_0_30px_rgba(34,197,94,0.15)]"
      >
        <div className="text-green-600 dark:text-green-300 text-xs font-semibold tracking-wide uppercase">Assigned Cases</div>
        <div className="text-4xl font-bold text-slate-900 dark:text-white">42</div>
        <div className="flex gap-1.5 mt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className={`h-2 flex-1 rounded-full origin-left ${i <= 3 ? 'bg-green-400' : 'bg-green-950/50'}`}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ x: -50, y: 100, opacity: 0 }}
        animate={{ x: -400, y: 150, opacity: 0.8 }}
        transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
        className="absolute hidden lg:flex w-64 h-48 bg-slate-200/60 dark:bg-green-900/20 border border-slate-300 dark:border-green-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col shadow-[0_0_30px_rgba(34,197,94,0.15)]"
      >
        <div className="text-green-600 dark:text-green-300 text-xs font-semibold tracking-wide uppercase mb-4">Officer Performance</div>
        <div className="w-full h-full flex items-end justify-between gap-2 pb-2">
          {[40, 70, 45, 90, 65, 80].map((h, i) => (
            <motion.div
              key={i}
              className="w-6 bg-gradient-to-t from-green-500/20 to-green-400/80 rounded-t-md"
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1, delay: 0.4 + i * 0.1, type: "spring" }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
