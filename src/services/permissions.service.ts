import { Decimal } from 'decimal.js';
import { BaseService } from './base.service';
import type { AxiosPromise } from 'axios';
import type { Role } from './role.service';

/**
 * Permission interface representing a single permission
 */
export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  isDeprecated: boolean;
  sortOrder: number;
  bitfield: string;
  createdAt: string;
  updatedAt: string;
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
   * Fetches the permission dashboard data
   */
  public async getDashboard(): Promise<PermissionDashboard> {
    // Check cache first
    if (this.dashboardCache && Date.now() - this.dashboardCache.timestamp < PermissionsService.CACHE_TTL) {
      return this.dashboardCache.data!;
    }

    const promise = this.client.permissions.permissionControllerGetPermissionDashboard() as unknown as AxiosPromise<PermissionDashboard>;
    const response = await this.handleRequest(promise);
    
    // Cache the result
    this.dashboardCache = {
      data: response,
      timestamp: Date.now(),
    };

    return response;
  }

  /**
   * Checks if a user has a specific permission
   */
  public hasPermission(permissionId: string, permissionBits: string): boolean {
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
      // Validate inputs
      const permId = parseInt(permissionId, 10);
      if (isNaN(permId) || permId < 0) {
        return false;
      }

      // Validate permissionBits is a valid number
      if (!/^\d+$/.test(permissionBits)) {
        return false;
      }

      // Convert inputs to Decimal.js for precise calculations
      const userBits = new Decimal(permissionBits);
      const permissionBitfield = new Decimal(2).pow(permId);

      // Check if the bit is set by using division and modulo
      // First divide by the bit position to shift right
      // Then check if the least significant bit is 1
      const shifted = userBits.dividedBy(permissionBitfield).floor();
      const result = shifted.mod(2).eq(1);

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
  public clearCache(): void {
    this.permissionCache = new Map<string, CacheEntry>();
    this.dashboardCache = null;
  }

  /**
   * Clears the dashboard cache
   */
  public clearDashboardCache(): void {
    this.dashboardCache = null;
  }
} 