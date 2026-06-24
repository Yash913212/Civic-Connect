"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Footer from "@/components/sections/Footer";
import { 
  User, 
  Mail, 
  MapPin, 
  Award, 
  Activity, 
  CheckCircle, 
  Sliders, 
  LogOut, 
  Terminal, 
  Lock, 
  Bell, 
  Save
} from "lucide-react";
import { showSystemStatus } from "@/components/ui/CustomToasts";

export default function CitizenProfile() {
  const router = useRouter();
  
  // Profile settings state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("Zone 4 - Municipal Smart Grid");
  const [role, setRole] = useState("Smart City Lead");
  const [bio, setBio] = useState("Computer Science Student building automated smart city models & neural infrastructure.");
  
  // Notification toggles
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<"edit" | "security" | "activity">("edit");

  useEffect(() => {
    // Read session details
    const storedName = sessionStorage.getItem("user-name");
    const storedEmail = sessionStorage.getItem("user-email");
    if (storedName && storedEmail) {
      setName(storedName);
      setEmail(storedEmail);
      setRole(storedEmail.includes("admin") || storedName.toLowerCase().includes("yash") || storedName.toLowerCase().includes("yaswanth") ? "Smart City Lead" : "Validated Citizen");
    } else {
      // Default fallback developer credentials
      setName("Amjuri Yaswanth");
      setEmail("yash@civicai.org");
      setRole("Smart City Lead");
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("user-name", name);
    sessionStorage.setItem("user-email", email);
    
    // Trigger live visual update event for navbar!
    window.dispatchEvent(new Event("storage"));
    
    // Show premium success toast
    showSystemStatus("Profile Updated", "Configurations saved successfully");
  };

  const handleSignOut = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen pt-32 pb-24 flex flex-col justify-between select-none">
      
      {/* Background static noise and cyber glows */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-purple-500/5 blur-[120px] left-[5%] top-[10%] pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-cyan-500/5 blur-[120px] right-[5%] bottom-[10%] pointer-events-none z-0" />

      {/* Profile Core Layout */}
      <div className="container mx-auto px-6 relative z-10 w-full max-w-6xl flex-grow mb-16">
        
        {/* Main Title Row */}
        <div className="mb-12">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-cyan-400 mb-2 block">
            CONTROL CENTER
          </span>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white tracking-tight">
            User <span className="text-gradient">Profile</span> & Configurations
          </h1>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Left Column - User Sidebar Card */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Glassmorphic Profile Card */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              
              {/* Dynamic Glow Background */}
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
              
              {/* Avatar circle with glow */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold font-heading mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/20">
                {name.charAt(0).toUpperCase()}
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full" />
              </div>

              {/* Name & Bio */}
              <h2 className="text-xl font-bold text-white tracking-wide mb-1 font-heading">{name}</h2>
              <p className="text-xs text-cyan-400 font-semibold mb-3 tracking-wider uppercase">{role}</p>
              <p className="text-xs text-white/50 leading-relaxed mb-6 max-w-xs">{bio}</p>

              {/* Verified Trust Stats Gauge */}
              <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-white/5 mb-6 text-left">
                <div>
                  <span className="text-[10px] uppercase text-white/40 block font-semibold">Trust Index</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-sm font-bold font-mono text-white">99.8%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/40 block font-semibold">Verified Issues</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-sm font-bold font-mono text-white">14 Active</span>
                  </div>
                </div>
              </div>

              {/* Tab Navigation Shortcuts */}
              <div className="w-full space-y-1.5">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl border transition-all text-left ${
                    activeTab === "edit"
                      ? "bg-white/[0.06] border-white/10 text-white shadow-inner"
                      : "bg-transparent border-transparent text-white/50 hover:bg-white/[0.02]"
                  }`}
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Configure Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl border transition-all text-left ${
                    activeTab === "security"
                      ? "bg-white/[0.06] border-white/10 text-white shadow-inner"
                      : "bg-transparent border-transparent text-white/50 hover:bg-white/[0.02]"
                  }`}
                >
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Security & session logs</span>
                </button>

                <button
                  onClick={() => setActiveTab("activity")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl border transition-all text-left ${
                    activeTab === "activity"
                      ? "bg-white/[0.06] border-white/10 text-white shadow-inner"
                      : "bg-transparent border-transparent text-white/50 hover:bg-white/[0.02]"
                  }`}
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Activities history</span>
                </button>
              </div>

            </div>

            {/* Logout Container */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/30 text-rose-400 transition-all font-semibold text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>

          </div>

          {/* Right Column - Main tab content panels */}
          <div className="lg:col-span-8">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 md:p-8 shadow-2xl min-h-[500px]">
              
              {/* Tab 1: Edit Settings Panel */}
              {activeTab === "edit" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    <span>Configuration Parameters</span>
                  </h3>

                  <form onSubmit={handleSave} className="space-y-5">
                    {/* Name input */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold uppercase text-white/60 tracking-wider">Full Profile Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-black/20 text-white border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-cyan-500/40 placeholder:text-white/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Email input */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold uppercase text-white/60 tracking-wider">Contact Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-black/20 text-white border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-cyan-500/40 placeholder:text-white/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Neighborhood Geolocation */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold uppercase text-white/60 tracking-wider">Operating District Zone</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full bg-black/20 text-white border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-cyan-500/40 placeholder:text-white/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold uppercase text-white/60 tracking-wider">Vision Statement / Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full bg-black/20 text-white border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500/40 placeholder:text-white/20 transition-all text-sm leading-relaxed resize-none"
                      />
                    </div>

                    {/* Custom Notifications panel */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <h4 className="text-sm font-bold text-white/80 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-cyan-400" />
                        <span>Notification Preferences</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Email notify */}
                        <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-colors">
                          <span className="text-xs font-medium text-white/70">Email Updates</span>
                          <input
                            type="checkbox"
                            checked={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.checked)}
                            className="w-4 h-4 accent-cyan-500 rounded border-white/10 cursor-pointer"
                          />
                        </label>

                        {/* Web Notify */}
                        <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-colors">
                          <span className="text-xs font-medium text-white/70">Browser Alerts</span>
                          <input
                            type="checkbox"
                            checked={notifyWeb}
                            onChange={(e) => setNotifyWeb(e.target.checked)}
                            className="w-4 h-4 accent-cyan-500 rounded border-white/10 cursor-pointer"
                          />
                        </label>

                        {/* SMS notify */}
                        <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-colors">
                          <span className="text-xs font-medium text-white/70">Emergency SMS</span>
                          <input
                            type="checkbox"
                            checked={notifySms}
                            onChange={(e) => setNotifySms(e.target.checked)}
                            className="w-4 h-4 accent-cyan-500 rounded border-white/10 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6 text-right">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Configuration</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Tab 2: Security and session logs */}
              {activeTab === "security" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-400" />
                    <span>Security Profile & Authorization</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Security level */}
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Authentication Layer</span>
                        <h4 className="text-lg font-bold text-white mt-1">L3 Dev Administrator</h4>
                      </div>
                      <span className="text-[10px] text-purple-400 font-semibold mt-4">Authorized Geotagged Shell</span>
                    </div>

                    {/* Trust Rank details */}
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Digital Verification Handshake</span>
                        <h4 className="text-lg font-bold text-white mt-1">99.8% Perfect Accuracy</h4>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-semibold mt-4">Secured with SHA-256 Hash</span>
                    </div>
                  </div>

                  {/* Dev Terminal Session Log */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-white/60 tracking-wider">System Handshake Access Logs</label>
                    <div className="rounded-xl border border-white/10 bg-black/80 p-4 font-mono text-xs text-white/70 space-y-1.5 max-h-60 overflow-y-auto leading-relaxed">
                      <p className="text-white/40">{"[SYSTEM HANDSHAKE LOGS]"}</p>
                      <p className="text-emerald-400">{"[INFO] 16:51:48 SECURITY_HANDSHAKE_COMPLETED"}</p>
                      <p className="text-cyan-400">{"[INFO] 16:51:48 LOCAL_GEOLOCATION_CHECK: MUMBAI_IN [PASS]"}</p>
                      <p className="text-purple-400">{"[DEVEL] 16:51:49 LOADED_FASTAPI_DEPARTMENT_CLASSIFIER"}</p>
                      <p className="text-purple-400">{"[DEVEL] 16:51:49 MURIL_MULTILINGUAL_TEXT_PROCESSOR: OK"}</p>
                      <p className="text-white/60">{"[AUTH] 16:51:50 SESSION_SESSIONSTORAGE_WRITE_COMPLETE"}</p>
                      <p className="text-emerald-400">{"[INFO] 16:51:50 CITIZEN_TRUST_RATING_CALCULATOR: ACTIVE [99.8%]"}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Verified Activity Log */}
              {activeTab === "activity" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <span>Citizen Verification Activity Logs</span>
                  </h3>

                  {/* Activity List */}
                  <div className="space-y-4">
                    
                    {/* Activity 1 */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">Reported open pothole near MG Road</h4>
                          <span className="text-[10px] text-white/40">2 hours ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                          Image uploaded, classified automatically as `Road Damage` with high priority. Routed to PWD department.
                        </p>
                      </div>
                    </div>

                    {/* Activity 2 */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">Validated Garbage Dump near Central Lake</h4>
                          <span className="text-[10px] text-white/40">1 day ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                          Verified through local resident community check. Classified as resolved on public database.
                        </p>
                      </div>
                    </div>

                    {/* Activity 3 */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">Trained classifier model weights upload</h4>
                          <span className="text-[10px] text-white/40">3 days ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                          Trained custom neural classifier using a batch of 5,000 locally uploaded civic images.
                        </p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

            </div>
          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}
