'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureValidToken } from '@/lib/sdk-config';
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DebugPanel } from "@/components/dashboard/debug-panel";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const checkToken = async () => {
            try {
                await ensureValidToken();
            } catch (error) {
                router.push('/auth/login');
            }
        };

        checkToken();
    }, [router]);

    return (
        <>
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <div className="border-b">
                        <div className="flex h-16 items-center px-4">
                            <MainNav className="mx-6" />
                            <div className="ml-auto flex items-center space-x-4">
                                <UserNav />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4 p-8 pt-6">
                        {children}
                    </div>
                </div>
            </div>
            <DebugPanel />
        </>
    );
} 