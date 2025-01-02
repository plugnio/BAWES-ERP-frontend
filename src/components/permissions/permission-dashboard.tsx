'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useServices } from '@/hooks/use-services';
import { usePermissions } from '@/hooks/use-permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/shared';
import { PermissionList } from './permission-list';
import type { Role } from '@/services/role.service';
import type { Permission, PermissionCategory } from '@/services/permissions.service';

interface PermissionDashboardProps {
  roleId: string;
  onPermissionsChange?: (permissions: string[]) => Promise<void>;
}

export function PermissionDashboard({ roleId, onPermissionsChange }: PermissionDashboardProps) {
  const { roles: roleService } = useServices();
  const { dashboard } = usePermissions();
  const [role, setRole] = React.useState<Role | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadRole = React.useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const roleData = await roleService.getRole(id);
      setRole(roleData);
    } catch (err) {
      console.error('Failed to load role:', err);
      setError('Failed to load role details');
    } finally {
      setIsLoading(false);
    }
  }, [roleService]);

  React.useEffect(() => {
    if (roleId) {
      loadRole(roleId);
    }
  }, [roleId, loadRole]);

  const handlePermissionToggle = React.useCallback((permissionId: string) => {
    if (!role || !onPermissionsChange) return;
    
    const newPermissions = new Set(role.permissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    onPermissionsChange(Array.from(newPermissions));
  }, [role, onPermissionsChange]);

  const handleBulkSelect = React.useCallback((categoryName: string, selected: boolean) => {
    if (!role || !onPermissionsChange || !dashboard) return;
    
    const category = dashboard.categories.find((c: PermissionCategory) => c.name === categoryName);
    if (!category) return;

    const newPermissions = new Set(role.permissions);
    category.permissions
      .filter((p: Permission) => !p.isDeprecated)
      .forEach((permission: Permission) => {
        if (selected) {
          newPermissions.add(permission.id);
        } else {
          newPermissions.delete(permission.id);
        }
      });
    onPermissionsChange(Array.from(newPermissions));
  }, [role, onPermissionsChange, dashboard]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!role || !dashboard) {
    return null;
  }

  // Convert role permissions array to Set
  const selectedPermissions = new Set(role.permissions);

  return (
    <Card data-testid="permission-dashboard">
      <CardHeader>
        <CardTitle>Permissions for {role.name}</CardTitle>
        <CardDescription>
          {role.isSystem ? 'System role permissions cannot be modified' : 'Select permissions for this role'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PermissionList
          categories={dashboard.categories}
          selectedPermissions={selectedPermissions}
          onPermissionToggle={role.isSystem ? undefined : handlePermissionToggle}
          onBulkSelect={role.isSystem ? undefined : handleBulkSelect}
          disabled={role.isSystem}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
} 