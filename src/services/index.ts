import { BaseService } from './base.service';
import { AuthService } from './auth.service';
import { PeopleService } from './people.service';
import { PermissionsService } from './permissions.service';

export interface Services {
  auth: AuthService;
  people: PeopleService;
  permissions: PermissionsService;
}

class ServiceRegistry {
  private static instance: ServiceRegistry;
  
  readonly auth: AuthService;
  readonly people: PeopleService;
  readonly permissions: PermissionsService;

  private constructor() {
    this.auth = new AuthService();
    this.people = new PeopleService();
    this.permissions = new PermissionsService();
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
}

export const getServices = (): Services => ServiceRegistry.getInstance(); 