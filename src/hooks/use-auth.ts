'use client';

import { useState, useEffect } from 'react';
import { AuthenticationApi, Configuration } from '@bawes/erp-api-sdk';
import { setAccessToken, clearAccessToken, createApiConfig } from '@/lib/api';
import { authService } from '@/services/authService';

interface User {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const api = new AuthenticationApi(createApiConfig());
      const response = await api.authControllerGetProfile();
      setUser(response.data as User);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const config = new Configuration({
      basePath: process.env.NEXT_PUBLIC_API_URL,
    });
    const api = new AuthenticationApi(config);
    const response = await api.authControllerLogin({
      email,
      password,
    });
    const { access_token } = response.data as { access_token: string };
    setAccessToken(access_token);
    await checkAuth();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };
} 