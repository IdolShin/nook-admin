import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/cards',
  '/customers',
  '/push',
  '/analytics',
  '/settings',
  '/coupons',
  '/scanner',
  '/permissions',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = request.cookies.has('nook_auth');

  if (pathname === '/home') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/auth' && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/home',
    '/auth',
    '/dashboard/:path*',
    '/cards/:path*',
    '/customers/:path*',
    '/push/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/coupons/:path*',
    '/scanner/:path*',
    '/permissions/:path*',
    '/permissions',
  ],
};
