import { useState, useCallback, useEffect } from 'react';
import { usePermissions as usePermissionsService } from './use-services';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  bitfield: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface PermissionDashboard {
  categories: PermissionCategory[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

interface UsePermissionsReturn {
  dashboard: PermissionDashboard | null;
  currentRole: Role | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permissionCode: string, permissionBits: string) => boolean;
  loadDashboard: () => Promise<void>;
  loadRole: (roleId: string) => Promise<void>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const permissions = usePermissionsService();
  const [dashboard, setDashboard] = useState<PermissionDashboard | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    if (err && typeof err === 'object' && 'message' in err) {
      setError(err.message as string);
    } else {
      setError('An unexpected error occurred');
    }
    setIsLoading(false);
  };

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await permissions.getDashboard();
      setDashboard(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadRole = async (roleId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await permissions.getRole(roleId);
      setCurrentRole(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRolePermissions = async (roleId: string, permissionCodes: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await permissions.updateRolePermissions(roleId, permissionCodes);
      setCurrentRole(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback(
    (permissionCode: string, permissionBits: string) => {
      return permissions.hasPermission(permissionCode, permissionBits);
    },
    [permissions]
  );

  return {
    dashboard,
    currentRole,
    isLoading,
    error,
    hasPermission,
    loadDashboard,
    loadRole,
    updateRolePermissions
  };
} 