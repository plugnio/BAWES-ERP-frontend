import { Decimal } from 'decimal.js';
import { BaseService } from './base.service';
import type { AxiosResponse } from 'axios';

/**
 * Permission interface representing a single permission
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  deprecated?: boolean;
  category?: string;
  bitfield: string;
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
 * Dashboard data containing permission categories
 */
export interface PermissionDashboard {
  categories: PermissionCategory[];
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

  constructor() {
    super();
    // Initialize cache if not already initialized
    if (!this.permissionCache) {
      this.permissionCache = new Map<string, CacheEntry>();
    }
  }

  /**
   * Fetches the permission dashboard data
   */
  async getDashboard(): Promise<PermissionDashboard> {
    const response = await this.client.permissions.permissionManagementControllerGetPermissionDashboard();
    return (response as unknown as AxiosResponse<PermissionDashboard>).data;
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
   * Clears the permission cache
   */
  clearCache(): void {
    if (this.permissionCache) {
      this.permissionCache.clear();
    } else {
      this.permissionCache = new Map<string, CacheEntry>();
    }
  }
} 