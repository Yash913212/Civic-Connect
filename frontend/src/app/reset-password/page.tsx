"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { authService } from "@/auth/authService";
import { Loader2, Key, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { showTextLoading, showSystemStatus } from "@/components/ui/CustomToasts";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Secure handshake token is missing from the request URL. Please request a new link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const toastId = showTextLoading("Handshake Verification", "Applying cryptographic updates...");

    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
      toast.dismiss(toastId);
      showSystemStatus("Cryptographic Update Success", "Credentials updated in registry");
      
      // Auto redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to reset password";
      setError(errorMsg);
      showSystemStatus("Reset Failed", errorMsg, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-lg dark:shadow-2xl relative overflow-hidden">
      {/* Glow decoration */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-500 blur-[100px] opacity-20 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="reset-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-2">
                <Key size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reset Password</h2>
              <p className="text-sm text-slate-600 dark:text-white/50">
                Establish new cryptographic credentials for your Nagara Netra profile.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-center">
                {error}
              </div>
            )}

            {token && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="****************"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/5 dark:bg-black/20 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:border-slate-300 dark:focus:border-white/30 placeholder:text-slate-400 dark:placeholder:text-white/20 transition-colors tracking-widest"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="****************"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/5 dark:bg-black/20 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:border-slate-300 dark:focus:border-white/30 placeholder:text-slate-400 dark:placeholder:text-white/20 transition-colors tracking-widest"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
                      Update Password
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

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
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Credentials Updated</h2>
            <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed">
              Your credentials have been successfully updated. Redirecting to Portal Sign-In...
            </p>
            <div className="w-full bg-black/5 dark:bg-black/20 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12 relative z-10">
      <Suspense fallback={
        <div className="w-full max-w-[420px] bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 backdrop-blur-md flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
