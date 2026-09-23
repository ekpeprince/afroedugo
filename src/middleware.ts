import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Verify presence of secure session cookie (__session or legacy session-auth)
  const sessionToken = request.cookies.get('__session')?.value;
  const legacyAuth = request.cookies.get('session-auth')?.value === 'true';
  const hasSession = !!sessionToken || legacyAuth;

  // Redirect /chat to community (messaging section paused for future upgrade)
  if (path.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/community', request.url));
  }

  const protectedPaths = ['/profile', '/admin', '/add-listing'];
  const authPaths = ['/auth'];

  // 1. Guard protected paths
  if (protectedPaths.some(p => path.startsWith(p)) && !hasSession) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Extra layer of protection for admin route
  if (path.startsWith('/admin') && !hasSession) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // 3. Redirect logged-in users away from auth path
  if (authPaths.some(p => path.startsWith(p)) && hasSession) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  const response = NextResponse.next();

  // Apply defensive security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  return response;
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
