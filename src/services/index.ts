import { BaseService } from './base.service';
import { AuthService } from './auth.service';
import { PeopleService } from './people.service';
import { PermissionsService } from './permissions.service';
import { RoleService } from './role.service';
import { JwtService } from './jwt.service';

/**
 * Interface defining all available services in the application
 * Used for dependency injection and service access
 * 
 * @interface Services
 */
export interface Services {
  /** Authentication and user session service */
  auth: AuthService;
  /** People management service */
  people: PeopleService;
  /** Permissions management service */
  permissions: PermissionsService;
  /** Role management service */
  roles: RoleService;
  /** JWT token management service */
  jwt: JwtService;
}

/**
 * Singleton registry that manages service instances
 * Ensures only one instance of each service exists throughout the application
 * 
 * @example
 * ```typescript
 * // Get service instances
 * const services = ServiceRegistry.getInstance();
 * 
 * // Access specific service
 * const authService = services.auth;
 * ```
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  
  /** Authentication service instance */
  readonly auth: AuthService;
  /** People management service instance */
  readonly people: PeopleService;
  /** Permissions management service instance */
  readonly permissions: PermissionsService;
  /** Role management service instance */
  readonly roles: RoleService;
  /** JWT token management service */
  readonly jwt: JwtService;

  /**
   * Private constructor to prevent direct instantiation
   * Initializes all service instances
   * @private
   */
  private constructor() {
    // Initialize JWT service first
    this.jwt = new JwtService();

    // Initialize other services
    this.auth = new AuthService();
    this.people = new PeopleService();
    this.permissions = new PermissionsService();
    this.roles = new RoleService();

    // Expose registry to window for testing
    if (process.env.NODE_ENV === 'test') {
      (window as any).serviceRegistry = ServiceRegistry;
    }
  }

  /**
   * Gets the singleton instance of the service registry
   * Creates a new instance if one doesn't exist
   * 
   * @returns {ServiceRegistry} The singleton service registry instance
   */
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
}

/**
 * Helper function to get access to all application services
 * Use this function to access services throughout the application
 * 
 * @returns {Services} Object containing all service instances
 * 
 * @example
 * ```typescript
 * // Get all services
 * const services = getServices();
 * 
 * // Use specific service
 * await services.auth.login({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 * ```
 */
export const getServices = (): Services => ServiceRegistry.getInstance(); 