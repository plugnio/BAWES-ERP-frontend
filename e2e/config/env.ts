import dotenv from 'dotenv';
import path from 'path';

export function loadTestEnv() {
    const envPath = path.join(process.cwd(), '.env.test');
    const result = dotenv.config({ path: envPath });

    if (result.error) {
        console.error('Error loading .env.test file:', result.error);
        process.exit(1);
    }

    // Verify required environment variables
    const requiredEnvVars = [
        'NEXT_PUBLIC_APP_URL',
        'NEXT_PUBLIC_ERP_API_URL',
        'TEST_ADMIN_EMAIL',
        'TEST_ADMIN_PASSWORD'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
        console.error('Missing required environment variables:', missingEnvVars);
        process.exit(1);
    }

    return {
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        apiUrl: process.env.NEXT_PUBLIC_ERP_API_URL!,
        testEmail: process.env.TEST_ADMIN_EMAIL!,
        testPassword: process.env.TEST_ADMIN_PASSWORD!
    };
} 