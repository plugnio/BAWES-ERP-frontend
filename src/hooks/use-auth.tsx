'use client';

import { useCallback, useEffect, useState } from 'react';
import { useServices } from './use-services';
import type { LoginResponse } from '@/services/auth.service';

/**
 * Represents a user in the system
 */
interface User {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
}

/**
 * Return type for the useAuth hook
 */
interface UseAuthReturn {
  /** The currently authenticated user or null if not authenticated */
  user: User | null;
  /** Whether authentication state is being loaded */
  isLoading: boolean;
  /** Authenticates a user with email and password */
  login: (email: string, password: string) => Promise<LoginResponse>;
  /** Registers a new user account */
  register: (email: string, password: string, nameEn: string, nameAr: string) => Promise<void>;
  /** Logs out the current user */
  logout: () => Promise<void>;
  /** Verifies a user's email address */
  verifyEmail: (email: string, code: string) => Promise<void>;
}

/**
 * Hook for managing authentication state and operations
 * 
 * @example
 * ```tsx
 * const { user, login, logout } = useAuth();
 * 
 * if (user) {
 *   return <div>Welcome, {user.nameEn}</div>;
 * }
 * ```
 * 
 * @returns {UseAuthReturn} Authentication state and methods
 */
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