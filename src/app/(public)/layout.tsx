import React from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 flex items-center px-4 border-b">
        <div className="flex-1" />
        <ModeToggle />
      </header>
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 