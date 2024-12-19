import React from 'react';
import { Header } from '@/components/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-6 px-4">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
} 