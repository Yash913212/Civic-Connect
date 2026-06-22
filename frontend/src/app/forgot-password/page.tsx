"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { authService } from "@/auth/authService";
import { Loader2, Mail, ArrowLeft, ArrowRight, ShieldCheck, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { showTextLoading, showSystemStatus } from "@/components/ui/CustomToasts";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    const toastId = showTextLoading("Security Validation", "Checking user registry...");

    try {
      const response = await authService.forgotPassword(email);
      setIsSuccess(true);
      setResetToken(response.reset_token);
      toast.dismiss(toastId);
      showSystemStatus("Dispatch Successful", `Reset payload queued for ${email}`);
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to request password reset";
      setError(errorMsg);
      showSystemStatus("Verification Failed", errorMsg, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12 relative z-10">
      <div className="w-full max-w-[420px] bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-lg dark:shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500 blur-[100px] opacity-20 pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="request-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 mb-2">
                  <Mail size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Recover Password</h2>
                <p className="text-sm text-slate-600 dark:text-white/50">
                  Enter your credentials below to receive a secure password reset handshake payload.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">Email Address</label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/5 dark:bg-black/20 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg py-2.5 px-4 focus:outline-none focus:border-slate-300 dark:focus:border-white/30 placeholder:text-slate-400 dark:placeholder:text-white/20 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 dark:bg-[#e5e5e5] text-white dark:text-black font-semibold rounded-lg py-2.5 hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-message"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-2">
                <MailOpen size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Email Dispatched</h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed">
                  A verification handshake containing password reset instructions has been sent to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>.
                </p>

                {resetToken && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-left space-y-3"
                  >
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                      <ShieldCheck size={16} /> Sandbox Simulator
                    </div>
                    <p className="text-xs text-slate-600 dark:text-white/50 leading-relaxed">
                      For testing convenience in this development sandbox, you can directly launch the reset link below instead of checking the mail log:
                    </p>
                    <Link
                      href={`/reset-password?token=${resetToken}`}
                      className="block w-full text-center py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-xs transition-colors"
                    >
                      Simulate Link Click
                    </Link>
                  </motion.div>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
