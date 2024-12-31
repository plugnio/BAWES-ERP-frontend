'use client';

import React from 'react';
import { usePermissions } from '@/hooks';
import { LoadingSpinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { PermissionList } from './permission-list';
import type { Permission, PermissionCategory } from '@/services/permissions.service';

interface PermissionDashboardProps {
  roleId?: string;
  className?: string;
  onPermissionsChange?: (permissions: string[]) => void;
}

export function PermissionDashboard({
  roleId,
  className,
  onPermissionsChange,
}: PermissionDashboardProps) {
  const {
    dashboard,
    currentRole,
    isLoading,
    error,
    loadDashboard,
    loadRole,
    updateRolePermissions,
  } = usePermissions();

  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Only load dashboard if we don't have it yet
  React.useEffect(() => {
    if (!dashboard) {
      loadDashboard();
    }
  }, [dashboard, loadDashboard]);

  React.useEffect(() => {
    if (roleId) {
      loadRole(roleId);
    }
  }, [roleId, loadRole]);

  // Show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || !dashboard) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Failed to load permissions dashboard'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
    onPermissionsChange?.(Array.from(newSelected));
  };

  const handleBulkSelect = (categoryName: string, selected: boolean) => {
    const category = dashboard.categories.find((c) => c.name === categoryName);
    if (!category) return;

    const newSelected = new Set(selectedPermissions);
    category.permissions
      .filter((p: Permission) => !p.isDeprecated)
      .forEach((permission: Permission) => {
        if (selected) {
          newSelected.add(permission.id);
        } else {
          newSelected.delete(permission.id);
        }
      });
    setSelectedPermissions(newSelected);
    onPermissionsChange?.(Array.from(newSelected));
  };

  return (
    <PermissionList
      categories={dashboard.categories}
      selectedPermissions={selectedPermissions}
      onPermissionToggle={handlePermissionToggle}
      onBulkSelect={handleBulkSelect}
      className={className}
    />
  );
} 