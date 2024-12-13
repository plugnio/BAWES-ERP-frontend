import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Skip middleware for public files
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/public') ||
        request.nextUrl.pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get("accessToken")?.value;
    const isAuthPage = 
        request.nextUrl.pathname === "/login" || 
        request.nextUrl.pathname === "/register" ||
        request.nextUrl.pathname === "/verify-email";

    if (isAuthPage && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!isAuthPage && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Protected API routes
        '/api/:path*',
        // Auth pages
        '/login',
        '/register',
        '/verify-email',
        // Protected pages
        '/dashboard/:path*',
        '/profile/:path*',
        // Protect all routes except public files
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
}; 