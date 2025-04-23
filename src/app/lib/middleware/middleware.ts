// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware will be used to handle server-side redirects
// Note: This is a simple version that checks for cookies
// For a proper implementation, you would validate Firebase auth tokens

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const { pathname } = request.nextUrl;

  // Handle admin paths server-side
  if (pathname.startsWith('/admin')) {
    // In real implementation, you would check if the user is an admin
    // For demo, we're just checking if the auth cookie exists
    if (!authCookie) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && authCookie) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Redirect unauthenticated users to login
  if ((pathname === '/home' || pathname === '/contact') && !authCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/admin/:path*',
    '/home',
    '/contact',
    '/login'
  ],
};