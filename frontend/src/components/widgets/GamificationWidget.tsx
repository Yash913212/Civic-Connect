"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Star, Award, ChevronRight, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { gamificationService, GamificationProfile, LeaderboardEntry } from "@/services/gamificationService";
import { useRouter } from "next/navigation";

export default function GamificationWidget() {
  const router = useRouter();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        const [profileData, leaderboardData] = await Promise.all([
          gamificationService.getProfile(),
          gamificationService.getLeaderboard(3) // Get top 3 for the widget
        ]);
        setProfile(profileData);
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Failed to load gamification data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGamificationData();
  }, []);

  if (loading) return null; // Or a subtle skeleton loader

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-20">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-stretch relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -z-10" />

        {/* Left: User Stats */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Civic Score</h2>
              <p className="text-sm text-white/60">Level up by reporting issues</p>
            </div>
          </div>
          
          <div className="flex items-end gap-4 mb-6">
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {profile?.points || 0}
            </div>
            <div className="text-lg font-bold text-white/40 pb-1">
              Level {profile?.level || 1}
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="space-y-2 mb-6 max-w-sm">
            <div className="flex justify-between text-xs text-white/60 font-semibold">
              <span>Progress to Level {(profile?.level || 1) + 1}</span>
              <span>{Math.round(profile?.level_progress_percentage || 0)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profile?.level_progress_percentage || 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            <button 
              onClick={() => router.push('/citizen/profile')}
              className="flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              View Badges & Full Leaderboard <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const text = `I just reached Level ${profile?.level || 1} with ${profile?.points || 0} Civic Points on Civic Connect! 🌟 I'm reporting issues and making our city better. Join me! #CivicConnect #SmartCity`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-all text-xs font-bold"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Score
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />

        {/* Right: Top 3 Leaderboard */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Top Citizens
          </h3>
          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <div key={entry.user_id} className={`flex items-center justify-between p-3 rounded-xl border ${
                  entry.rank === 1 ? 'bg-amber-500/10 border-amber-500/20' :
                  entry.rank === 2 ? 'bg-slate-300/10 border-slate-300/20' :
                  'bg-orange-500/10 border-orange-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white/60 w-4">#{entry.rank}</span>
                    <span className="text-sm font-semibold text-white">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Lvl {entry.level}</span>
                    <div className="bg-black/20 px-2 py-1 rounded-md flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-400">{entry.points}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-white/40 border border-dashed border-white/10 rounded-xl">
                Leaderboard is empty.
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
