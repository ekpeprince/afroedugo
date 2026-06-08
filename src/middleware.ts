import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.get('session-auth')?.value === 'true';

  const protectedPaths = ['/profile', '/chat', '/admin', '/add-listing'];
  const authPaths = ['/auth'];

  // 1. Guard protected paths
  if (protectedPaths.some(p => path.startsWith(p)) && !hasSession) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // 2. Redirect logged-in users away from auth path
  if (authPaths.some(p => path.startsWith(p)) && hasSession) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/chat/:path*',
    '/admin/:path*',
    '/add-listing/:path*',
    '/auth'
  ],
};
