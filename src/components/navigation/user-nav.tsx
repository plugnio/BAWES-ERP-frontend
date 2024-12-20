'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
}

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuth() as { user: User | null; logout: () => Promise<void> };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (!user) {
    return null;
  }

  const initials = user.nameEn
    ? user.nameEn
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.nameEn || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.nameAr || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 