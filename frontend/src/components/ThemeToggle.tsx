"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10" />;
  }

  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#0B1020] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden z-50 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={false}
    >
      <motion.div
        initial={false}
        animate={{
          y: isDark ? 24 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute"
      >
        <Sun className="w-5 h-5 text-sky-500" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          y: isDark ? 0 : -24,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute"
      >
        <Moon className="w-5 h-5 text-[#00D9FF]" />
      </motion.div>
    </motion.button>
  );
}
