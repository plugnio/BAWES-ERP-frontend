import { BaseService } from './base.service';
import type { AxiosResponse } from 'axios';

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
  private static readonly SYSTEM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'];

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
    if (this.isSystemRole(roleId)) {
      throw new Error('Cannot modify system roles');
    }

    // Get the existing role first
    const existingRole = await this.getRole(roleId);
    
    // Create a new role with updated data
    const response = await this.client.roles.roleManagementControllerCreateRole({
      name: dto.name || existingRole.name,
      description: dto.description || existingRole.description,
      permissions: dto.permissions || existingRole.permissions,
    });
    return (response as unknown as AxiosResponse<Role>).data;
  }

  /**
   * Updates role permissions
   */
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<Role> {
    if (this.isSystemRole(roleId)) {
      throw new Error('Cannot modify system role permissions');
    }

    // Get the existing role first
    const existingRole = await this.getRole(roleId);
    
    // Create a new role with updated permissions
    const response = await this.client.roles.roleManagementControllerCreateRole({
      name: existingRole.name,
      description: existingRole.description,
      permissions,
    });
    return (response as unknown as AxiosResponse<Role>).data;
  }

  /**
   * Updates the order of roles
   */
  async updateRoleOrder(updates: RoleOrderUpdate[]): Promise<void> {
    if (updates.some(update => this.isSystemRole(update.roleId))) {
      throw new Error('Cannot modify system role order');
    }

    await Promise.all(updates.map(async update => {
      // Get the existing role first
      const existingRole = await this.getRole(update.roleId);
      
      // Create a new role with updated data
      await this.client.roles.roleManagementControllerCreateRole({
        name: existingRole.name,
        description: existingRole.description,
        permissions: existingRole.permissions,
      });
    }));
  }

  /**
   * Deletes a role
   */
  async deleteRole(roleId: string): Promise<void> {
    if (this.isSystemRole(roleId)) {
      throw new Error('Cannot delete system roles');
    }

    // Get the existing role first
    const existingRole = await this.getRole(roleId);
    
    // Create a new role with isDeleted flag
    await this.client.roles.roleManagementControllerCreateRole({
      name: existingRole.name,
      description: existingRole.description,
      permissions: existingRole.permissions,
      isDeleted: true,
    } as unknown as CreateRoleDto);
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
   * Checks if a role is a system role
   */
  private isSystemRole(roleId: string): boolean {
    return RoleService.SYSTEM_ROLES.includes(roleId);
  }
} 