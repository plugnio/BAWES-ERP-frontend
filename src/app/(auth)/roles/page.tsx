import React from 'react';
import { Metadata } from 'next';

/**
 * Metadata configuration for the roles management page
 * Used by Next.js for SEO and document head
 */
export const metadata: Metadata = {
  title: 'Role Management',
  description: 'Manage roles and permissions in BAWES ERP',
};

/**
 * Role management page component
 * Provides interface for managing user roles and their permissions
 * 
 * Layout:
 * - Header with page title and action buttons
 * - Two-column layout (responsive):
 *   - Left: Role list and selection
 *   - Right: Permission editor for selected role
 * 
 * Features:
 * - Role creation and editing
 * - Permission assignment
 * - Responsive grid layout
 * - Tailwind CSS styling
 * 
 * Permissions Required:
 * - ROLE_VIEW: To view roles
 * - ROLE_EDIT: To modify roles
 * - PERMISSION_VIEW: To view permissions
 * 
 * @returns {JSX.Element} Roles page structure
 * 
 * @example
 * ```tsx
 * // This page is automatically wrapped with AuthLayout
 * // and protected by AuthGuard
 * <RolesPage />
 * ```
 */
export default function RolesPage() {
  return (
    <div className="container space-y-8 p-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground">
            Manage roles and permissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Add action buttons here */}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role list section */}
        <div className="space-y-4">
          {/* Add role list here */}
        </div>
        {/* Permission editor section */}
        <div className="space-y-4">
          {/* Add permission editor here */}
        </div>
      </div>
    </div>
  );
} 