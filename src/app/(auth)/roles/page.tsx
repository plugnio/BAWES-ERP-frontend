'use client';

import { PermissionExplorer } from '@/components/permissions';
import { PermissionGuard } from '@/components/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function RolesPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">
          Manage roles and their permissions. Drag to reorder roles and click to manage their permissions.
        </p>
      </div>
      
      <Separator />

      <PermissionGuard 
        permission="roles.manage"
        fallback={
          <Alert variant="destructive">
            <AlertDescription>
              You do not have permission to manage roles.
            </AlertDescription>
          </Alert>
        }
      >
        <PermissionExplorer className="w-full" />
      </PermissionGuard>
    </div>
  );
} 