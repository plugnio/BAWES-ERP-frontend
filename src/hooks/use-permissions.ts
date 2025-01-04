import { useCallback, useEffect, useState } from 'react';
import { useServices } from './use-services';
import type { CreateRoleDto } from '@bawes/erp-api-sdk';
import type {
  Role,
  RoleOrderUpdate,
  UpdateRoleDto,
} from '@/services/role.service';
import type { PermissionDashboard } from '@/services/permissions.service';

interface UsePermissionsReturn {
  dashboard: PermissionDashboard | null;
  currentRole: Role | null;
  isLoading: boolean;
  error: string | null;
  loadDashboard: () => Promise<void>;
  loadRole: (roleId: string) => Promise<void>;
  createRole: (data: CreateRoleDto) => Promise<Role>;
  updateRoleOrder: (updates: RoleOrderUpdate[]) => Promise<void>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
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
  const { permissions: permissionsService, roles: roleService } = useServices();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<PermissionDashboard | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

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

  const loadRole = useCallback(async (roleId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const role = await roleService.getRole(roleId);
      setCurrentRole(role);
    } catch (err) {
      console.error('Error loading role:', err);
      setError(err instanceof Error ? err.message : 'Failed to load role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [roleService]);

  const updateRolePermissions = useCallback(async (roleId: string, permissions: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      await roleService.updateRolePermissions(roleId, permissions);
      await loadRole(roleId); // Reload role to get updated permissions
      invalidateCache();
      await loadDashboard(); // Reload dashboard to update all data
    } catch (err) {
      console.error('Error updating role permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role permissions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [roleService, loadRole, loadDashboard]);

  const invalidateCache = useCallback(() => {
    dashboardCache = null;
    lastLoadTime = 0; // Reset last load time when cache is invalidated
  }, []);

  const createRole = useCallback(async (data: CreateRoleDto) => {
    try {
      const result = await roleService.createRole(data);
      invalidateCache();
      await loadDashboard();
      return result;
    } catch (err) {
      console.error('Error creating role:', err);
      throw err;
    }
  }, [roleService, loadDashboard, invalidateCache]);

  const updateRoleOrder = useCallback(async (updates: RoleOrderUpdate[]) => {
    try {
      const result = await roleService.updateRoleOrder(updates);
      invalidateCache();
      await loadDashboard();
      return result;
    } catch (err) {
      console.error('Error updating role order:', err);
      throw err;
    }
  }, [roleService, loadDashboard, invalidateCache]);

  // Load dashboard on mount
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    currentRole,
    isLoading,
    error,
    loadDashboard,
    loadRole,
    createRole,
    updateRoleOrder,
    updateRolePermissions,
    invalidateCache
  };
} 