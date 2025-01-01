# BAWES ERP Frontend Understanding

## Core Systems

### Authentication
- Implementation: JWT-based with cookie storage
- Location: src/lib/sdk/api.ts
- Features:
  - Login/Logout with token management
  - Automatic refresh 1min before expiry
  - Protected route middleware
  - Debug panel for token inspection
- Key Components:
  - ApiClient: Singleton managing tokens
  - AuthGuard: Route protection
  - LoginForm: Authentication UI
- Types:
  ```typescript
  interface TokenResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  }
  ```
- Configuration:
  ```typescript
  export const SDK_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_ERP_API_URL,
    refreshThreshold: 60 * 1000, // 1 minute
  };
  ```

### Permission System
- Implementation: Bitfield-based with Decimal.js
- Location: src/services/permissions.service.ts
- Features:
  - Permission calculations via bitfields
  - 5min TTL caching (dashboard + checks)
  - Category-based organization
  - System role protection
- Key Components:
  - PermissionGuard: Component-level protection
  - PermissionList: Category-based display
  - PermissionDashboard: Management UI
- Types:
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

  interface PermissionGuardProps {
    permission: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    loadingUI?: React.ReactNode;
    errorUI?: React.ReactNode;
    requireAll?: boolean;
  }
  ```

### Role Management
- Implementation: CRUD with system protection
- Location: src/services/role.service.ts
- Features:
  - Role listing and creation
  - Permission assignment
  - Drag-drop reordering
  - System role protection
- Key Components:
  - RoleList: Main management UI
  - RoleDialog: Creation interface
  - SortableRole: Reorder functionality
- Types:
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
- Additional Types:
  ```typescript
  interface RoleListProps {
    roles: Role[];
    onRoleSelect?: (roleId: string) => void;
    selectedRoleId?: string;
    className?: string;
    onCreateRole?: (name: string, description?: string) => Promise<void>;
  }

  interface RoleDialogProps {
    onSubmit: (data: RoleFormData) => Promise<void>;
  }

  const roleSchema = z.object({
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional(),
  });

  type RoleFormData = z.infer<typeof roleSchema>;
  ```

### Base Service Layer
- Location: src/services/base.service.ts
- Implementation:
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
- Features:
  - Centralized error handling
  - Type-safe request processing
  - Automatic cache invalidation
  - Debug integration

### Debug System
- Location: src/lib/debug.ts
- Implementation:
  ```typescript
  export const DEBUG_CONFIG = {
    isEnabled: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  };

  export const debugLog = (message: string, ...data: unknown[]) => {
    if (DEBUG_CONFIG.isEnabled) {
      console.log(`[DEBUG] ${message}`, ...data);
    }
  };
  ```
- Usage:
  - API error logging
  - Token management tracking
  - Cache operations monitoring
  - Performance debugging

## Implemented Features

### Authentication Flow
- Login Page (/auth/login)
  - Email/password validation
  - Token storage in cookies
  - Redirect to dashboard
- Token Management
  - Automatic refresh
  - Debug panel tracking
  - Session persistence
- Implementation Details:
  - Uses HttpOnly cookies
  - Refresh 1 minute before expiry
  - Automatic retry on failure
  - Debug panel integration

### Role Management
- Role List (/roles)
  - View all roles
  - Create new roles
  - Reorder via drag-drop
  - Select for details
- Role Details (/roles/[id])
  - View role info
  - Manage permissions
  - System role handling
- Implementation Details:
  - DnD-kit for reordering
  - Optimistic updates
  - System role protection
  - Cache invalidation

### Permission Management
- Permission Dashboard
  - Category organization
  - Bulk selection
  - Search/filter
  - Permission toggles
- Permission Checks
  - Component-level guards
  - Multiple permission support
  - Caching system
  - Loading states
- Implementation Details:
  - Decimal.js for calculations
  - 5-minute TTL cache
  - Memory-based caching
  - Debounced updates

## Integration Patterns

### SDK Usage
- Backend team maintains SDK
- We receive updates and implement frontend
- Integration points:
  - Authentication flows
  - Role management
  - Permission handling
  - User management
- Implementation:
  - Use SDK types directly
  - Extend with frontend types
  - Maintain type safety
  - Handle all errors

### Component Patterns
- Loading States
  - Spinner during data fetch
  - Skeleton loading where appropriate
  - Error state handling
- Data Management
  - Service layer abstraction
  - Type-safe API calls
  - Error boundary implementation
- UI Patterns
  - Shadcn component usage
  - Responsive design
  - Error feedback
  - Loading indicators
- Implementation Details:
  - isMounted cleanup
  - Error boundaries
  - Loading skeletons
  - Toast notifications

### Testing Approach
- E2E Tests Location: e2e/tests/
- Key Test Areas:
  - Authentication flows
  - Role management
  - Permission handling
- Test Patterns:
  - Auth fixtures
  - API tracking
  - Performance monitoring
- Implementation:
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
    // Analyze patterns
    // Monitor performance
  }
  ```

## System Interactions

### Authentication → Permissions
- Token contains permission bits
- PermissionGuard uses bits for checks
- Cache invalidation on token refresh
- Implementation:
  - Bitfield calculations
  - Cache management
  - Error handling

### Roles → Permissions
- Roles contain permission sets
- Updates trigger cache invalidation
- System role protection enforced
- Implementation:
  - Permission updates
  - Role ordering
  - System protection

### UI → Services
- Components use service layer
- Type-safe API interactions
- Consistent error handling
- Implementation:
  - Service abstraction
  - Error boundaries
  - Loading states

## Current State

### Completed Features
- Authentication system
- Role management
- Permission calculations
- Token refresh
- Component structure
- Basic test coverage

### Active Features
- Role list with reordering
- Permission dashboard
- System role protection
- Test coverage expansion

### Integration Points
- SDK updates from backend
- New feature implementation
- Test coverage maintenance
- Documentation updates 

### Error Handling Patterns
- Service Layer:
  ```typescript
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle unauthorized
      router.push('/auth/login');
    } else if (error.response?.status === 404) {
      // Handle not found
      throw new Error('Resource not found');
    } else {
      // Handle other errors
      debugLog('API Error:', error);
      throw error;
    }
  }
  ```
- Component Layer:
  ```typescript
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await api.getData();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);
  ```

### Cache Invalidation Triggers
- Token Changes:
  ```typescript
  this.client.onTokenChange(() => {
    this.clearCache();
  });
  ```
- Role Updates:
  ```typescript
  async updateRole(roleId: string, dto: UpdateRoleDto): Promise<Role> {
    const result = await this.handleRequest(/* ... */);
    this.clearDashboardCache();
    return result;
  }
  ```
- Permission Changes:
  ```typescript
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    await this.handleRequest(/* ... */);
    this.clearCache(); // Clear both permission and dashboard cache
  }
  ```
- System Events:
  - Route changes
  - User logout
  - Session expiry
  - Error responses

### Test Fixtures
- Authentication:
  ```typescript
  // e2e/fixtures/auth.fixture.ts
  export const test = base.extend({
    authenticatedPage: async ({ page }, use) => {
      // Setup
      await page.goto(`${baseUrl}${ROUTES.LOGIN}`);
      await page.fill('input[name="email"]', process.env.TEST_ADMIN_EMAIL);
      await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      
      // Use the authenticated page
      await use(page);
    }
  });
  ```
- API Tracking:
  ```typescript
  // e2e/utils/api-tracker.ts
  export class ApiTracker {
    private calls: ApiCall[] = [];

    constructor(page: Page) {
      page.on('request', request => {
        if (request.url().includes(apiUrl)) {
          this.recordCall(request);
        }
      });
    }

    recordCall(request: Request) {
      this.calls.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
        postData: request.postData(),
        headers: request.headers()
      });
    }

    getEndpointCounts(): { [key: string]: number } {
      return this.calls.reduce((acc, call) => {
        acc[call.url] = (acc[call.url] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
    }
  }
  ```
- Test Constants:
  ```typescript
  // e2e/tests/constants.ts
  export const ROUTES = {
    LOGIN: '/auth/login',
    DASHBOARD: '/dashboard',
    ROLES: '/roles'
  } as const;

  export const API_ENDPOINTS = {
    ROLES: '/permissions/dashboard',
    CREATE_ROLE: '/roles'
  } as const;
  ``` 