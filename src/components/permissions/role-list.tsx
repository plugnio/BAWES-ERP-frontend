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

interface RoleListProps {
  onRoleSelect?: (roleId: string) => void;
  selectedRoleId?: string;
  className?: string;
}

export function RoleList({ onRoleSelect, selectedRoleId, className }: RoleListProps) {
  const { currentRole, dashboard, isLoading, error, loadDashboard } = usePermissions();

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  // Extract unique roles from permissions
  const roles = dashboard.permissionCategories.flatMap((category) =>
    category.permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
    }))
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>Select a role to manage its permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {roles.map((role) => (
          <Button
            key={role.id}
            variant={selectedRoleId === role.id ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => onRoleSelect?.(role.id)}
          >
            <div className="text-left">
              <div className="font-medium">{role.name}</div>
              {role.description && (
                <div className="text-sm text-muted-foreground">
                  {role.description}
                </div>
              )}
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
} 