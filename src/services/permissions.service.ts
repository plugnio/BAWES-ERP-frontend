import { BaseService } from './base.service';
import Decimal from 'decimal.js';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  bitfield: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface PermissionDashboard {
  categories: PermissionCategory[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

export class PermissionsService extends BaseService {
  private permissionMap: Record<string, Decimal> = {};

  async getDashboard(): Promise<PermissionDashboard> {
    const dashboard = await this.handleRequest<PermissionDashboard>(
      this.client.permissions.permissionManagementControllerGetPermissionDashboard()
    );
    this.updatePermissionMap(dashboard);
    return dashboard;
  }

  async getRole(id: string): Promise<Role> {
    return this.handleRequest<Role>(
      this.client.permissions.permissionManagementControllerGetRole(id)
    );
  }

  async updateRolePermissions(id: string, permissions: string[]): Promise<Role> {
    return this.handleRequest<Role>(
      this.client.permissions.permissionManagementControllerUpdateRolePermissions(id, {
        data: { permissions }
      })
    );
  }

  hasPermission(permissionCode: string, permissionBits: string): boolean {
    try {
      const userBits = new Decimal(permissionBits || '0');
      const permissionBitfield = this.permissionMap[permissionCode];

      if (!permissionBitfield) {
        console.warn(`Unknown permission: ${permissionCode}`);
        return false;
      }

      const divided = userBits.dividedToIntegerBy(permissionBitfield);
      const modulo = divided.modulo(2);
      return modulo.equals(1);
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  }

  private updatePermissionMap(dashboard: PermissionDashboard) {
    dashboard.categories.forEach((category) => {
      category.permissions.forEach((permission) => {
        this.permissionMap[permission.code] = new Decimal(permission.bitfield);
      });
    });
  }
} 