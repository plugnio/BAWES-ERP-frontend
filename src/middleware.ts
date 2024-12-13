import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that should be accessible without authentication
const publicPaths = ['/login', '/register', '/api/auth'];

export function middleware(request: NextRequest) {
    const isPublicPath = publicPaths.some(path => 
        request.nextUrl.pathname.startsWith(path)
    );

    const token = request.cookies.get('auth-token');

    // Allow access to public paths
    if (isPublicPath) {
        return NextResponse.next();
    }

    // Redirect to login if no token is present
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
}; 