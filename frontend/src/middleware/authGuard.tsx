"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export const withAuthGuard = (WrappedComponent: any) => {
  return function ProtectedRoute(props: any) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (typeof window === 'undefined') return;
      if (!loading && !isAuthenticated) {
        window.location.href = '/'; // Redirect to login
      }
    }, [loading, isAuthenticated]);

    if (typeof window === 'undefined' || loading || !isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
            <p className="text-white/70 animate-pulse">Loading...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};
