'use client';

import React from 'react';
import Link from 'next/link';
import { MainNav } from './main-nav';
import { UserNav } from './user-nav';
import { ModeToggle } from '@/components/ui/mode-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <span className="hidden font-bold sm:inline-block">BAWES ERP</span>
        </Link>
        <MainNav className="mx-6" />
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
} 