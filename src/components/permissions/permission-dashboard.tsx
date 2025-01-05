'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useServices } from '@/hooks/use-services';
import { PermissionList } from './permission-list';
import type { Role } from '@/services/role.service';
import type { Permission, PermissionCategory, PermissionDashboard } from '@/services/permissions.service';
import { cn } from '@/lib/utils';

interface PermissionDashboardProps {
  /** The role to display and edit permissions for */
  role: Role;
  /** Callback fired when permissions are changed */
  onPermissionsChange?: (permissions: string[]) => Promise<void>;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Component for displaying and managing role permissions
 * 
 * @component
 * @param {PermissionDashboardProps} props - Component props
 * @returns {JSX.Element} Permission dashboard component
 */
export function PermissionDashboard({ role, onPermissionsChange, className }: PermissionDashboardProps) {
  const { permissions: permissionsService, roles: rolesService } = useServices();
  const [error, setError] = React.useState<string | null>(null);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<PermissionDashboard | null>(null);
  const [currentRole, setCurrentRole] = React.useState<Role>(role);

  /**
   * Loads the permissions dashboard data
   * @returns {Promise<void>}
   */
  const loadDashboard = React.useCallback(async () => {
    try {
      const dashboardData = await permissionsService.getDashboard();
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError('Failed to load dashboard. Please try again.');
      throw error;
    }
  }, [permissionsService]);

  /**
   * Loads a specific role's data
   * @param {string} id - Role ID to load
   * @returns {Promise<void>}
   */
  const loadRole = React.useCallback(async (id: string) => {
    try {
      const roleData = await rolesService.getRole(id);
      setCurrentRole(roleData);
    } catch (error) {
      console.error('Failed to load role:', error);
      setError('Failed to load role. Please try again.');
      throw error;
    }
  }, [rolesService]);

  /**
   * Refreshes both dashboard and role data
   * @returns {Promise<void>}
   */
  const refresh = React.useCallback(async () => {
    if (!role?.id) return;
    
    try {
      setError(null);
      
      // Clear dashboard cache to ensure fresh data
      permissionsService.clearDashboardCache();
      
      // Load role first to ensure we have the latest permissions
      await loadRole(role.id);
      await loadDashboard();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError('Failed to refresh data. Please try again.');
    }
  }, [loadDashboard, loadRole, role?.id, permissionsService]);

  // Initial load
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Update current role when prop changes
  React.useEffect(() => {
    if (role?.id !== currentRole?.id) {
      setCurrentRole(role);
      refresh();
    }
  }, [role, currentRole?.id, refresh]);

  /**
   * Handles toggling a single permission
   * @param {string} permissionCode - Code of permission to toggle
   * @returns {Promise<void>}
   */
  const handlePermissionToggle = React.useCallback(async (permissionCode: string) => {
    if (!currentRole?.id) return;

    // Optimistically update UI
    const newPermissions = new Set(currentRole.permissions);
    const isEnabled = !newPermissions.has(permissionCode);
    
    if (isEnabled) {
      newPermissions.add(permissionCode);
    } else {
      newPermissions.delete(permissionCode);
    }

    const permissionsArray = Array.from(newPermissions);
    
    // Update local state immediately
    setCurrentRole(prev => ({
      ...prev!,
      permissions: permissionsArray
    }));

    try {
      // Update in background
      await rolesService.updateRolePermissions(currentRole.id, permissionsArray);
      await onPermissionsChange?.(permissionsArray);
      
      // Silently refresh data
      permissionsService.clearDashboardCache();
      loadDashboard().catch(console.error);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      
      // Revert optimistic update on error
      setCurrentRole(prev => ({
        ...prev!,
        permissions: currentRole.permissions
      }));
      
      setUpdateError('Failed to update permissions. Please try again.');
    }
  }, [currentRole, rolesService, onPermissionsChange, permissionsService, loadDashboard]);

  /**
   * Handles bulk selection of permissions for a category
   * @param {string} categoryName - Name of category to update
   * @param {boolean} selected - Whether to select or deselect all permissions
   * @returns {Promise<void>}
   */
  const handleBulkSelect = React.useCallback(async (categoryName: string, selected: boolean) => {
    if (!currentRole?.id || !dashboard) return;

    const category = dashboard.categories.find((c: PermissionCategory) => c.name === categoryName);
    if (!category) return;

    const categoryPermissions = category.permissions.map((p: Permission) => p.code);
    const newPermissions = new Set(currentRole.permissions);
    
    categoryPermissions.forEach((permissionCode: string) => {
      if (selected) {
        newPermissions.add(permissionCode);
      } else {
        newPermissions.delete(permissionCode);
      }
    });

    const permissionsArray = Array.from(newPermissions);

    // Update local state immediately
    setCurrentRole(prev => ({
      ...prev!,
      permissions: permissionsArray
    }));

    try {
      // Update in background
      await rolesService.updateRolePermissions(currentRole.id, permissionsArray);
      await onPermissionsChange?.(permissionsArray);
      
      // Silently refresh data
      permissionsService.clearDashboardCache();
      loadDashboard().catch(console.error);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      
      // Revert optimistic update on error
      setCurrentRole(prev => ({
        ...prev!,
        permissions: currentRole.permissions
      }));
      
      setUpdateError('Failed to update permissions. Please try again.');
    }
  }, [currentRole, dashboard, rolesService, onPermissionsChange, permissionsService, loadDashboard]);

  if (!dashboard) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="permission-dashboard">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {updateError && (
        <Alert variant="destructive">
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}
      {dashboard && (
        <PermissionList
          categories={dashboard.categories}
          selectedPermissions={new Set(currentRole.permissions)}
          onPermissionToggle={handlePermissionToggle}
          onBulkSelect={handleBulkSelect}
          disabled={currentRole.isSystem}
        />
      )}
    </div>
  );
} 