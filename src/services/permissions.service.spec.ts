import { PermissionsService } from './permissions.service';
import { BaseService } from './base.service';
import type { PermissionDashboard } from './permissions.service';

jest.mock('./base.service', () => {
  return {
    BaseService: jest.fn().mockImplementation(() => ({
      handleRequest: jest.fn(async (promise) => await Promise.resolve(promise)),
      client: {
        permissions: {
          permissionControllerGetPermissionDashboard: jest.fn(() => Promise.resolve({})),
        },
      },
    })),
  };
});

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockHandleRequest: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockHandleRequest = jest.fn(async (promise) => await Promise.resolve(promise));
    (BaseService as jest.Mock).mockImplementation(() => ({
      handleRequest: mockHandleRequest,
      client: {
        permissions: {
          permissionControllerGetPermissionDashboard: jest.fn(() => Promise.resolve({})),
        },
      },
    }));

    service = new PermissionsService();
    Object.setPrototypeOf(service, {
      ...Object.getPrototypeOf(service),
      getDashboard: PermissionsService.prototype.getDashboard,
      hasPermission: PermissionsService.prototype.hasPermission,
      clearCache: PermissionsService.prototype.clearCache,
      clearDashboardCache: PermissionsService.prototype.clearDashboardCache,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('getDashboard', () => {
    const mockDashboard: PermissionDashboard = {
      categories: [
        {
          name: 'Category 1',
          permissions: [
            {
              id: '1',
              name: 'Permission 1',
              description: 'Description 1',
              category: 'Category 1',
              isDeprecated: false,
              sortOrder: 1,
              bitfield: '1',
            },
          ],
        },
      ],
      roles: [],
      stats: {
        totalPermissions: 1,
        totalRoles: 0,
        systemRoles: 0,
      },
    };

    it('should fetch dashboard data when cache is empty', async () => {
      mockHandleRequest.mockResolvedValueOnce(mockDashboard);

      const result = await service.getDashboard();

      expect(result).toEqual(mockDashboard);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
      expect(mockHandleRequest).toHaveBeenCalledWith(expect.any(Promise));
    });

    it('should return cached data when within TTL', async () => {
      mockHandleRequest.mockResolvedValueOnce(mockDashboard);

      // First call should fetch
      await service.getDashboard();
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const secondResult = await service.getDashboard();
      expect(secondResult).toEqual(mockDashboard);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache after TTL expires', async () => {
      mockHandleRequest.mockResolvedValue(mockDashboard);

      // First call should fetch
      await service.getDashboard();
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);

      // Fast forward time past TTL (5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1);

      // Second call should fetch again
      await service.getDashboard();
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasPermission', () => {
    it('should correctly identify set permissions', () => {
      // Permission ID 1 = bit position 1 = binary 10 (decimal 2)
      // Binary 3 (11) has bit 1 set
      const result = service.hasPermission('1', '3');
      expect(result).toBe(true);
    });

    it('should correctly identify unset permissions', () => {
      // Binary 1 (01) has bit 1 unset
      const result = service.hasPermission('1', '1');
      expect(result).toBe(false);
    });

    it('should cache permission check results', () => {
      const permId = '1';
      const bits = '3';  // Binary 11 has bit 1 set

      // First call should calculate
      const result1 = service.hasPermission(permId, bits);
      expect(result1).toBe(true);

      // Second call should use cache
      const result2 = service.hasPermission(permId, bits);
      expect(result2).toBe(true);
    });

    it('should handle invalid permission ID gracefully', () => {
      const result = service.hasPermission('invalid', '7');
      expect(result).toBe(false);
    });

    it('should handle invalid bitfield gracefully', () => {
      const result = service.hasPermission('2', 'not-a-number');
      expect(result).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear all caches', async () => {
      mockHandleRequest.mockResolvedValue({});

      // Populate caches
      await service.getDashboard();
      service.hasPermission('1', '3');  // Binary 11 has bit 1 set

      // Clear caches
      service.clearCache();

      // Should make new request after cache clear
      await service.getDashboard();
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });

    it('should clear only dashboard cache', async () => {
      mockHandleRequest.mockResolvedValue({});

      // Populate caches
      await service.getDashboard();
      service.hasPermission('1', '3');  // Binary 11 has bit 1 set

      // Clear only dashboard cache
      service.clearDashboardCache();

      // Should make new request for dashboard
      await service.getDashboard();
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);

      // Permission cache should still work
      const result = service.hasPermission('1', '3');  // Binary 11 has bit 1 set
      expect(result).toBe(true);
    });
  });
}); 