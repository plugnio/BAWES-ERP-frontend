import { BaseService } from './base.service';
import type { AxiosResponse } from 'axios';
import type { RawAxiosRequestConfig } from 'axios';

/**
 * Role definition with associated permissions
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  permissions: string[];
  isSystem: boolean;
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
 * Service for managing roles
 */
export class RoleService extends BaseService {
  /**
   * Gets all roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await this.client.roles.roleManagementControllerGetRoles();
    return (response as unknown as AxiosResponse<Role[]>).data;
  }

  /**
   * Gets a specific role by ID
   */
  async getRole(roleId: string): Promise<Role> {
    // Note: The SDK doesn't have a direct getRole endpoint, so we fetch all roles and filter
    const response = await this.client.roles.roleManagementControllerGetRoles();
    const roles = (response as unknown as AxiosResponse<Role[]>).data;
    const role = roles.find(r => r.id === roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }
    return role;
  }

  /**
   * Creates a new role
   */
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const response = await this.client.roles.roleManagementControllerCreateRole(dto);
    return (response as unknown as AxiosResponse<Role>).data;
  }

  /**
   * Updates an existing role
   */
  async updateRole(roleId: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRole(roleId);
    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    // Since there's no direct update endpoint, we'll create a new role with the updated data
    const updatedDto: CreateRoleDto = {
      name: dto.name || role.name,
      description: dto.description ?? role.description,
      permissions: dto.permissions || role.permissions,
    };

    const response = await this.client.roles.roleManagementControllerCreateRole(updatedDto);
    return (response as unknown as AxiosResponse<Role>).data;
  }

  /**
   * Updates role permissions
   */
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<Role> {
    const role = await this.getRole(roleId);
    if (role.isSystem) {
      throw new Error('Cannot modify system role permissions');
    }

    const config: RawAxiosRequestConfig = {
      data: { permissions }
    };

    const response = await this.client.roles.roleManagementControllerTogglePermissions(roleId, config);
    return (response as unknown as AxiosResponse<Role>).data;
  }

  /**
   * Updates role order
   */
  async updateRoleOrder(updates: RoleOrderUpdate[]): Promise<void> {
    // Get all roles to check for system roles
    const roles = await this.getRoles();
    const systemRoles = new Set(roles.filter(r => r.isSystem).map(r => r.id));

    // Filter out system roles from updates
    const validUpdates = updates.filter(update => !systemRoles.has(update.roleId));

    for (const update of validUpdates) {
      const config: RawAxiosRequestConfig = {
        data: { position: update.sortOrder }
      };
      await this.client.roles.roleManagementControllerUpdatePosition(update.roleId, config);
    }
  }

  /**
   * Assigns a role to a user
   */
  async assignRole(userId: string): Promise<void> {
    await this.client.roles.roleManagementControllerAssignRole(userId);
  }

  /**
   * Removes a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.client.roles.roleManagementControllerRemoveRole(userId, roleId);
  }

  /**
   * Deletes a role
   * @throws {Error} Role deletion is not supported by the API
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.getRole(roleId);
    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    throw new Error('Role deletion is not supported by the API');
  }
} 