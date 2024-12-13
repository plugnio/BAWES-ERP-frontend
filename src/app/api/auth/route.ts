import { NextResponse } from 'next/server';
import { Configuration, AuthenticationApi } from '@bawes/erp-api-sdk';

const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL,
    apiKey: process.env.NEXT_PUBLIC_ERP_API_KEY
});

const authApi = new AuthenticationApi(config);

// Named exports for HTTP methods
export const POST = async (request: Request) => {
    try {
        const { email, password } = await request.json();
        
        console.log('Login attempt:', { email, basePath: config.basePath });

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        try {
            const response = await authApi.authControllerLogin({
                email,
                password
            });
            console.log('Login response:', response.data);

            // Set HTTP-only cookie with the token
            const headers = new Headers();
            headers.append('Set-Cookie', `auth-token=${response.data}; HttpOnly; Path=/; SameSite=Strict`);

            return NextResponse.json(
                { message: 'Login successful' },
                { 
                    status: 200,
                    headers
                }
            );
        } catch (apiError: any) {
            // Log detailed API error
            console.error('API Error Details:', {
                status: apiError?.response?.status,
                statusText: apiError?.response?.statusText,
                data: apiError?.response?.data,
                headers: apiError?.response?.headers
            });
            throw apiError;
        }
    } catch (error: any) {
        console.error('Login error:', {
            message: error.message,
            status: error?.response?.status,
            data: error?.response?.data
        });
        
        // Return more specific error message from API if available
        const errorMessage = error?.response?.data?.message || 'Authentication failed';
        return NextResponse.json(
            { error: errorMessage },
            { status: error?.response?.status || 401 }
        );
    }
}

export const DELETE = async (request: Request) => {
    try {
        const cookie = request.headers.get('cookie');
        const token = cookie?.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1];

        if (!token) {
            return NextResponse.json(
                { error: 'No token found' },
                { status: 401 }
            );
        }

        await authApi.authControllerLogout({ refresh_token: token });

        // Clear the auth cookie
        const headers = new Headers();
        headers.append('Set-Cookie', 'auth-token=; HttpOnly; Path=/; Max-Age=0');

        return NextResponse.json(
            { message: 'Logout successful' },
            { 
                status: 200,
                headers
            }
        );
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
} 