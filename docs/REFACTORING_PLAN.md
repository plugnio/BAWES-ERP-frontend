# BAWES ERP Frontend Refactoring Plan

## Current State Analysis

After analyzing our implementation against the validated Next.js integration guide:

1. **SDK Integration Issues**
   - Direct SDK instantiation in multiple places
   - Missing centralized API client
   - Inconsistent token management
   - No proper error handling

2. **Architecture Issues**
   - Missing proper service layer
   - No base service pattern
   - Missing permission system
   - Inconsistent API usage

## Phase 1: Project Structure Reorganization

### 1. Complete File Structure
```
src/
├── lib/
│   └── sdk/
│       ├── api-client.ts    # API client implementation
│       └── config.ts        # SDK configuration
├── components/
│   ├── auth/
│   │   ├── AuthGuard.tsx
│   │   ├── LoginForm.tsx
│   │   └── LogoutButton.tsx
│   ├── permissions/
│   │   ├── PermissionGuard.tsx
│   │   └── RoleBasedAccess.tsx
│   ├── person/
│   │   ├── PersonForm.tsx
│   │   ├── PersonList.tsx
│   │   └── PersonDetails.tsx
│   └── ui/
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── services/
│   ├── index.ts            # Service registry
│   ├── base.service.ts     # Base service
│   ├── auth.service.ts     # Auth service
│   └── permissions.service.ts
├── hooks/
│   ├── useServices.ts      # Service hook
│   ├── useAuth.ts         # Auth hook
│   └── usePermissions.ts  # Permissions hook
├── types/
│   ├── api.ts             # API response types
│   ├── auth.ts            # Auth types
│   └── person.ts          # Person entity types
├── middleware.ts          # Auth middleware (to be updated)
└── app/
    ├── (auth)/            # Protected routes
    │   ├── layout.tsx     # Auth layout with guard
    │   ├── dashboard/
    │   │   └── page.tsx
    │   └── person/
    │       ├── page.tsx
    │       ├── [id]/
    │       │   └── page.tsx
    │       └── create/
    │           └── page.tsx
    └── (public)/          # Public routes
        ├── layout.tsx     # Public layout
        ├── page.tsx       # Landing page
        └── login/
            └── page.tsx
```

### 2. Cleanup Requirements
- [ ] Remove old middleware.ts implementation
- [ ] Update to new auth middleware pattern
- [ ] Remove any direct SDK usage from pages
- [ ] Clean up duplicate token management
- [ ] Remove unnecessary route handlers
- [ ] Clean up unused API routes
- [ ] Update tsconfig paths
- [ ] Clean up environment variables

## Phase 2: SDK Integration Layer

### 1. API Client Implementation
```typescript
// lib/sdk/api-client.ts
import {
  Configuration,
  AuthenticationApi,
  PermissionsApi,
  PersonApi
} from '@bawes/erp-api-sdk';

class ApiClient {
  private static instance: ApiClient;
  private configuration: Configuration;
  private accessToken: string | null = null;

  readonly auth: AuthenticationApi;
  readonly permissions: PermissionsApi;
  readonly person: PersonApi;

  private constructor() {
    this.configuration = new Configuration({
      basePath: process.env.NEXT_PUBLIC_API_URL,
      accessToken: () => this.accessToken || ''
    });

    this.auth = new AuthenticationApi(this.configuration);
    this.permissions = new PermissionsApi(this.configuration);
    this.person = new PersonApi(this.configuration);
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }
}
```

### 2. SDK Configuration
```typescript
// lib/sdk/config.ts
export const SDK_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  refreshThreshold: 60 * 1000, // 1 minute before expiry
};
```

## Phase 3: Service Layer Implementation

### 1. Base Service
```typescript
// services/base.service.ts
import { getApiClient } from '@/lib/sdk/api-client';
import type { ApiClient } from '@/lib/sdk/api-client';

export class BaseService {
  protected client: ApiClient;

  constructor() {
    this.client = getApiClient();
  }

  protected handleError(error: any) {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    
    throw error;
  }
}
```

### 2. Service Registry
```typescript
// services/index.ts
import { AuthService } from './auth.service';
import { PermissionsService } from './permissions.service';
import { PersonService } from './person.service';

export class Services {
  private static instance: Services;
  
  readonly auth: AuthService;
  readonly permissions: PermissionsService;
  readonly person: PersonService;

  private constructor() {
    this.auth = new AuthService();
    this.permissions = new PermissionsService();
    this.person = new PersonService();
  }

  static getInstance(): Services {
    if (!Services.instance) {
      Services.instance = new Services();
    }
    return Services.instance;
  }
}

export const getServices = () => Services.getInstance();
```

## Phase 4: Core Features Implementation

### 1. Authentication System
- [ ] Implement proper token management
- [ ] Add automatic token refresh
- [ ] Handle unauthorized errors
- [ ] Implement login/logout flow
- [ ] Update middleware for auth checks

### 2. Permission System
- [ ] Implement permission calculations
- [ ] Create permission guards
- [ ] Add role-based access control
- [ ] Build permission dashboard
- [ ] Add permission-based routing

### 3. Error Handling
- [ ] Add global error boundary
- [ ] Implement service-level error handling
- [ ] Add error logging
- [ ] Create user-friendly error messages

### 4. Loading States
- [ ] Implement loading components
- [ ] Add loading skeletons
- [ ] Handle suspense boundaries
- [ ] Add error states

## Phase 5: Component Implementation

### 1. Auth Components
- [ ] Implement AuthGuard
- [ ] Create LoginForm
- [ ] Add LogoutButton
- [ ] Handle auth redirects

### 2. Permission Components
- [ ] Create PermissionGuard
- [ ] Implement RoleBasedAccess
- [ ] Add permission visualization
- [ ] Build role management UI

### 3. Layout Components
- [ ] Create auth layout
- [ ] Build public layout
- [ ] Add navigation components
- [ ] Implement error boundaries

## Implementation Steps

1. **Project Setup**
   - Update project structure
   - Clean up old files
   - Set up new directories
   - Update configuration

2. **Core Infrastructure**
   - Create API client
   - Set up SDK configuration
   - Implement base service
   - Create service registry

3. **Auth System**
   - Implement auth service
   - Set up token management
   - Create auth components
   - Update middleware

4. **Permission System**
   - Implement permission service
   - Create permission guards
   - Build role management
   - Add access control

5. **UI Layer**
   - Build layouts
   - Create components
   - Add error handling
   - Implement loading states

## Success Metrics

1. **Code Quality**
   - Centralized API access
   - Proper error handling
   - Type safety
   - Clean architecture

2. **User Experience**
   - Fast permission checks
   - Smooth auth flow
   - Clear error messages
   - Proper loading states

3. **Developer Experience**
   - Easy API access
   - Clear patterns
   - Type safety
   - Fast debugging