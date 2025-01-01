# BAWES ERP Frontend Knowledge Base

## System Architecture

### Authentication & Authorization
- JWT token-based authentication
- Tokens stored in cookies (not localStorage)
- Automatic token refresh mechanism
- Protected routes via middleware
- Debug panel for token/permission inspection

### SDK Integration
- Centralized configuration in `src/lib/sdk/config.ts`
- Auto-generated from OpenAPI/Swagger specs
- Built-in token management and refresh
- Type-safe API access
- Standardized error handling

### Component Architecture
- Feature-based directory structure
- Shared components in `src/components/ui`
- Shadcn UI design system integration
- TypeScript for type safety
- Clear separation of concerns

## Permission System

### Core Concepts
- Bitfield-based permission calculations
- Uses Decimal.js for precise calculations
- Permission caching with 5-minute TTL
- Role-based access control (RBAC)
- Visual permission matrix UI

### Implementation Details

#### Permission Hook
```typescript
interface UsePermissionsReturn {
  dashboard: PermissionDashboard | null;
  isLoading: boolean;
  error: string | null;
  loadDashboard: () => Promise<void>;
  createRole: (data: CreateRoleDto) => Promise<Role>;
  updateRoleOrder: (updates: RoleOrderUpdate[]) => Promise<void>;
  invalidateCache: () => void;
}

interface UsePermissionCheckReturn {
  hasPermission: (permissionId: string, permissionBits: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}
```

#### Permission Guard
```typescript
interface PermissionGuardProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingUI?: React.ReactNode;
  errorUI?: React.ReactNode;
  requireAll?: boolean;
}
```

#### Role List Component
```typescript
interface RoleListProps {
  roles: Role[];
  onRoleSelect?: (roleId: string) => void;
  selectedRoleId?: string;
  className?: string;
  onCreateRole?: (name: string, description?: string) => Promise<void>;
}

// Features:
// - Drag and drop reordering
// - Role selection
// - Role creation dialog
// - Role description display
// - System role handling
```

#### Role Dialog Component
```typescript
const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleDialogProps {
  onSubmit: (data: RoleFormData) => Promise<void>;
}

// Features:
// - Form validation with Zod
// - Dialog state management
// - Error handling
// - Form reset on success
// - Responsive design
```

#### Permission List Component
```typescript
interface PermissionListProps {
  categories: PermissionCategory[];
  selectedPermissions?: Set<string>;
  onPermissionToggle?: (permissionId: string) => void;
  onBulkSelect?: (categoryName: string, selected: boolean) => void;
  disabled?: boolean;
  className?: string;
}

// Features:
// - Category-based organization
// - Permission search
// - Bulk selection by category
// - Permission descriptions
// - Deprecated permission handling
// - Accordion UI for categories
```

#### Caching Strategy
- Dashboard cache with 5-minute TTL
- Permission check cache with 5-minute TTL
- Debounced loading (100ms)
- Memory-based caching
- Automatic cache invalidation

#### Permission Checks
- Supports single permissions
- Supports multiple permissions
- Can require all or any permissions
- Caches check results
- Handles loading/error states

### Data Fetching Pattern
- Uses `isMounted` flag for cleanup
- Implements loading states
- Handles 401 errors consistently
- Provides fallback UI for errors
- Type-safe response handling

## SDK Implementation

### Base Architecture
- Uses Axios for HTTP requests
- Supports multiple authentication methods
- Handles token management
- Provides type-safe request/response
- Implements error handling

### Configuration
```typescript
// SDK Configuration
export const SDK_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_ERP_API_URL,
  refreshThreshold: 60 * 1000, // 1 minute
};

// Configuration Factory
export const createConfiguration = () => {
  return new Configuration({
    basePath: SDK_CONFIG.baseUrl,
    baseOptions: {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      withCredentials: true,
    },
  });
};
```

### API Client
```typescript
class ApiClient {
  private static instance: ApiClient;
  private configuration: Configuration;
  private accessToken: string | null = null;
  private refreshTokenTimeout?: NodeJS.Timeout;
  private tokenPayload: any | null = null;
  private tokenChangeListeners: Set<(hasToken: boolean) => void>;
  private timeUpdateListeners: Set<(timeToExpiry: number) => void>;
  private currentTimeToExpiry: number = 0;

  // API Services
  private readonly services = {
    auth: AuthenticationApi,
    people: PeopleApi,
    permissions: PermissionManagementApi,
    roles: RoleManagementApi,
  };
}
```

### Token Management
1. Token Storage
   - Access token in memory
   - Refresh token in HTTP-only cookie
   - Token payload caching

2. Token Refresh
   - Automatic refresh 1 minute before expiry
   - Handles refresh failures
   - Maintains refresh promise for concurrent requests

3. Token Events
   - Token change notifications
   - Time to expiry updates
   - Debug logging

### Available APIs
1. Authentication API
   - Login/Logout
   - Profile management
   - Token refresh
   - Email verification

2. People API
   - User CRUD operations
   - Role assignment
   - Account status management
   - Bilingual name support (En/Ar)

3. Permission Management API
   - Role management
   - Permission dashboard
   - Permission assignments
   - Category management

4. Role Management API
   - Role CRUD operations
   - Permission toggling
   - Role position updates
   - Role assignments

### DTOs and Types
```typescript
interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

interface CreateRoleDto {
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
}

interface UpdatePersonDto {
  nameEn?: string;
  nameAr?: string;
  accountStatus?: string;
}
```

### Request Handling
- Automatic parameter validation
- JSON serialization when needed
- Query parameter flattening
- URL path normalization
- Base path configuration

### Error Handling
- Required parameter validation
- HTTP error responses
- Token expiry handling
- Network error handling
- Type-safe error objects

## Best Practices

### Security
- Token storage in cookies only
- Protected route middleware
- Automatic token refresh
- Proper error handling
- Permission validation

### State Management
- React hooks for local state
- Centralized auth management
- Consistent error handling
- Loading state management
- Type-safe state updates

### UI/UX Guidelines
- Shadcn UI components
- Responsive design
- Clear feedback mechanisms
- Loading states
- Error boundaries

### Code Organization
- Feature-based structure
- Shared components
- Clear separation of concerns
- Type safety
- Documentation

## Implementation Status

### Completed
- Authentication system
- Basic role management
- Permission calculations
- Token refresh mechanism
- Component structure

### In Progress
- Permission dependencies
- Role ordering
- Visual permission matrix
- Test coverage
- Documentation updates

### To Be Verified
- Permission caching
- Role dependencies
- System role handling
- Error scenarios
- Edge cases

## Open Questions
1. Verify permission dependency implementation
2. Confirm system role constraints
3. Review caching strategy
4. Validate error handling
5. Check test coverage 

#### Permission Dashboard Component
```typescript
interface PermissionDashboardProps {
  roleId?: string;
  className?: string;
  onPermissionsChange?: (permissions: string[]) => void;
}

// Features:
// - Automatic dashboard loading
// - Role-specific permission management
// - Bulk permission selection
// - Loading states with spinner
// - Error handling with alerts
// - Permission change notifications
// - Permission toggle handling
// - Category-based bulk selection
```

### Permission Service

#### Core Types
```typescript
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isDeprecated: boolean;
  sortOrder: number;
  bitfield: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

interface PermissionDashboard {
  categories: PermissionCategory[];
  roles: Role[];
  stats: {
    totalPermissions: number;
    totalRoles: number;
    systemRoles: number;
  };
}
```

#### Caching Implementation
```typescript
interface CacheEntry {
  value: boolean;
  timestamp: number;
}

class PermissionsService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private permissionCache: Map<string, CacheEntry>;
  private dashboardCache: {
    data: PermissionDashboard | null;
    timestamp: number;
  } | null;
}
```

#### Key Features
1. Role Management
   - Create/Update/Delete roles
   - Role permission updates
   - Role order management
   - Role retrieval by ID

2. Permission Management
   - Dashboard data fetching
   - Permission checking with bitfields
   - Cache management
   - Error handling

3. Caching Strategy
   - Separate caches for permissions and dashboard
   - 5-minute TTL for all caches
   - Automatic cache invalidation
   - Cache initialization checks

4. Bitwise Operations
   - Uses Decimal.js for precision
   - Handles large numbers correctly
   - Efficient permission checking
   - Error handling for calculations

### Role Service

#### Core Types
```typescript
interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
  isSystem: boolean;
  sortOrder: number;
}

interface CreateRoleDto {
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
}

interface UpdateRoleDto {
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
}

interface RoleOrderUpdate {
  roleId: string;
  sortOrder: number;
}
```

#### Key Features
1. Role CRUD Operations
   - Get all roles
   - Get role by ID
   - Create new role
   - Update existing role
   - Delete role (with system role protection)

2. Permission Management
   - Update role permissions
   - System role permission protection
   - Permission validation
   - Bulk permission updates

3. Role Order Management
   - Update role positions
   - System role order protection
   - Batch order updates
   - Sort order validation

4. User Role Management
   - Assign role to user
   - Remove role from user
   - System role assignment protection
   - Role assignment validation

#### System Role Handling
- System roles are protected from:
  - Modification
  - Deletion
  - Permission changes
  - Order changes
- System role checks in all operations
- Error handling for system role operations

### Base Service

#### Implementation
```typescript
export class BaseService {
  protected client = getApiClient();

  constructor() {
    this.client.onTokenChange(() => {
      if ('clearCache' in this) {
        (this as any).clearCache();
      }
    });
  }

  protected async handleRequest<T>(promise: AxiosPromise<T>): Promise<T> {
    try {
      const response = await promise;
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  protected handleError(error: unknown): never {
    debugLog('API Error:', error);
    throw error;
  }
}
```

#### Key Features
1. API Client Management
   - Centralized client instance
   - Token change handling
   - Cache invalidation
   - Debug logging

2. Request Processing
   - Generic request handling
   - Response unwrapping
   - Type-safe responses
   - Error propagation

3. Error Handling
   - Consistent error logging
   - Error propagation
   - Debug information
   - Type safety

4. Cache Management
   - Automatic cache clearing
   - Token-based invalidation
   - Service-specific caching
   - Cache lifecycle hooks
```

### Debug System

#### Configuration
```typescript
export const DEBUG_CONFIG = {
  isEnabled: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
};
```

#### Implementation
```typescript
export const debugLog = (message: string, ...data: unknown[]) => {
  if (DEBUG_CONFIG.isEnabled) {
    console.log(`[DEBUG] ${message}`, ...data);
  }
};
```

#### Key Features
1. Environment Control
   - Enabled via environment variable
   - No debug output in production
   - Type-safe configuration
   - Easy to enable/disable

2. Debug Output
   - Consistent message format
   - Support for additional data
   - No stack traces in output
   - Clean console output

3. Usage Areas
   - API error logging
   - Token management
   - Cache operations
   - Service operations

4. Best Practices
   - Only enabled in development
   - No sensitive data logging
   - Performance impact only when enabled
   - Clean production builds
```

### Testing System

#### Test Structure
```typescript
// App Routes
export const ROUTES = {
  LOGIN: '/auth/login',
  DASHBOARD: '/dashboard',
  ROLES: '/roles'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  ROLES: '/permissions/dashboard',
  CREATE_ROLE: '/roles'
} as const;
```

#### Authentication Fixture
```typescript
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Setup authenticated page
    // Handle environment variables
    // Manage login flow
    // Wait for navigation
    // Provide authenticated page
  }
});
```

#### API Tracking
```typescript
interface ApiCall {
  url: string;
  method: string;
  timestamp: number;
  postData?: string | null;
  headers?: { [key: string]: string };
}

class ApiTracker {
  private calls: ApiCall[] = [];
  
  // Track API calls
  // Analyze call patterns
  // Monitor endpoints
  // Track performance
}
```

#### Test Cases
1. Role Management
   ```typescript
   test('loads and displays roles', async ({ authenticatedPage: page }) => {
     // Navigate to roles page
     // Wait for UI elements
     // Verify role loading
     // Check role count
   });

   test('efficiently handles role creation', async ({ authenticatedPage: page }) => {
     // Navigate to roles page
     // Create new role
     // Fill role details
     // Save and verify
   });
   ```

#### Key Features
1. Authentication
   - Environment-based configuration
   - Automatic login handling
   - Session management
   - Error handling

2. API Monitoring
   - Request tracking
   - Response analysis
   - Performance monitoring
   - Error detection

3. Test Organization
   - Feature-based structure
   - Reusable fixtures
   - Constants management
   - Utility functions

4. Best Practices
   - Clean test data
   - Isolated tests
   - Reliable selectors
   - Performance checks
``` 