import { useCallback, useEffect, useState } from 'react';
import { useServices } from './use-services';
import type { CreateRoleDto } from '@bawes/erp-api-sdk';
import type {
  PermissionDashboard,
  Role,
  RoleOrderUpdate,
  UpdateRoleDto,
} from '@/services/role.service';

interface UsePermissionsReturn {
  dashboard: PermissionDashboard | null;
  isLoading: boolean;
  error: string | null;
  loadDashboard: () => Promise<void>;
  createRole: (data: CreateRoleDto) => Promise<Role>;
  updateRoleOrder: (updates: RoleOrderUpdate[]) => Promise<void>;
  invalidateCache: () => void;
}

interface UsePermissionCheckReturn {
  hasPermission: (permissionId: string, permissionBits: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// Add these constants at the top of the file
const DASHBOARD_CACHE_KEY = 'permissions_dashboard_cache';
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Add this type
type CacheEntry = {
  data: PermissionDashboard;
  timestamp: number;
};

// Add these variables to store the memory cache
let dashboardCache: { data: PermissionDashboard; timestamp: number } | null = null;
let loadingPromise: Promise<void> | null = null;
let permissionCheckCache: { [key: string]: { result: boolean; timestamp: number } } = {};

// Add this variable to track the last load time
let lastLoadTime = 0;
const LOAD_DEBOUNCE = 100; // 100ms debounce

export function usePermissionCheck(): UsePermissionCheckReturn {
  const { permissions: permissionsService } = useServices();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = useCallback(async (permissionId: string, permissionBits: string) => {
    const cacheKey = `${permissionId}_${permissionBits}`;
    const now = Date.now();

    // Check cache first
    if (permissionCheckCache[cacheKey] && now - permissionCheckCache[cacheKey].timestamp < CACHE_TIMEOUT) {
      return permissionCheckCache[cacheKey].result;
    }

    try {
      setIsLoading(true);
      const result = await permissionsService.hasPermission(permissionId, permissionBits);
      
      // Cache the result
      permissionCheckCache[cacheKey] = {
        result,
        timestamp: now
      };

      return result;
    } catch (err) {
      console.error('Error checking permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to check permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService]);

  return {
    hasPermission,
    isLoading,
    error
  };
}

export function usePermissions(): UsePermissionsReturn {
  const { permissions: permissionsService } = useServices();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<PermissionDashboard | null>(null);

  const loadDashboard = useCallback(async () => {
    const now = Date.now();
    
    // If we've loaded recently, don't load again
    if (now - lastLoadTime < LOAD_DEBOUNCE) {
      return;
    }

    // If we're already loading, wait for the existing promise
    if (loadingPromise) {
      try {
        await loadingPromise;
        return;
      } catch (err) {
        // If the loading promise fails, we'll try again
        loadingPromise = null;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create a new loading promise
      loadingPromise = (async () => {
        try {
          const data = await permissionsService.getDashboard();
          setDashboard(data);
          lastLoadTime = Date.now(); // Update last load time
        } finally {
          loadingPromise = null;
        }
      })();

      await loadingPromise;
    } catch (err) {
      console.error('Error loading permissions dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService]);

  const invalidateCache = useCallback(() => {
    dashboardCache = null;
    lastLoadTime = 0; // Reset last load time when cache is invalidated
  }, []);

  const createRole = useCallback(async (data: CreateRoleDto) => {
    try {
      const result = await permissionsService.createRole(data);
      invalidateCache();
      await loadDashboard();
      return result;
    } catch (err) {
      console.error('Error creating role:', err);
      throw err;
    }
  }, [permissionsService, loadDashboard, invalidateCache]);

  const updateRoleOrder = useCallback(async (updates: RoleOrderUpdate[]) => {
    try {
      const result = await permissionsService.updateRoleOrder(updates);
      invalidateCache();
      await loadDashboard();
      return result;
    } catch (err) {
      console.error('Error updating role order:', err);
      throw err;
    }
  }, [permissionsService, loadDashboard, invalidateCache]);

  // Load dashboard on mount
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    isLoading,
    error,
    loadDashboard,
    createRole,
    updateRoleOrder,
    invalidateCache
  };
} 