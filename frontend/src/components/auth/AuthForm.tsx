"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Mail, Lock, User as UserIcon } from "lucide-react";
import { Role } from "./AuthScreen";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone_number: z.string().min(10, { message: "Phone number is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

interface AuthFormProps {
  role: Role;
}

export function AuthForm({ role }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'CITIZEN' && mode === 'register') {
      setMode('login');
    }
  }, [role, mode]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", phone_number: "", password: "" },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock successful login
      document.cookie = `token=mock_${role}_token; path=/;`;
      document.cookie = `role=${role}; path=/;`;
      
      const routes: Record<string, string> = {
        CITIZEN: "/citizen",
        OFFICER: "/officer",
        ADMIN: "/admin",
      };
      // For now we map to the root of the portal, or /citizen/dashboard based on the prompt navigation
      const dashRoutes = {
        CITIZEN: "/citizen/dashboard",
        OFFICER: "/officer/dashboard",
        ADMIN: "/admin/dashboard",
      };
      window.location.href = dashRoutes[role];
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setMode('login');
      // prefill the login form
      loginForm.setValue("email", values.email);
      loginForm.setValue("password", values.password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      {role === 'CITIZEN' && (
        <div className="flex w-full mb-8 rounded-xl bg-white/5 p-1 border border-white/10 backdrop-blur-sm relative">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg z-10 transition-colors ${mode === 'login' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg z-10 transition-colors ${mode === 'register' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            Sign Up
          </button>
          <motion.div
            className="absolute top-1 bottom-1 left-1 bg-white/10 rounded-lg shadow-sm"
            initial={false}
            animate={{
              width: "calc(50% - 4px)",
              x: mode === 'login' ? 0 : "100%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      )}

      {/* Forms */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-center">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-5">
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 text-white/40" size={18} />
                  <input
                    {...loginForm.register("email")}
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-red-400 text-xs pl-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 text-white/40" size={18} />
                  <input
                    {...loginForm.register("password")}
                    type="password"
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-400 text-xs pl-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="hidden" />
                  <div className="w-4 h-4 rounded border border-white/20 bg-white/5 group-hover:border-white/40 flex items-center justify-center">
                     {/* custom check icon here if needed */}
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-sm text-white/60 hover:text-white transition-colors">Forgot password?</button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="flex flex-col gap-5">
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 text-white/40" size={18} />
                  <input
                    {...registerForm.register("full_name")}
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                {registerForm.formState.errors.full_name && (
                  <p className="text-red-400 text-xs pl-1">{registerForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-white/40 text-xs font-bold">#</span>
                  <input
                    {...registerForm.register("phone_number")}
                    type="text"
                    placeholder="Phone Number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                {registerForm.formState.errors.phone_number && (
                  <p className="text-red-400 text-xs pl-1">{registerForm.formState.errors.phone_number.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 text-white/40" size={18} />
                  <input
                    {...registerForm.register("email")}
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-red-400 text-xs pl-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 text-white/40" size={18} />
                  <input
                    {...registerForm.register("password")}
                    type="password"
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-red-400 text-xs pl-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-3 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
