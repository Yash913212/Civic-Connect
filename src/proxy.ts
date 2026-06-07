import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  if (!token && !isAuthPage && request.nextUrl.pathname !== '/' && !request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.includes('.')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (isAuthPage && token && role) {
    const dashRoutes: Record<string, string> = {
      CITIZEN: '/citizen/dashboard',
      OFFICER: '/officer/dashboard',
      ADMIN: '/admin/dashboard',
    };
    const target = dashRoutes[role] || '/citizen/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (token && role) {
    const pathname = request.nextUrl.pathname;
    const isCitizenRoute = pathname.startsWith('/citizen');
    const isOfficerRoute = pathname.startsWith('/officer');
    const isAdminRoute = pathname.startsWith('/admin');

    if (isCitizenRoute && role !== 'CITIZEN') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    if (isOfficerRoute && role !== 'OFFICER') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    if (isAdminRoute && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
