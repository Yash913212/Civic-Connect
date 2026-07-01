"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
        const localUser = authService.getLocalUser();
        const token = localStorage.getItem('access_token');
        
        if (localUser && token) {
          setUser(localUser);
          // Optionally fetch fresh user data here
        }
      } catch (error) {
        console.error('Failed to initialize auth', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user && !loading) {
      const wsUrl = `ws://localhost:8000/ws/notifications/${user.id}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

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
