"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, User, LogOut, ShieldCheck, Award, Settings, Terminal, Activity } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    // Load active session from sessionStorage with fallback
    const loadSession = () => {
      const storedName = sessionStorage.getItem("user-name");
      const storedEmail = sessionStorage.getItem("user-email");
      if (storedName && storedEmail) {
        setUser({
          name: storedName,
          email: storedEmail,
          role: storedEmail.includes("admin") || storedName.toLowerCase().includes("yash") || storedName.toLowerCase().includes("yaswanth") ? "Smart City Lead" : "Validated Citizen",
        });
      } else {
        // Fallback developer session
        setUser({
          name: "Amjuri Yaswanth",
          email: "yash@civicai.org",
          role: "Smart City Lead",
        });
      }
    };

    loadSession();
    
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("storage", loadSession);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", loadSession);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace(/.*\#/, "");
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("user-name");
    sessionStorage.removeItem("user-email");
    sessionStorage.removeItem("transition-from-login");
    setUser(null);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const navLinks = [
    { name: "Platform", href: "#platform" },
    { name: "Technology", href: "#technology" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Roadmap", href: "#roadmap" },
  ];

  if (pathname === "/") return null;

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-black/40 backdrop-blur-xl border-b border-white/10 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)]" 
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 rounded-md group-hover:scale-105 transition-transform duration-300 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Civic Connect Logo" className="object-contain w-full h-full" />
            </div>
            <span className="text-xl font-bold font-heading text-white tracking-wider group-hover:text-cyan-400 transition-colors">
              Civic Connect
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-full px-6 py-2 backdrop-blur-md">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Profile Dropdown trigger or Launch App button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="Toggle user profile menu"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-3 py-1.5 pl-2.5 pr-4 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 shadow-md group"
                >
                  {/* Dynamic Glowing Avatar */}
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold font-heading shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all">
                    {user.name.charAt(0).toUpperCase()}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-black rounded-full" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-none mb-0.5">{user.name}</p>
                    <p className="text-[10px] text-cyan-400 font-semibold leading-none">{user.role}</p>
                  </div>
                </button>

                {/* Glassmorphic Dropdown Card */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl p-4 shadow-[0_10px_50px_rgba(0,0,0,0.5)] z-[100] text-left"
                    >
                      {/* User Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h5 className="text-sm font-bold text-white truncate">{user.name}</h5>
                          <p className="text-xs text-white/50 truncate mb-1">{user.email}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            {user.role}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Profile Stats/Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] transition-colors border border-white/5">
                          <div className="flex items-center gap-2 text-white/70">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] font-medium">Session Status</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">Secured</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] transition-colors border border-white/5">
                          <div className="flex items-center gap-2 text-white/70">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-[11px] font-medium">Trust Rank</span>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-bold font-mono">99.8%</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] transition-colors border border-white/5">
                          <div className="flex items-center gap-2 text-white/70">
                            <Terminal className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px] font-medium">Role Level</span>
                          </div>
                          <span className="text-[10px] text-purple-400 font-bold">L3 Validator</span>
                        </div>
                      </div>

                      {/* Dropdown Actions */}
                      <div className="space-y-1.5">
                        <Link
                          href="/citizen/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-left"
                        >
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span>Citizen Portal</span>
                        </Link>
                        <Link
                          href="/citizen/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-left"
                        >
                          <Settings className="w-4 h-4 text-emerald-400" />
                          <span>User Profile</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-500/20 rounded-xl border border-rose-500/10 hover:border-rose-500/30 transition-all text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out Session</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                href="/citizen/dashboard"
                className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Citizen Portal
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex flex-col pt-24 px-6 justify-between pb-12"
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close mobile navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex flex-col gap-6 text-center">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-2xl font-heading font-medium text-white/80 hover:text-white cursor-pointer"
                  onClick={(e) => handleScrollTo(e, link.href)}
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Mobile User Profile Section */}
            <div>
              {user ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-left backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-white font-bold text-base">{user.name}</h5>
                      <p className="text-xs text-white/50">{user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/citizen/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Citizen Portal
                  </Link>
                  <Link
                    href="/citizen/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    User Profile
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full py-3 bg-rose-500/15 border border-rose-500/20 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out Session
                  </button>
                </div>
              ) : (
                <Link 
                  href="/citizen/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-4 bg-white text-black rounded-full font-bold text-lg inline-block text-center"
                >
                  Citizen Portal
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
