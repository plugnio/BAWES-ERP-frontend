'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useServices } from '@/hooks/use-services';
import { usePermissions } from '@/hooks/use-permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/shared';
import { PermissionList } from './permission-list';
import type { Role } from '@/services/role.service';

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
          selectedPermissions={role.permissions}
          onPermissionsChange={role.isSystem ? undefined : onPermissionsChange}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
} 