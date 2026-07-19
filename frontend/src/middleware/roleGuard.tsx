"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { User } from '../auth/authService';

export const withRoleGuard = (WrappedComponent: any, allowedRoles: User['role'][]) => {
  return function RoleProtectedRoute(props: any) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (typeof window === 'undefined') return;
      if (!loading) {
        if (!isAuthenticated) {
          window.location.href = '/';
        } else if (user && !allowedRoles.includes(user.role)) {
          // If logged in but wrong role, redirect to their respective dashboard
          if (user.role === 'CITIZEN') window.location.href = '/citizen/dashboard';
          else if (user.role === 'OFFICER') window.location.href = '/officer/dashboard';
          else if (user.role === 'ADMIN') window.location.href = '/admin/dashboard';
          else window.location.href = '/';
        }
      }
    }, [loading, isAuthenticated, user]);

    if (typeof window === 'undefined' || loading || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
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
