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

  /**
   * Fetches the current user's data from the authentication service
   * Updates the user state and loading state based on the result
   */
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

  // Initialize user data on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Authenticates a user with their email and password
   * @param {string} email - The user's email address
   * @param {string} password - The user's password
   * @returns {Promise<LoginResponse>} The login response containing tokens
   */
  const login = async (email: string, password: string) => {
    const response = await auth.login({ email, password });
    await fetchUser();
    return response;
  };

  /**
   * Registers a new user account
   * @param {string} email - The user's email address
   * @param {string} password - The user's password
   * @param {string} nameEn - The user's name in English
   * @param {string} nameAr - The user's name in Arabic
   */
  const register = async (email: string, password: string, nameEn: string, nameAr: string) => {
    await auth.register({ email, password, nameEn, nameAr });
  };

  /**
   * Logs out the current user and clears the user state
   */
  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  /**
   * Verifies a user's email address with a verification code
   * @param {string} email - The email address to verify
   * @param {string} code - The verification code
   */
  const verifyEmail = async (email: string, code: string) => {
    await auth.verifyEmail({ email, code });
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    verifyEmail,
  };
} 