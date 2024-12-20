'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePermissions as usePermissionsService } from './use-services';

/**
 * Represents a single permission in the system
 */
interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  bitfield: string;
}

/**
 * Represents a category of permissions
 */
interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

/**
 * Represents a role with assigned permissions
 */
interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

/**
 * Represents the complete permissions dashboard state
 */
interface PermissionDashboard {
  roles: Role[];
  permissionCategories: PermissionCategory[];
}

/**
 * Return type for the usePermissions hook
 */
interface UsePermissionsReturn {
  /** Complete permissions dashboard data */
  dashboard: PermissionDashboard | null;
  /** Currently selected role */
  currentRole: Role | null;
  /** Whether any operation is in progress */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Checks if a permission is granted */
  hasPermission: (permissionCode: string, permissionBits: string) => boolean;
  /** Loads the complete permissions dashboard */
  loadDashboard: () => Promise<void>;
  /** Loads a specific role by ID */
  loadRole: (roleId: string) => Promise<void>;
  /** Updates the permissions assigned to a role */
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
}

/**
 * Hook for managing permissions and roles in the system
 * 
 * Provides functionality to manage roles, their permissions, and check permission grants.
 * Includes loading and error states for all operations.
 * 
 * @example
 * ```tsx
 * const { dashboard, hasPermission } = usePermissions();
 * 
 * if (hasPermission('USERS_MANAGE', userPermissions)) {
 *   return <UserManagement />;
 * }
 * ```
 * 
 * @returns {UsePermissionsReturn} Permissions management state and methods
 */
export function usePermissions(): UsePermissionsReturn {
  const permissions = usePermissionsService();
  const [dashboard, setDashboard] = useState<PermissionDashboard | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles error states uniformly across all operations
   * @param {unknown} err - The error to handle
   */
  const handleError = (err: unknown) => {
    if (err && typeof err === 'object' && 'message' in err) {
      setError(err.message as string);
    } else {
      setError('An unexpected error occurred');
    }
    setIsLoading(false);
  };

  /**
   * Loads the complete permissions dashboard
   * Updates the dashboard state with roles and permission categories
   * @throws {Error} If the service call fails
   */
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

  /**
   * Loads a specific role by its ID
   * Updates the currentRole state with the result
   * @param {string} roleId - The ID of the role to load
   * @throws {Error} If the service call fails
   */
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

  /**
   * Updates the permissions assigned to a role
   * Updates the currentRole state with the result
   * @param {string} roleId - The ID of the role to update
   * @param {string[]} permissionCodes - The new list of permission codes for the role
   * @throws {Error} If the service call fails
   */
  const updateRolePermissions = async (roleId: string, permissionCodes: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await permissions.updateRole(roleId, permissionCodes);
      setCurrentRole(result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks if a specific permission is granted in a permission bitfield
   * @param {string} permissionCode - The code of the permission to check
   * @param {string} permissionBits - The permission bitfield to check against
   * @returns {boolean} True if the permission is granted, false otherwise
   */
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