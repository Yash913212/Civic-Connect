"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authService } from './authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }
        const freshUser = await authService.getCurrentUser();
        setUser(freshUser);
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const wsBase = (process.env.NEXT_PUBLIC_WS_URL || "wss://civic-connect-gzm1.onrender.com").replace(/\/+$/, '');
      const wsUrl = `${wsBase}/ws/notifications/${user.id}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log("WebSocket Connected");
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATUS_UPDATE') {
            toast.success(`Complaint Updated`, {
              description: `"${data.title}" status changed to ${data.status}`
            });
          } else if (data.type === 'COMPLAINT_ASSIGNED') {
            toast.info(`New Assignment`, {
              description: `You were assigned to "${data.title}"`
            });
          } else if (data.type === 'NEW_COMPLAINT') {
            toast.info(`New Complaint`, {
              description: `A new complaint "${data.title}" was created.`
            });
          }
        } catch (e) {
          console.error("WS Message Error", e);
        }
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    }
  }, [user, loading]);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    authService.setTokens(accessToken, refreshToken, userData);
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
