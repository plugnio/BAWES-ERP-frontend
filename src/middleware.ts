import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenExpired(token: string): boolean {
    try {
        const [, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        // Add 10-second buffer to prevent edge cases
        return (decodedPayload.exp * 1000) - 10000 <= Date.now();
    } catch (error) {
        return true; // If we can't decode the token, consider it expired
    }
}

export function middleware(request: NextRequest) {
    // Get tokens from cookies
    const accessToken = request.cookies.get('accessToken');
    const refreshToken = request.cookies.get('refreshToken');
    
    // Check if the request is for protected or auth pages
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                            request.nextUrl.pathname === '/';

    // Handle protected routes
    if (isProtectedRoute) {
        // If no access token, redirect to login
        if (!accessToken) {
            return redirectToLogin(request);
        }

        // If token is expired but we have refresh token, let the client handle refresh
        if (isTokenExpired(accessToken.value)) {
            if (refreshToken) {
                return NextResponse.next();
            }
            // If no refresh token, redirect to login
            return redirectToLogin(request);
        }
    }

    // Handle auth pages (login, register, etc.)
    if (isAuthPage) {
        // If user has valid token, redirect to dashboard
        if (accessToken && !isTokenExpired(accessToken.value)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    
    const response = NextResponse.redirect(loginUrl);
    
    // Clear cookies on redirect
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    
    return response;
}

export const config = {
    matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
}; 