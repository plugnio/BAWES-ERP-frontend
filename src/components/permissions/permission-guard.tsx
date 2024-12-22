'use client';

import React from 'react';
import { usePermissions } from '@/hooks';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared';

interface PermissionGuardProps {
  /** The permission code(s) required to access the content */
  permission: string | string[];
  /** Content to render when permission is granted */
  children: React.ReactNode;
  /** Optional fallback UI when permission is denied */
  fallback?: React.ReactNode;
  /** Optional loading UI */
  loadingUI?: React.ReactNode;
  /** Optional error UI */
  errorUI?: React.ReactNode;
  /** Whether all permissions are required (when passing multiple) */
  requireAll?: boolean;
}

/**
 * Guards content behind permission checks
 * Supports single or multiple permission requirements
 * 
 * @example
 * ```tsx
 * // Single permission
 * <PermissionGuard permission="USER_MANAGE">
 *   <UserManagement />
 * </PermissionGuard>
 * 
 * // Multiple permissions (all required)
 * <PermissionGuard permission={["USER_MANAGE", "USER_DELETE"]}>
 *   <DangerousOperation />
 * </PermissionGuard>
 * 
 * // Multiple permissions (any required)
 * <PermissionGuard permission={["USER_MANAGE", "USER_DELETE"]} requireAll={false}>
 *   <UserActions />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
  loadingUI,
  errorUI,
  requireAll = true,
}: PermissionGuardProps) {
  const { hasPermission, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const { user, isLoading: authLoading } = useAuth();

  // Show loading UI while permissions or auth are being checked
  if (permissionsLoading || authLoading) {
    return loadingUI || (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error UI if there was an error loading permissions
  if (permissionsError) {
    return errorUI || (
      <div className="flex items-center justify-center p-4 text-destructive">
        <p>Error loading permissions: {permissionsError}</p>
      </div>
    );
  }

  // If no user or no permission bits, deny access
  if (!user?.permissionBits) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (typeof permission === 'string') {
    return hasPermission(permission, user.permissionBits) ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple permissions
  const hasAccess = requireAll
    ? permission.every(p => hasPermission(p, user.permissionBits))
    : permission.some(p => hasPermission(p, user.permissionBits));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
} 