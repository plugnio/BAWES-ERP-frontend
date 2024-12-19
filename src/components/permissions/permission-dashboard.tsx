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
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(
    new Set()
  );

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

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner />
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
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {dashboard.categories.map((category) => (
              <div key={category.id} className="space-y-4">
                <h3 className="font-medium text-lg">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
                <div className="grid gap-4">
                  {category.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={() =>
                          handlePermissionToggle(permission.id)
                        }
                        disabled={!currentRole}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={permission.id}
                          className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </label>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 