import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  // The login page is located at the root '/'
  const isAuthPage = request.nextUrl.pathname === '/';

  if (!token && !isAuthPage && !request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.includes('.')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && role) {
    const pathname = request.nextUrl.pathname;
    const isCitizenRoute = pathname.startsWith('/citizen');
    const isOfficerRoute = pathname.startsWith('/officer');
    const isAdminRoute = pathname.startsWith('/admin');

    if (isCitizenRoute && role !== 'CITIZEN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isOfficerRoute && role !== 'OFFICER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isAdminRoute && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
