'use client';

import { useCallback, useEffect, useState } from 'react';
import { useServices } from './use-services';
import type { LoginResponse } from '@/services/auth.service';

interface User {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (email: string, password: string, nameEn: string, nameAr: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { auth } = useServices();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await auth.login({ email, password });
    await fetchUser();
    return response;
  };

  const register = async (email: string, password: string, nameEn: string, nameAr: string) => {
    await auth.register({ email, password, nameEn, nameAr });
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  const verifyEmail = async (email: string, code: string) => {
    await auth.verifyEmail({ email, code });
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    verifyEmail
  };
} 