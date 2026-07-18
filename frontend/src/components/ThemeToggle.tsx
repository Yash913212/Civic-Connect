"use client";

import { useTheme } from "./ThemeProvider";
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

  // Always render the same element type (motion.button) to avoid
  // server/client element-type mismatch. Before mount, render with
  // no interactive behavior and a static placeholder.
  const isDark = mounted ? theme === "dark" : false;

  return (
    <motion.button
      onClick={mounted ? () => setTheme(isDark ? "light" : "dark") : undefined}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden z-50 transition-colors"
      whileHover={mounted ? { scale: 1.05 } : undefined}
      whileTap={mounted ? { scale: 0.95 } : undefined}
      initial={false}
    >
      {mounted ? (
        <>
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
        </>
      ) : (
        /* Placeholder that matches the visual size but avoids hydration mismatch */
        <span className="w-5 h-5" />
      )}
    </motion.button>
  );
}
