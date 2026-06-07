"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export const withAuthGuard = (WrappedComponent: any) => {
  return function ProtectedRoute(props: any) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/auth'); // Redirect to login
      }
    }, [loading, isAuthenticated, router]);

    if (loading || !isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
            <p className="text-white/70 animate-pulse">Authenticating...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};
