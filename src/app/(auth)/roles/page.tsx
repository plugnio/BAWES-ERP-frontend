'use client';

import { PermissionExplorer } from '@/components/permissions';
import { PermissionGuard } from '@/components/permissions';

export default function RolesPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Role Management</h1>
      <PermissionGuard permission="roles.manage">
        <PermissionExplorer />
      </PermissionGuard>
    </div>
  );
} 