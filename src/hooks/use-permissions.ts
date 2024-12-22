import { useCallback, useEffect, useState } from 'react';
import { useServices } from './use-services';
import type {
  Role,
  Permission,
  PermissionCategory,
  PermissionDashboard,
  RoleOrderUpdate,
  CreateRoleDto,
  UpdateRoleDto,
} from '@/services/permissions.service';

interface UsePermissionsReturn {
  dashboard: PermissionDashboard | null;
  currentRole: Role | null;
  isLoading: boolean;
  error: string | null;
  loadDashboard: () => Promise<void>;
  loadRole: (roleId: string) => Promise<void>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  updateRoleOrder: (updates: RoleOrderUpdate[]) => Promise<void>;
  hasPermission: (permissionId: string, permissionBits: string) => boolean;
  createRole: (dto: CreateRoleDto) => Promise<Role>;
  updateRole: (roleId: string, dto: UpdateRoleDto) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { permissions: permissionsService } = useServices();
  const [dashboard, setDashboard] = useState<PermissionDashboard | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await permissionsService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService]);

  const loadRole = useCallback(async (roleId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const role = await permissionsService.getRole(roleId);
      setCurrentRole(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role');
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService]);

  const updateRolePermissions = useCallback(async (roleId: string, permissions: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      await permissionsService.updateRolePermissions(roleId, permissions);
      await loadRole(roleId);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role permissions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService, loadRole, loadDashboard]);

  const updateRoleOrder = useCallback(async (updates: RoleOrderUpdate[]) => {
    try {
      setIsLoading(true);
      setError(null);
      await permissionsService.updateRoleOrder(updates);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService, loadDashboard]);

  const hasPermission = useCallback((permissionId: string, permissionBits: string) => {
    return permissionsService.hasPermission(permissionId, permissionBits);
  }, [permissionsService]);

  const createRole = useCallback(async (dto: CreateRoleDto) => {
    try {
      setIsLoading(true);
      setError(null);
      const role = await permissionsService.createRole(dto);
      setCurrentRole(role);
      await loadDashboard();
      return role;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService, loadDashboard]);

  const updateRole = useCallback(async (roleId: string, dto: UpdateRoleDto) => {
    try {
      setIsLoading(true);
      setError(null);
      const role = await permissionsService.updateRole(roleId, dto);
      setCurrentRole(role);
      await loadDashboard();
      return role;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService, loadDashboard]);

  const deleteRole = useCallback(async (roleId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await permissionsService.deleteRole(roleId);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService, loadDashboard]);

  return {
    dashboard,
    currentRole,
    isLoading,
    error,
    loadDashboard,
    loadRole,
    updateRolePermissions,
    updateRoleOrder,
    hasPermission,
    createRole,
    updateRole,
    deleteRole,
  };
} 