"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { withRoleGuard } from "@/middleware/roleGuard";
import { gamificationService, GamificationProfile, LeaderboardEntry, BadgeInfo } from "@/services/gamificationService";
import { Trophy, Star, Award, Zap, Share2, Flame, ArrowLeft, Shield, Activity, CheckCircle2, ChevronRight } from "lucide-react";
import Footer from "@/components/sections/Footer";

function CitizenLeaderboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);

  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        const [profileData, leaderboardData, badgesData] = await Promise.all([
          gamificationService.getProfile(),
          gamificationService.getLeaderboard(20),
          gamificationService.getBadges()
        ]);
        setProfile(profileData);
        setLeaderboard(leaderboardData);
        setAllBadges(badgesData);
      } catch (error) {
        console.error("Failed to load gamification data", error);
      } finally {
        setLoading(false);
      }
    };

    loadGamificationData();
  }, []);

  // Shared score helper
  const handleShare = () => {
    if (!profile) return;
    const shareText = `I have earned ${profile.points} Civic Points and reached Level ${profile.level} on Civic Connect! 🌟 Join me in reporting community issues and winning rewards. #CivicConnect #SmartCity`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-white/70 animate-pulse font-mono">Initializing Civic Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-[#030712] text-white relative w-full min-h-screen pt-28 pb-16 flex flex-col justify-between select-none">
      {/* Background static noise and glows */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-amber-500/5 blur-[120px] left-[-10%] top-[10%] pointer-events-none z-0" />
      <div className="absolute w-[50vw] h-[50vw] rounded-full bg-teal-500/5 blur-[120px] right-[-10%] bottom-[10%] pointer-events-none z-0" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 w-full max-w-7xl flex-grow">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => window.close()} 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 hover:text-teal-300 transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Close Tab
            </button>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-amber-300">
              Civic Rewards & <span className="text-teal-400">Leaderboard</span>
            </h1>
            <p className="text-sm text-white/50 mt-2 max-w-xl">
              Earn Civic Points by submitting valid reports. Level up your city standing and unlock premium utility badges.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all text-amber-400"
            >
              <Share2 className="w-4 h-4" /> Share Progress
            </motion.button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Left Column: User Status & Badges */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Main Stats Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Your Standing</h2>
                    <p className="text-xs text-white/40">Leaderboard Rank: <span className="text-amber-400 font-bold">#{profile?.leaderboard_position || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Civic Points</span>
                    <span className="text-3xl font-black text-amber-400 font-mono">{profile?.points || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Current Level</span>
                    <span className="text-3xl font-black text-teal-400 font-mono">Lvl {profile?.level || 1}</span>
                  </div>
                </div>
              </div>

              {/* Progress and Streak */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-2">
                    <span className="text-white/60">Level Progress</span>
                    <span className="text-white/40">{profile?.points_to_next_level} XP left</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-amber-500 to-teal-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${profile?.level_progress_percentage || 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 mt-1 font-semibold">
                    <span>Lvl {profile?.level}</span>
                    <span>{Math.round(profile?.level_progress_percentage || 0)}%</span>
                    <span>Lvl {(profile?.level || 1) + 1}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                      <Flame className="w-5 h-5 fill-orange-500/20" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/90">Daily Streak</h4>
                      <p className="text-[10px] text-white/40">Report daily to stack</p>
                    </div>
                  </div>
                  <span className="text-xl font-mono font-bold text-orange-400">{profile?.streak_days || 0} Days</span>
                </div>
              </div>
            </div>

            {/* Badges Gallery */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-400" />
                    <span>Your Achievement Badges</span>
                  </h3>
                  <p className="text-xs text-white/40 mt-1">Unlock badges by meeting validation criteria</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-teal-400">
                  {profile?.earned_badges_count || 0} / {profile?.total_badges || 0} Earned
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {allBadges.map((badge) => {
                  const isEarned = profile?.badges.some(b => b.id === badge.id) || false;
                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={{ y: -3 }}
                      onClick={() => setSelectedBadge(badge)}
                      className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                        isEarned 
                          ? 'bg-gradient-to-b from-teal-500/5 to-emerald-500/5 border-teal-500/30 hover:border-teal-500/60 shadow-[0_4px_15px_rgba(20,184,166,0.05)]' 
                          : 'bg-white/[0.01] border-white/5 hover:border-white/10 opacity-60'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform ${
                        isEarned ? 'bg-teal-500/10 text-teal-400' : 'bg-white/5 text-white/20'
                      }`}>
                        <Award className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-white/95 line-clamp-1">{badge.name}</h4>
                      <span className="text-[9px] uppercase font-bold text-teal-400 mt-1.5 font-mono">
                        +{badge.points} PTS
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Leaderboard Standings */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 md:p-8">
              <div className="flex items-center gap-2.5 mb-6">
                <Star className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold">Top Citizen Standings</h3>
              </div>

              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.user_id} 
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      entry.rank === 1 ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]' :
                      entry.rank === 2 ? 'bg-slate-400/10 border-slate-400/20' :
                      entry.rank === 3 ? 'bg-orange-500/10 border-orange-500/20' :
                      'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`text-sm font-extrabold w-5 text-center ${
                        entry.rank === 1 ? 'text-amber-400' :
                        entry.rank === 2 ? 'text-slate-300' :
                        entry.rank === 3 ? 'text-orange-400' :
                        'text-white/40'
                      }`}>
                        #{entry.rank}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">{entry.name}</span>
                        <span className="text-[10px] text-white/40">Lvl {entry.level} • {entry.badges_count} Badges</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-black/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-amber-400 font-mono">{entry.points}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Badge Info Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{selectedBadge.name}</h3>
              <p className="text-sm text-white/60 mb-4">{selectedBadge.description}</p>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 font-mono font-bold text-xs">
                VALUE: +{selectedBadge.points} PTS
              </div>
              <button 
                onClick={() => setSelectedBadge(null)}
                className="w-full mt-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all text-white"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

export default withRoleGuard(CitizenLeaderboard, ['CITIZEN', 'ADMIN']);
