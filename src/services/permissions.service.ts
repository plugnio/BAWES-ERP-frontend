import { Decimal } from 'decimal.js';
import { ServiceRegistry } from '.';

/**
 * Permission interface representing a single permission
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  deprecated?: boolean;
  category?: string;
}

/**
 * Category grouping related permissions
 */
export interface PermissionCategory {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

/**
 * Role definition with associated permissions
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  permissions: string[];
}

/**
 * Dashboard data containing roles and permission categories
 */
export interface PermissionDashboard {
  roles: Role[];
  permissionCategories: PermissionCategory[];
}

/**
 * DTO for creating a new role
 */
export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[];
}

/**
 * DTO for updating an existing role
 */
export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * DTO for updating role order
 */
export interface RoleOrderUpdate {
  roleId: string;
  sortOrder: number;
}

/**
 * Internal cache entry type
 */
interface CacheEntry {
  value: boolean;
  timestamp: number;
}

/**
 * Service for managing permissions and roles
 */
export class PermissionsService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly SYSTEM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'];
  private permissionCache: Map<string, CacheEntry> = new Map();

  constructor(private registry: ServiceRegistry) {}

  /**
   * Fetches the permission dashboard data
   */
  async getDashboard(): Promise<PermissionDashboard> {
    const api = this.registry.api;
    const response = await api.roleManagementControllerGetDashboard();
    return response.data;
  }

  /**
   * Creates a new role
   */
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const api = this.registry.api;
    const response = await api.roleManagementControllerCreateRole(dto);
    return response.data;
  }

  /**
   * Updates an existing role
   */
  async updateRole(roleId: string, dto: UpdateRoleDto): Promise<Role> {
    if (this.isSystemRole(roleId)) {
      throw new Error('Cannot modify system roles');
    }

    const api = this.registry.api;
    const response = await api.roleManagementControllerUpdateRole(roleId, dto);
    return response.data;
  }

  /**
   * Updates role permissions
   */
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<Role> {
    if (this.isSystemRole(roleId)) {
      throw new Error('Cannot modify system role permissions');
    }

    const api = this.registry.api;
    const response = await api.roleManagementControllerUpdateRolePermissions(roleId, { permissions });
    return response.data;
  }

  /**
   * Updates the order of roles
   */
  async updateRoleOrder(updates: RoleOrderUpdate[]): Promise<void> {
    // Validate no system roles are being modified
    if (updates.some(update => this.isSystemRole(update.roleId))) {
      throw new Error('Cannot modify system role order');
    }

    const api = this.registry.api;
    await api.roleManagementControllerUpdateRoleOrder({ updates });
  }

  /**
   * Deletes a role
   */
  async deleteRole(roleId: string): Promise<void> {
    if (this.isSystemRole(roleId)) {
      throw new Error('Cannot delete system roles');
    }

    const api = this.registry.api;
    await api.roleManagementControllerDeleteRole(roleId);
  }

  /**
   * Gets a specific role by ID
   */
  async getRole(roleId: string): Promise<Role> {
    const api = this.registry.api;
    const response = await api.roleManagementControllerGetRole(roleId);
    return response.data;
  }

  /**
   * Checks if a user has a specific permission
   */
  hasPermission(permissionId: string, permissionBits: string): boolean {
    const cacheKey = `${permissionId}:${permissionBits}`;
    const cached = this.permissionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < PermissionsService.CACHE_TTL) {
      return cached.value;
    }

    try {
      // Use Decimal.js for precise bitwise operations
      const bits = new Decimal(permissionBits);
      const permBit = new Decimal(2).pow(parseInt(permissionId, 10));
      const result = !bits.mod(permBit).equals(0);

      // Cache the result
      this.permissionCache.set(cacheKey, {
        value: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Clears the permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Checks if a role is a system role
   */
  private isSystemRole(roleId: string): boolean {
    return PermissionsService.SYSTEM_ROLES.includes(roleId);
  }
} 