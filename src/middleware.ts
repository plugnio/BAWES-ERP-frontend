import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload.exp * 1000 < Date.now();
  } catch (error) {
    return true; // If we can't decode the token, consider it expired
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken');
  const refreshToken = request.cookies.get('refreshToken');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isRootPage = request.nextUrl.pathname === '/';

  // For protected routes (dashboard or root)
  if (isDashboardPage || isRootPage) {
    // No token or expired token
    if (!token || isTokenExpired(token.value)) {
      // If we have a refresh token, let the client handle refresh
      if (!refreshToken) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', request.nextUrl.pathname);
        
        // Clear any existing tokens
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        
        return response;
      }
    }
  }

  // For auth pages
  if (isAuthPage && token) {
    // Only redirect to dashboard if token is valid
    if (!isTokenExpired(token.value)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
}; 