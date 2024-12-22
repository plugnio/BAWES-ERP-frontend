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

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => {
    if (roleId) {
      loadRole(roleId);
    }
  }, [roleId, loadRole]);

  React.useEffect(() => {
    if (currentRole) {
      setSelectedPermissions(new Set(currentRole.permissions));
    } else {
      setSelectedPermissions(new Set());
    }
  }, [currentRole]);

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setSelectedPermissions(newPermissions);
    onPermissionsChange?.(Array.from(newPermissions));
  };

  const handleBulkSelect = (categoryId: string, selected: boolean) => {
    const category = dashboard?.permissionCategories.find(c => c.id === categoryId);
    if (!category) return;

    const newPermissions = new Set(selectedPermissions);
    category.permissions
      .filter(p => !p.deprecated)
      .forEach(permission => {
        if (selected) {
          newPermissions.add(permission.id);
        } else {
          newPermissions.delete(permission.id);
        }
      });

    setSelectedPermissions(newPermissions);
    onPermissionsChange?.(Array.from(newPermissions));
  };

  const handleSave = async () => {
    if (!currentRole) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      await updateRolePermissions(currentRole.id, Array.from(selectedPermissions));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = currentRole && !arePermissionsEqual(
    currentRole.permissions,
    Array.from(selectedPermissions)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboard) {
    return null;
  }

  const isSystemRole = currentRole && ['SUPER_ADMIN', 'ADMIN', 'USER'].includes(currentRole.id);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>
          {currentRole
            ? `Managing permissions for ${currentRole.name}`
            : 'Select a role to manage permissions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PermissionList
          categories={dashboard.permissionCategories}
          selectedPermissions={selectedPermissions}
          onPermissionToggle={handlePermissionToggle}
          onBulkSelect={handleBulkSelect}
          disabled={!currentRole || isSystemRole || isSaving}
        />
      </CardContent>
      {currentRole && (
        <CardFooter className="flex justify-between items-center">
          {isSystemRole ? (
            <p className="text-sm text-muted-foreground">System roles cannot be modified</p>
          ) : (
            <>
              {saveError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}
              <div className="flex-1" />
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function arePermissionsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every(permission => setA.has(permission));
} 