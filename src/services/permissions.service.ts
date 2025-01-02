import { Decimal } from 'decimal.js';
import { BaseService } from './base.service';
import type { AxiosResponse, AxiosPromise } from 'axios';
import type { Role } from './role.service';
import type { CreateRoleDto } from './role.service';
import type { UpdateRoleDto } from './role.service';
import type { RoleOrderUpdate } from './role.service';

/**
 * Permission interface representing a single permission
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isDeprecated: boolean;
  sortOrder: number;
  bitfield: string;
}

/**
 * Category grouping related permissions
 */
export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

/**
 * Dashboard data containing permission categories and roles
 */
export interface PermissionDashboard {
  categories: PermissionCategory[];
  roles: Role[];
  stats: {
    totalPermissions: number;
    totalRoles: number;
    systemRoles: number;
  };
}

/**
 * Internal cache entry type
 */
interface CacheEntry {
  value: boolean;
  timestamp: number;
}

/**
 * Service for managing permissions
 */
export class PermissionsService extends BaseService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private permissionCache: Map<string, CacheEntry> = new Map();
  private dashboardCache: { data: PermissionDashboard | null; timestamp: number } | null = null;

  constructor() {
    super();
    // Initialize cache if not already initialized
    if (!this.permissionCache) {
      this.permissionCache = new Map<string, CacheEntry>();
    }
  }

  /**
   * Creates a new role
   */
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const response = await this.client.roles.roleManagementControllerCreateRole({
      name: dto.name,
      description: dto.description,
      color: dto.color,
      permissions: dto.permissions || [],
    });
    this.clearDashboardCache();
    return (response as unknown as AxiosResponse<Role>).data;
  }

  /**
   * Updates an existing role
   */
  async updateRole(roleId: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRole(roleId);
    const response = await this.client.roles.roleManagementControllerCreateRole({
      name: dto.name || role.name,
      description: dto.description ?? role.description,
      color: dto.color ?? role.color,
      permissions: dto.permissions || role.permissions,
    });
    this.clearDashboardCache();
    return (response as unknown as AxiosResponse<Role>).data;
  }

  /**
   * Deletes a role
   */
  async deleteRole(roleId: string): Promise<void> {
    const userId = 'system'; // The SDK requires a userId, but we're using system-level operations
    await this.client.roles.roleManagementControllerRemoveRole(userId, roleId);
    this.clearDashboardCache();
  }

  /**
   * Gets a role by ID
   */
  async getRole(roleId: string): Promise<Role> {
    const response = await this.client.roles.roleManagementControllerGetRoles();
    const roles = (response as unknown as AxiosResponse<Role[]>).data;
    const role = roles.find(r => r.id === roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }
    return role;
  }

  /**
   * Updates role permissions
   */
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    try {
      const role = await this.getRole(roleId);
      if (role.isSystem) {
        throw new Error('Cannot modify system role permissions');
      }

      await this.handleRequest(
        this.client.roles.roleManagementControllerTogglePermissions(roleId, {
          data: { permissions }
        }) as unknown as AxiosPromise<void>
      );
      
      this.clearDashboardCache();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Updates role order
   */
  async updateRoleOrder(updates: RoleOrderUpdate[]): Promise<void> {
    for (const update of updates) {
      await this.client.roles.roleManagementControllerUpdatePosition(update.roleId, {
        data: { sortOrder: update.sortOrder },
      });
    }
    this.clearDashboardCache();
  }

  /**
   * Fetches the permission dashboard data
   */
  async getDashboard(): Promise<PermissionDashboard> {
    // Check cache first
    if (this.dashboardCache && Date.now() - this.dashboardCache.timestamp < PermissionsService.CACHE_TTL) {
      return this.dashboardCache.data!;
    }

    const response = await this.client.permissions.permissionManagementControllerGetPermissionDashboard();
    const data = (response as unknown as AxiosResponse<PermissionDashboard>).data;
    
    // Cache the result
    this.dashboardCache = {
      data,
      timestamp: Date.now(),
    };

    return data;
  }

  /**
   * Checks if a user has a specific permission
   */
  hasPermission(permissionId: string, permissionBits: string): boolean {
    // Ensure cache exists
    if (!this.permissionCache) {
      this.permissionCache = new Map<string, CacheEntry>();
    }

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
   * Clears all caches
   */
  clearCache(): void {
    if (this.permissionCache) {
      this.permissionCache.clear();
    } else {
      this.permissionCache = new Map<string, CacheEntry>();
    }
    this.dashboardCache = null;
  }

  /**
   * Clears the dashboard cache
   */
  clearDashboardCache(): void {
    this.dashboardCache = null;
  }
} 