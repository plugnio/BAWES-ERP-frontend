import { BaseService } from './base.service';
import type { AxiosPromise } from 'axios';
import type { CreateRoleDto } from '@bawes/erp-api-sdk';

/**
 * Represents a single permission in the system
 * @interface Permission
 */
interface Permission {
  /** Unique identifier for the permission */
  id: string;
  /** Unique code used to reference the permission */
  code: string;
  /** Human-readable name of the permission */
  name: string;
  /** Detailed description of what the permission allows */
  description: string;
  /** Bitfield value used for permission checks */
  bitfield: string;
}

/**
 * Groups related permissions into categories
 * @interface PermissionCategory
 */
interface PermissionCategory {
  /** Unique identifier for the category */
  id: string;
  /** Name of the category */
  name: string;
  /** Description of the permissions in this category */
  description: string;
  /** List of permissions in this category */
  permissions: Permission[];
}

/**
 * Represents a role that can be assigned to users
 * @interface Role
 */
interface Role {
  /** Unique identifier for the role */
  id: string;
  /** Name of the role */
  name: string;
  /** Description of the role's purpose */
  description: string;
  /** Color used for UI representation */
  color: string;
  /** List of permission codes granted to this role */
  permissions: string[];
}

/**
 * Complete permission management dashboard data
 * @interface PermissionDashboard
 */
interface PermissionDashboard {
  /** List of all roles in the system */
  roles: Role[];
  /** List of all permission categories with their permissions */
  permissionCategories: PermissionCategory[];
}

/**
 * Service for managing roles and permissions in the system
 * Handles role creation, permission updates, and permission checks
 * 
 * @extends BaseService
 * 
 * @example
 * ```typescript
 * const permissionsService = new PermissionsService();
 * 
 * // Get all roles and permissions
 * const dashboard = await permissionsService.getDashboard();
 * 
 * // Create a new role
 * const role = await permissionsService.createRole(
 *   'Editor',
 *   'Can edit content',
 *   '#FF0000',
 *   ['CONTENT_EDIT', 'CONTENT_VIEW']
 * );
 * 
 * // Check if user has permission
 * const canEdit = permissionsService.hasPermission('CONTENT_EDIT', userPermissionBits);
 * ```
 */
export class PermissionsService extends BaseService {
  /** Cache of permission details for quick lookup */
  private permissionMap = new Map<string, Permission>();

  /**
   * Retrieves the complete permission management dashboard
   * Includes all roles and permissions in the system
   * Updates the permission cache on successful retrieval
   * 
   * @returns {Promise<PermissionDashboard>} Complete dashboard data
   */
  async getDashboard(): Promise<PermissionDashboard> {
    const dashboard = await this.handleRequest<PermissionDashboard>(
      this.client.permissions.permissionManagementControllerGetPermissionDashboard() as unknown as AxiosPromise<PermissionDashboard>
    );
    this.updatePermissionMap(dashboard);
    return dashboard;
  }

  /**
   * Retrieves details of a specific role
   * 
   * @param {string} roleId - ID of the role to retrieve
   * @returns {Promise<Role>} Role details
   */
  async getRole(roleId: string): Promise<Role> {
    return this.handleRequest<Role>(
      this.client.permissions.permissionManagementControllerGetRole(roleId) as unknown as AxiosPromise<Role>
    );
  }

  /**
   * Creates a new role with specified permissions
   * 
   * @param {string} name - Name of the role
   * @param {string} description - Description of the role
   * @param {string} color - Color code for UI representation
   * @param {string[]} permissions - List of permission codes to grant
   * @returns {Promise<Role>} Created role details
   */
  async createRole(name: string, description: string, color: string, permissions: string[]): Promise<Role> {
    const roleDto: CreateRoleDto = {
      name,
      description,
      color,
      permissions,
    };
    return this.handleRequest<Role>(
      this.client.roles.roleManagementControllerCreateRole(roleDto) as unknown as AxiosPromise<Role>
    );
  }

  /**
   * Updates the permissions assigned to a role
   * 
   * @param {string} roleId - ID of the role to update
   * @param {string[]} permissions - New list of permission codes
   * @returns {Promise<Role>} Updated role details
   */
  async updateRole(roleId: string, permissions: string[]): Promise<Role> {
    return this.handleRequest<Role>(
      this.client.roles.roleManagementControllerTogglePermissions(roleId, {
        data: { permissions }
      }) as unknown as AxiosPromise<Role>
    );
  }

  /**
   * Updates the internal permission cache from dashboard data
   * @param {PermissionDashboard} dashboard - Dashboard data containing permissions
   * @private
   */
  private updatePermissionMap(dashboard: PermissionDashboard) {
    this.permissionMap.clear();
    dashboard.permissionCategories.forEach(category => {
      category.permissions.forEach(permission => {
        this.permissionMap.set(permission.code, permission);
      });
    });
  }

  /**
   * Retrieves detailed information about a permission
   * 
   * @param {string} code - Permission code to look up
   * @returns {Permission | undefined} Permission details if found
   */
  getPermissionDetails(code: string): Permission | undefined {
    return this.permissionMap.get(code);
  }

  /**
   * Checks if a permission is granted based on permission bits
   * Uses bitwise operations to check if the permission is included in the user's permissions
   * 
   * @param {string} permissionCode - Code of the permission to check
   * @param {string} permissionBits - User's permission bits as a string
   * @returns {boolean} True if the permission is granted
   * 
   * @example
   * ```typescript
   * const canEdit = permissionsService.hasPermission('CONTENT_EDIT', user.permissionBits);
   * if (canEdit) {
   *   // Allow edit operation
   * }
   * ```
   */
  hasPermission(permissionCode: string, permissionBits: string): boolean {
    const permission = this.getPermissionDetails(permissionCode);
    if (!permission) {
      console.warn(`Unknown permission: ${permissionCode}`);
      return false;
    }
    
    try {
      const userBits = BigInt(permissionBits || '0');
      const permissionBit = BigInt(permission.bitfield);
      return (userBits & permissionBit) === permissionBit;
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  }
} 