import { apiClient } from '@/auth/apiClient';

export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earned?: boolean;
}

export interface GamificationProfile {
  points: number;
  level: number;
  badges: BadgeInfo[];
  points_to_next_level: number;
  level_progress_percentage: number;
  streak_days: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  points: number;
  level: number;
  badges_count: number;
}


export const gamificationService = {
  getProfile: async (): Promise<GamificationProfile> => {
    const response = await apiClient.get('/gamification/profile');
    return response.data;
  },

  getLeaderboard: async (limit: number = 10): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get(`/gamification/leaderboard?limit=${limit}`);
    return response.data;
  },

  getBadges: async (): Promise<BadgeInfo[]> => {
    const response = await apiClient.get('/gamification/badges');
    return response.data;
  }
};
