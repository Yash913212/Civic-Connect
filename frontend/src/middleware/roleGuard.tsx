"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { User } from '../auth/authService';
import { dashRoutes } from '@/config/roles';

export const withRoleGuard = (WrappedComponent: any, allowedRoles: User['role'][]) => {
  return function RoleProtectedRoute(props: any) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (!loading && mounted) {
        if (!isAuthenticated) {
          router.push('/');
        } else if (user && !allowedRoles.includes(user.role)) {
          window.location.href = dashRoutes[user.role] || '/';
        }
      }
    }, [loading, isAuthenticated, user, router, mounted]);

    // During SSR or initial hydration, return the stable wrapper but keep children hidden/skeletonized
    // if we don't know the auth state yet, to prevent hydration insertBefore crashes.
    if (!mounted || loading || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
            <p className="text-white/70 animate-pulse">Loading Dashboard...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};
