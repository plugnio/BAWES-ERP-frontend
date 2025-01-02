'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useServices } from '@/hooks/use-services';
import { PermissionList } from './permission-list';
import type { Role } from '@/services/role.service';
import type { Permission, PermissionCategory, PermissionDashboard } from '@/services/permissions.service';
import { cn } from '@/lib/utils';

interface PermissionDashboardProps {
  role: Role;
  onPermissionsChange?: (permissions: string[]) => Promise<void>;
  className?: string;
}

export function PermissionDashboard({ role, onPermissionsChange, className }: PermissionDashboardProps) {
  const { permissions: permissionsService, roles: rolesService } = useServices();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<PermissionDashboard | null>(null);

  const loadRole = React.useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const dashboardData = await permissionsService.getDashboard();
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Failed to load role:', error);
      setError('Failed to load role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [permissionsService]);

  React.useEffect(() => {
    if (role) {
      loadRole(role.id);
    }
  }, [role, loadRole]);

  const handlePermissionToggle = React.useCallback(async (permissionId: string) => {
    if (!role) return;

    const newPermissions = new Set(role.permissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }

    try {
      setUpdateError(null);
      await rolesService.updateRolePermissions(role.id, Array.from(newPermissions));
      await loadRole(role.id);
      onPermissionsChange?.(Array.from(newPermissions));
    } catch (error) {
      console.error('Failed to update permissions:', error);
      setUpdateError('Failed to update permissions. Please try again.');
    }
  }, [role, rolesService, loadRole, onPermissionsChange]);

  const handleBulkSelect = React.useCallback((categoryName: string, selected: boolean) => {
    if (!role || !dashboard) return;

    const category = dashboard.categories.find((c: PermissionCategory) => c.name === categoryName);
    if (!category) return;

    const categoryPermissions = category.permissions.map((p: Permission) => p.id);
    const newPermissions = new Set(role.permissions);
    
    categoryPermissions.forEach((permissionId: string) => {
      if (selected) {
        newPermissions.add(permissionId);
      } else {
        newPermissions.delete(permissionId);
      }
    });

    try {
      setUpdateError(null);
      rolesService.updateRolePermissions(role.id, Array.from(newPermissions));
      loadRole(role.id);
      onPermissionsChange?.(Array.from(newPermissions));
    } catch (error) {
      console.error('Failed to update permissions:', error);
      setUpdateError('Failed to update permissions. Please try again.');
    }
  }, [role, dashboard, rolesService, loadRole, onPermissionsChange]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)} data-testid="permission-dashboard">
      {updateError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}
      <PermissionList
        categories={dashboard.categories}
        selectedPermissions={new Set(role?.permissions || [])}
        onPermissionToggle={handlePermissionToggle}
        onBulkSelect={handleBulkSelect}
      />
    </div>
  );
} 