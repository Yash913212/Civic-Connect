"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-destructive/5 blur-[150px] -left-[10%] top-[20%] pointer-events-none" />
      <div className="absolute w-[30vw] h-[30vw] rounded-full bg-orange-500/5 blur-[120px] right-[5%] bottom-[10%] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center relative z-10"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6 border border-destructive/20"
        >
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Something went wrong</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <motion.div
          className="flex gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/20 text-sm font-semibold rounded-xl hover:bg-white/80 dark:hover:bg-black/60 transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
