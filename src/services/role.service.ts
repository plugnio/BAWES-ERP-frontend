import { BaseService } from './base.service';
import type { AxiosPromise } from 'axios';
import type { CreateRoleDto, UpdateRoleDto as SDKUpdateRoleDto, ToggleRolePermissionDto } from '@bawes/erp-api-sdk';
import { PermissionsService } from './permissions.service';

export interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
  isSystem: boolean;
  sortOrder: number;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
}

export interface RoleOrderUpdate {
  roleId: string;
  sortOrder: number;
}

/**
 * Service for managing roles
 */
export class RoleService extends BaseService {
  constructor(private permissionsService?: PermissionsService) {
    super();
  }

  /**
   * Gets all roles
   */
  public async getRoles(): Promise<Role[]> {
    const promise = this.client.roles.roleControllerGetRoles() as unknown as AxiosPromise<Role[]>;
    return this.handleRequest(promise);
  }

  /**
   * Gets a specific role by ID
   */
  public async getRole(roleId: string): Promise<Role> {
    const promise = this.client.roles.roleControllerGetRole(roleId) as unknown as AxiosPromise<Role>;
    return this.handleRequest(promise);
  }

  /**
   * Creates a new role
   */
  public async createRole(dto: CreateRoleDto): Promise<Role> {
    const promise = this.client.roles.roleControllerCreateRole({
      name: dto.name,
      description: dto.description || '',
      color: dto.color || '#000000',
      permissions: dto.permissions || [],
    }) as unknown as AxiosPromise<Role>;
    const result = await this.handleRequest(promise);
    
    // Clear dashboard cache after role creation
    this.permissionsService?.clearDashboardCache();
    
    return result;
  }

  /**
   * Updates an existing role
   */
  public async updateRole(roleId: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRole(roleId);
    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    const updateDto: SDKUpdateRoleDto = {
      name: dto.name || role.name,
      description: dto.description || role.description || '',
      permissionIds: dto.permissions || role.permissions,
      isSystem: role.isSystem,
      sortOrder: role.sortOrder,
    };

    const promise = this.client.roles.roleControllerUpdateRole(roleId, updateDto) as unknown as AxiosPromise<Role>;
    return this.handleRequest(promise);
  }

  /**
   * Updates role permissions
   */
  public async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    const role = await this.getRole(roleId);
    if (role.isSystem) {
      throw new Error('Cannot modify system role permissions');
    }

    // Get current permissions to determine what needs to be toggled
    const currentPermissions = new Set(role.permissions);
    
    // Toggle each permission based on whether it's in the new permissions array
    for (const permission of new Set([...currentPermissions, ...permissions])) {
      const enabled = permissions.includes(permission);
      // Only toggle if the state is different
      if (enabled !== currentPermissions.has(permission)) {
        const toggleDto: ToggleRolePermissionDto = {
          permissionCode: permission,
          enabled
        };
        const promise = this.client.roles.roleControllerTogglePermissions(roleId, toggleDto) as unknown as AxiosPromise<void>;
        await this.handleRequest(promise);
      }
    }
    
    // Clear dashboard cache after permission updates
    this.permissionsService?.clearDashboardCache();
  }

  /**
   * Updates role order
   */
  public async updateRoleOrder(updates: RoleOrderUpdate[]): Promise<void> {
    // Get all roles to check for system roles
    const roles = await this.getRoles();
    const systemRoles = new Set(roles.filter(r => r.isSystem).map(r => r.id));

    // Filter out system roles from updates
    const validUpdates = updates.filter(update => !systemRoles.has(update.roleId));

    for (const update of validUpdates) {
      const promise = this.client.roles.roleControllerUpdatePosition(update.roleId, {
        data: {
          position: update.sortOrder
        }
      }) as unknown as AxiosPromise<void>;
      await this.handleRequest(promise);
    }
  }

  /**
   * Deletes a role
   */
  public async deleteRole(roleId: string): Promise<void> {
    const role = await this.getRole(roleId);
    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    const promise = this.client.roles.roleControllerDeleteRole(roleId) as unknown as AxiosPromise<void>;
    return this.handleRequest(promise);
  }
} 