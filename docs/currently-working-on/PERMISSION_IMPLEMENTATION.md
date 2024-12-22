# Frontend Permission Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Implementation Details](#implementation-details)
4. [Components and Hooks](#components-and-hooks)
5. [Best Practices](#best-practices)
6. [Security Considerations](#security-considerations)
7. [Performance Optimization](#performance-optimization)
8. [Examples](#examples)

## Overview

This guide outlines the implementation of the RBAC (Role-Based Access Control) system in the frontend. The system uses bitfield-based permissions with Decimal.js for precise calculations, matching the backend implementation.

### Key Features
- 🔐 Bitfield-based permission checks using Decimal.js
- 🚀 Efficient permission caching with TTL
- 📦 Automatic permission discovery
- 🛡️ Type-safe permission guards
- 🎨 Automatic cache invalidation
- ⚡ Optimized performance

## Directory Structure and Architecture

```
src/
├── services/
│   ├── base.service.ts                    # Base service class
│   └── permissions/
│       ├── permission.service.ts          # Permission service + types
│       └── permission-manager.ts          # Internal singleton + types
├── components/
│   ├── auth/
│   │   └── AuthGuard.tsx                 # Auth guard + types
│   └── permissions/
│       ├── PermissionGuard.tsx           # Permission guard + types
│       ├── dashboard/
│       │   └── PermissionDashboard.tsx   # Dashboard + types
│       └── roles/
│           ├── RoleEditor.tsx            # Role editor + types
│           └── RoleList.tsx              # Role list + types
└── hooks/
    └── usePermissions.ts                 # Permission hook + types
```

### Implementation Examples

1. **Permission Service and Types**

```typescript
// services/permissions/permission.service.ts
import { BaseService } from '../base.service';
import Decimal from 'decimal.js';

// Types co-located with service
interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  bitfield: string;
  isDeprecated: boolean;
}

interface PermissionCategory {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  sortOrder: number;
  permissions: Permission[];
}

interface PermissionDashboard {
  roles: Role[];
  categories: PermissionCategory[];
}

// Service implementation
export class PermissionService extends BaseService {
  private manager = PermissionManager.getInstance();

  async getDashboard(): Promise<PermissionDashboard> {
    try {
      const dashboard = await this.client.permissions
        .permissionManagementControllerGetDashboard();
      this.manager.initialize(dashboard);
      return dashboard;
    } catch (error) {
      console.error('Failed to fetch permission dashboard:', error);
      throw error;
    }
  }

  hasPermission(code: string, bits: string): boolean {
    return this.manager.hasPermission(code, bits);
  }

  async createRole(data: CreateRoleDto): Promise<Role> {
    const role = await this.client.roles
      .roleManagementControllerCreateRole(data);
    this.manager.clearCache();
    return role;
  }

  async updateRole(roleId: string, data: UpdateRoleDto): Promise<Role> {
    const role = await this.client.roles
      .roleManagementControllerUpdateRole(roleId, data);
    this.manager.clearCache();
    return role;
  }
}

// Export types needed by other files
export type { Permission, Role, PermissionCategory, PermissionDashboard };
```

2. **Permission Manager Implementation**

```typescript
// services/permissions/permission-manager.ts
import Decimal from 'decimal.js';
import type { Permission, PermissionDashboard } from './permission.service';

interface CacheEntry {
  result: boolean;
  timestamp: number;
}

export class PermissionManager {
  private static instance: PermissionManager;
  private permissionMap = new Map<string, Permission>();
  private permissionCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  initialize(dashboard: PermissionDashboard): void {
    this.permissionMap.clear();
    dashboard.categories.forEach(category => {
      category.permissions.forEach(permission => {
        if (!permission.isDeprecated) {
          this.permissionMap.set(permission.code, permission);
        }
      });
    });
  }

  hasPermission(code: string, bits: string): boolean {
    try {
      const cacheKey = `${code}:${bits}`;
      const cached = this.permissionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result;
      }

      const permission = this.permissionMap.get(code);
      if (!permission || permission.isDeprecated) return false;

      const userBits = new Decimal(bits || '0');
      const permissionBitfield = new Decimal(permission.bitfield);
      const result = userBits
        .dividedToIntegerBy(permissionBitfield)
        .modulo(2)
        .equals(1);

      this.permissionCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  }

  clearCache(): void {
    this.permissionCache.clear();
  }
}
```

3. **Permission Hook Implementation**

```typescript
// hooks/usePermissions.ts
import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { PermissionService } from '@/services/permissions/permission.service';

interface UsePermissionsReturn {
  loading: boolean;
  error: Error | null;
  hasPermission: (code: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [service] = useState(() => new PermissionService());

  useEffect(() => {
    const initializePermissions = async () => {
      try {
        setLoading(true);
        await service.getDashboard();
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializePermissions();
    }
  }, [user, service]);

  const hasPermission = useCallback(
    (code: string): boolean => {
      if (!user?.permissionBits) return false;
      return service.hasPermission(code, user.permissionBits);
    },
    [user?.permissionBits, service]
  );

  const refreshPermissions = useCallback(async () => {
    setLoading(true);
    try {
      await service.getDashboard();
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    loading,
    error,
    hasPermission,
    refreshPermissions,
  };
}
```

4. **Permission Guard Component**

```typescript
// components/permissions/PermissionGuard.tsx
import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permissions: string | string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permissions,
  requireAll = true,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) return null;

  const hasAccess = Array.isArray(permissions)
    ? requireAll
      ? permissions.every(hasPermission)
      : permissions.some(hasPermission)
    : hasPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

## Best Practices

### 1. Permission Checking

```typescript
// ✅ DO: Use PermissionGuard for single permission
<PermissionGuard permissions="users.create">
  <CreateUserButton />
</PermissionGuard>

// ✅ DO: Use PermissionGuard for multiple permissions
<PermissionGuard 
  permissions={['users.manage', 'roles.manage']}
  requireAll={true}
>
  <UserManagement />
</PermissionGuard>

// ✅ DO: Use requireAll=false when any permission is sufficient
<PermissionGuard 
  permissions={['users.manage', 'roles.manage']}
  requireAll={false}
>
  <UserActions />
</PermissionGuard>

// ❌ DON'T: Check permissions directly in JSX
{hasPermission('users.create') && <CreateUserButton />}

// ❌ DON'T: Nest PermissionGuard components
<PermissionGuard permissions="users.create">
  <PermissionGuard permissions="users.update">
    <UserManagement />
  </PermissionGuard>
</PermissionGuard>
```

### 2. Error Handling

```typescript
// ✅ DO: Implement error boundaries
<ErrorBoundary fallback={<PermissionError />}>
  <PermissionGuard permissions="users.manage">
    <UserManagement />
  </PermissionGuard>
</ErrorBoundary>

// ✅ DO: Handle loading states
const { loading, error, hasPermission } = usePermissions();
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### 3. Cache Management

```typescript
// ✅ DO: Clear cache on important actions
async function updateRole(roleId: string, data: UpdateRoleDto) {
  await permissionService.updateRole(roleId, data);
  await refreshPermissions(); // This will clear cache and refetch
}

// ✅ DO: Use the permission service for all permission operations
const service = new PermissionService();
const hasAccess = service.hasPermission(code, bits);
```

## Security Considerations

1. **Permission Checks**
   - Always use PermissionGuard for UI elements
   - Implement server-side validation
   - Never trust client-side checks alone
   - Cache permission results with TTL

2. **Role Management**
   - Protect system roles from modification
   - Validate role changes server-side
   - Implement proper audit logging
   - Clear permission cache on role changes

## Performance Optimization

1. **Permission Caching**
   - Cache permission checks for 5 minutes
   - Clear cache on role/permission changes
   - Use efficient Decimal.js calculations
   - Implement proper cache invalidation

2. **Component Optimization**
   - Use memo for permission components
   - Implement proper dependency arrays
   - Avoid unnecessary permission checks
   - Use requireAll prop appropriately

3. **Network Optimization**
   - Batch permission updates
   - Implement proper error retries
   - Cache dashboard data
   - Use optimistic updates

## Examples

### 1. Form with Permission Checks

```typescript
function UserForm() {
  const { hasPermission } = usePermissions();

  return (
    <form>
      <input name="name" type="text" />

      <PermissionGuard permissions="users.update">
        <input
          name="email"
          type="email"
        />
      </PermissionGuard>

      <PermissionGuard 
        permissions={['roles.assign', 'roles.update']}
        requireAll={false}
      >
        <RoleSelect />
      </PermissionGuard>

      <PermissionGuard
        permissions="users.update"
        fallback={<p>You don't have permission to update users</p>}
      >
        <button type="submit">Update User</button>
      </PermissionGuard>
    </form>
  );
}
```

### 2. Navigation with Permissions

```typescript
function Navigation() {
  return (
    <nav>
      <PermissionGuard permissions="dashboard.view">
        <Link href="/dashboard">Dashboard</Link>
      </PermissionGuard>

      <PermissionGuard 
        permissions={['users.manage']}
        requireAll={false}
      >
        <Link href="/users">User Management</Link>
      </PermissionGuard>

      <PermissionGuard permissions="roles.manage">
        <Link href="/roles">Role Management</Link>
      </PermissionGuard>
    </nav>
  );
}
```

## Permission Management UI

The permission management system consists of two main parts:

1. **Service Layer** (Covered in Previous Sections)
   - Permission service for handling permissions throughout the app
   - Permission manager for caching and calculations
   - Permission guards for protecting UI elements
   - Hooks for consuming permissions in components

2. **Management UI** (Covered in This Section)
   - UI components for administrators to manage roles and permissions
   - Permission discovery and visualization
   - Role-permission assignment interface
   - Real-time permission updates

The following components implement the management UI that administrators will use to discover, view, and manage permissions and roles:

```
src/
└── components/
    └── permissions/
        └── discovery/                     # Permission discovery and management
            ├── PermissionExplorer.tsx     # Main permission discovery interface
            ├── PermissionList.tsx         # Category-based permission list
            └── PermissionMatrix.tsx       # Role-permission assignment matrix
```

### Permission Explorer Component

```typescript
// components/permissions/discovery/PermissionExplorer.tsx
import { useState } from 'react';
import { PermissionList } from './PermissionList';
import { PermissionMatrix } from './PermissionMatrix';
import type { Permission, Role } from '@/services/permissions/permission.service';

interface PermissionExplorerProps {
  roles: Role[];
  categories: PermissionCategory[];
}

export function PermissionExplorer({ roles, categories }: PermissionExplorerProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="permission-explorer">
      <div className="permission-explorer__roles">
        <h2>Roles</h2>
        <RoleList
          roles={roles}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
        />
      </div>

      <div className="permission-explorer__permissions">
        <h2>Permissions by Category</h2>
        <PermissionList
          categories={categories}
          selectedRole={selectedRole}
        />
      </div>

      {selectedRole && (
        <div className="permission-explorer__matrix">
          <h2>Permission Matrix</h2>
          <PermissionMatrix
            role={selectedRole}
            categories={categories}
          />
        </div>
      )}
    </div>
  );
}
```

### Permission List Component

```typescript
// components/permissions/discovery/PermissionList.tsx
interface PermissionListProps {
  categories: PermissionCategory[];
  selectedRole?: Role;
}

export function PermissionList({ categories, selectedRole }: PermissionListProps) {
  return (
    <div className="permission-list">
      {categories.map(category => (
        <div key={category.id} className="permission-category">
          <h3>{category.name}</h3>
          <div className="permission-items">
            {category.permissions.map(permission => (
              <div key={permission.id} className="permission-item">
                <div className="permission-item__code">{permission.code}</div>
                <div className="permission-item__name">{permission.name}</div>
                <div className="permission-item__description">
                  {permission.description}
                </div>
                {selectedRole && (
                  <PermissionToggle
                    permission={permission}
                    role={selectedRole}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Permission Matrix Component

```typescript
// components/permissions/discovery/PermissionMatrix.tsx
interface PermissionMatrixProps {
  role: Role;
  categories: PermissionCategory[];
}

export function PermissionMatrix({ role, categories }: PermissionMatrixProps) {
  const [updating, setUpdating] = useState(false);
  const permissionService = usePermissionService();

  const handleTogglePermission = async (permission: Permission) => {
    try {
      setUpdating(true);
      const hasPermission = role.permissions.some(p => p.id === permission.id);
      const updatedPermissions = hasPermission
        ? role.permissions.filter(p => p.id !== permission.id)
        : [...role.permissions, permission];

      await permissionService.updateRole(role.id, {
        ...role,
        permissions: updatedPermissions,
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="permission-matrix">
      {categories.map(category => (
        <div key={category.id} className="permission-matrix__category">
          <h4>{category.name}</h4>
          <div className="permission-matrix__grid">
            {category.permissions.map(permission => (
              <div key={permission.id} className="permission-matrix__item">
                <label>
                  <input
                    type="checkbox"
                    checked={role.permissions.some(p => p.id === permission.id)}
                    onChange={() => handleTogglePermission(permission)}
                    disabled={updating || permission.isDeprecated}
                  />
                  {permission.name}
                </label>
                <small>{permission.code}</small>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Usage in Admin Dashboard

```typescript
// pages/admin/permissions.tsx
export default function PermissionsPage() {
  const { data: dashboard, isLoading } = useQuery(
    'permissions',
    () => permissionService.getDashboard()
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <h1>Permission Management</h1>
      <PermissionGuard permissions="permissions.manage">
        <PermissionExplorer
          roles={dashboard.roles}
          categories={dashboard.categories}
        />
      </PermissionGuard>
    </AdminLayout>
  );
}
```

This UI provides:
1. Category-based permission discovery
2. Role-permission matrix for easy assignment
3. Clear permission descriptions and codes
4. Efficient permission toggling

The components use the permission service we defined earlier for all operations, ensuring consistent permission handling throughout the application.

This implementation guide provides a comprehensive approach to handling permissions in the frontend while maintaining security, performance, and clean code practices. Follow these guidelines to ensure consistent and secure permission management across your application.