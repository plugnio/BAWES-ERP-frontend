import { BaseService } from './base.service';
import type { AxiosPromise } from 'axios';
import type { CreateRoleDto } from '@bawes/erp-api-sdk';

interface Permission {
  code: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

interface PermissionDashboard {
  roles: Role[];
  permissions: Permission[];
}

export class PermissionsService extends BaseService {
  private permissionMap = new Map<string, Permission>();

  async getDashboard(): Promise<PermissionDashboard> {
    const dashboard = await this.handleRequest<PermissionDashboard>(
      this.client.permissions.permissionManagementControllerGetPermissionDashboard() as unknown as AxiosPromise<PermissionDashboard>
    );
    this.updatePermissionMap(dashboard);
    return dashboard;
  }

  async getRole(roleId: string): Promise<Role> {
    return this.handleRequest<Role>(
      this.client.permissions.permissionManagementControllerGetRole(roleId) as unknown as AxiosPromise<Role>
    );
  }

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

  async updateRole(roleId: string, permissions: string[]): Promise<Role> {
    return this.handleRequest<Role>(
      this.client.roles.roleManagementControllerTogglePermissions(roleId, {
        data: { permissions }
      }) as unknown as AxiosPromise<Role>
    );
  }

  private updatePermissionMap(dashboard: PermissionDashboard) {
    this.permissionMap.clear();
    dashboard.permissions.forEach(permission => {
      this.permissionMap.set(permission.code, permission);
    });
  }

  getPermissionDetails(code: string): Permission | undefined {
    return this.permissionMap.get(code);
  }
} 