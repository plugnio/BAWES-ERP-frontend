import { RoleService } from './role.service';
import { BaseService } from './base.service';
import type { Role, UpdateRoleDto } from './role.service';
import type { CreateRoleDto } from '@bawes/erp-api-sdk';

jest.mock('./base.service', () => {
  return {
    BaseService: jest.fn().mockImplementation(() => ({
      handleRequest: jest.fn(async (promise) => await Promise.resolve(promise)),
      client: {
        roles: {
          roleControllerGetRoles: jest.fn(() => Promise.resolve([])),
          roleControllerGetRole: jest.fn(() => Promise.resolve({})),
          roleControllerCreateRole: jest.fn(() => Promise.resolve({})),
          roleControllerUpdateRole: jest.fn(() => Promise.resolve({})),
          roleControllerTogglePermissions: jest.fn(() => Promise.resolve()),
          roleControllerUpdatePosition: jest.fn(() => Promise.resolve()),
          roleControllerDeleteRole: jest.fn(() => Promise.resolve()),
        },
      },
    })),
  };
});

describe('RoleService', () => {
  let service: RoleService;
  let mockHandleRequest: jest.Mock;

  const mockRole: Role = {
    id: '1',
    name: 'Role 1',
    description: 'Description 1',
    permissions: ['1', '2'],
    isSystem: false,
    sortOrder: 1,
  };

  beforeEach(() => {
    mockHandleRequest = jest.fn(async (promise) => await Promise.resolve(promise));
    (BaseService as jest.Mock).mockImplementation(() => ({
      handleRequest: mockHandleRequest,
      client: {
        roles: {
          roleControllerGetRoles: jest.fn(() => Promise.resolve([])),
          roleControllerGetRole: jest.fn(() => Promise.resolve({})),
          roleControllerCreateRole: jest.fn(() => Promise.resolve({})),
          roleControllerUpdateRole: jest.fn(() => Promise.resolve({})),
          roleControllerTogglePermissions: jest.fn(() => Promise.resolve()),
          roleControllerUpdatePosition: jest.fn(() => Promise.resolve()),
          roleControllerDeleteRole: jest.fn(() => Promise.resolve()),
        },
      },
    }));

    service = new RoleService();
    Object.setPrototypeOf(service, {
      ...Object.getPrototypeOf(service),
      getRoles: RoleService.prototype.getRoles,
      getRole: RoleService.prototype.getRole,
      createRole: RoleService.prototype.createRole,
      updateRole: RoleService.prototype.updateRole,
      updateRolePermissions: RoleService.prototype.updateRolePermissions,
      updateRoleOrder: RoleService.prototype.updateRoleOrder,
      deleteRole: RoleService.prototype.deleteRole,
    });
  });

  describe('getRoles', () => {
    const mockRoles: Role[] = [mockRole];

    it('should fetch all roles', async () => {
      mockHandleRequest.mockResolvedValueOnce(mockRoles);

      const result = await service.getRoles();

      expect(result).toEqual(mockRoles);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
      expect(mockHandleRequest).toHaveBeenCalledWith(expect.any(Promise));
    });
  });

  describe('getRole', () => {
    it('should fetch a specific role', async () => {
      mockHandleRequest.mockResolvedValueOnce(mockRole);

      const result = await service.getRole('1');

      expect(result).toEqual(mockRole);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
      expect(mockHandleRequest).toHaveBeenCalledWith(expect.any(Promise));
    });

    it('should handle non-existent role', async () => {
      mockHandleRequest.mockRejectedValueOnce(new Error('Role not found'));

      await expect(service.getRole('999')).rejects.toThrow('Role not found');
    });
  });

  describe('createRole', () => {
    const createDto: CreateRoleDto = {
      name: 'New Role',
      description: 'Description',
      permissions: ['1', '2'],
    };

    it('should create a new role', async () => {
      const newRole = { ...mockRole, ...createDto };
      mockHandleRequest.mockResolvedValueOnce(newRole);

      const result = await service.createRole(createDto);

      expect(result).toEqual(newRole);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
      expect(mockHandleRequest).toHaveBeenCalledWith(expect.any(Promise));
    });

    it('should handle creation failure', async () => {
      mockHandleRequest.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(service.createRole(createDto)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateRole', () => {
    const updateDto: UpdateRoleDto = {
      name: 'Updated Role',
      description: 'Updated Description',
      permissions: ['1', '2', '3'],
    };

    it('should update a non-system role', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRole) // getRole
        .mockResolvedValueOnce({ ...mockRole, ...updateDto }); // updateRole

      const result = await service.updateRole('1', updateDto);

      expect(result).toEqual({ ...mockRole, ...updateDto });
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });

    it('should not update system roles', async () => {
      mockHandleRequest.mockResolvedValueOnce({ ...mockRole, isSystem: true });

      await expect(service.updateRole('1', updateDto)).rejects.toThrow('Cannot modify system roles');
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle update failure', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRole) // getRole
        .mockRejectedValueOnce(new Error('Update failed')); // updateRole

      await expect(service.updateRole('1', updateDto)).rejects.toThrow('Update failed');
    });
  });

  describe('updateRolePermissions', () => {
    const newPermissions = ['1', '2', '3'];

    it('should update permissions for non-system role', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRole) // getRole
        .mockResolvedValueOnce(undefined); // updatePermissions

      await service.updateRolePermissions('1', newPermissions);

      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });

    it('should not update system role permissions', async () => {
      mockHandleRequest.mockResolvedValueOnce({ ...mockRole, isSystem: true });

      await expect(service.updateRolePermissions('1', newPermissions))
        .rejects.toThrow('Cannot modify system role permissions');
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle permission update failure', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRole) // getRole
        .mockRejectedValueOnce(new Error('Permission update failed')); // updatePermissions

      await expect(service.updateRolePermissions('1', newPermissions))
        .rejects.toThrow('Permission update failed');
    });
  });

  describe('updateRoleOrder', () => {
    const mockRoles: Role[] = [
      mockRole,
      { ...mockRole, id: '2', name: 'Role 2', isSystem: true, sortOrder: 2 },
    ];

    const updates = [
      { roleId: '1', sortOrder: 2 },
      { roleId: '2', sortOrder: 1 },
    ];

    it('should update order for non-system roles only', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRoles) // getRoles
        .mockResolvedValueOnce(undefined); // updatePosition

      await service.updateRoleOrder(updates);

      // Should only call updatePosition once for the non-system role
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle order update failure', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRoles) // getRoles
        .mockRejectedValueOnce(new Error('Order update failed')); // updatePosition

      await expect(service.updateRoleOrder(updates)).rejects.toThrow('Order update failed');
    });
  });

  describe('deleteRole', () => {
    it('should delete a non-system role', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRole) // getRole
        .mockResolvedValueOnce(undefined); // deleteRole

      await service.deleteRole('1');

      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });

    it('should not delete system roles', async () => {
      mockHandleRequest.mockResolvedValueOnce({ ...mockRole, isSystem: true });

      await expect(service.deleteRole('1')).rejects.toThrow('Cannot delete system roles');
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion failure', async () => {
      mockHandleRequest
        .mockResolvedValueOnce(mockRole) // getRole
        .mockRejectedValueOnce(new Error('Deletion failed')); // deleteRole

      await expect(service.deleteRole('1')).rejects.toThrow('Deletion failed');
    });
  });
}); 