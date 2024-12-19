# BAWES ERP Frontend Architecture

## Authentication & Authorization

### Overview
The system implements a secure authentication and authorization system using JWT tokens and role-based access control (RBAC).

### Components

#### 1. API Integration (`src/lib/api.ts`)
- Handles API configuration and token management
- Provides utilities for token storage and refresh
- Implements higher-order function for automatic token refresh handling

#### 2. Authentication Hook (`src/hooks/use-auth.ts`)
- Manages authentication state
- Provides login/logout functionality
- Handles user profile information

#### 3. Middleware (`src/middleware.ts`)
- Protects dashboard routes
- Handles authentication redirects
- Manages token validation

#### 4. Debug Panel (`src/components/dashboard/debug-panel.tsx`)
- Shows current JWT token information
- Displays user permissions
- Helps with debugging authentication state

### Authentication Flow

1. **Login**
   - User submits credentials
   - Server returns JWT token
   - Token is stored in localStorage
   - User profile is fetched

2. **Token Refresh**
   - Automatic handling of expired tokens
   - Redirect to login on authentication failures
   - Maintains session persistence

3. **Protected Routes**
   - Middleware checks token presence
   - Redirects unauthorized access
   - Maintains security boundaries

### Role-Based Access Control

1. **Permissions**
   - Granular permission system
   - Category-based organization
   - Clear permission descriptions

2. **Roles**
   - Role management interface
   - Permission assignment
   - Visual permission matrix

## Dashboard Implementation

### Components

1. **Layout (`src/app/dashboard/layout.tsx`)**
   - Consistent dashboard structure
   - Navigation sidebar
   - Header with user information

2. **People Management (`src/app/dashboard/people/page.tsx`)**
   - User listing and management
   - Role assignment
   - Account status control

3. **Roles & Permissions (`src/app/dashboard/roles/page.tsx`)**
   - Role creation and management
   - Permission assignment interface
   - Visual permission matrix

## SDK Integration

### Overview
The frontend integrates with the BAWES ERP API using a centralized SDK configuration in `src/lib/sdk-config.ts`. This provides:

1. **Token Management**
   - Automatic token handling
   - Built-in token refresh
   - Authorization header management

2. **Error Handling**
   - 401 error handling
   - Token expiry management
   - Automatic retries

3. **Configuration**
   - Centralized SDK setup
   - Environment-based configuration
   - Type-safe API access

### SDK Configuration
```typescript
// src/lib/sdk-config.ts
export const sdkConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL,
    baseOptions: {
        headers: {
            'Content-Type': 'application/json',
        }
    },
    accessToken: () => {
        const token = Cookies.get('accessToken');
        if (!token) throw new Error('No access token available');
        return token; // SDK adds 'Bearer ' prefix automatically
    }
});
```

### Usage
```typescript
// Correct usage
import { sdkConfig } from '@/lib/sdk-config';
const api = new SomeApi(sdkConfig);

// API calls will automatically:
// 1. Include the current token
// 2. Handle token refresh
// 3. Retry failed requests
// 4. Handle 401 errors
```

## Best Practices

1. **Security**
   - Token storage in localStorage
   - Protected route middleware
   - Automatic token refresh

2. **State Management**
   - React hooks for state
   - Centralized auth management
   - Consistent error handling

3. **UI/UX**
   - Shadcn UI components
   - Responsive design
   - Clear feedback mechanisms

4. **Code Organization**
   - Feature-based directory structure
   - Shared components
   - Clear separation of concerns

## Architecture Documentation

### Authentication Flow

#### Token Handling
- Access tokens and refresh tokens are stored in cookies
- Token expiry is checked before each API request
- The SDK configuration handles token management centrally
- Bearer tokens are automatically added to API requests

#### SDK Configuration
```typescript
// Correct way to configure SDK
const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL,
    baseOptions: {
        headers: {
            'Content-Type': 'application/json',
        }
    },
    accessToken: () => {
        const token = Cookies.get('accessToken');
        if (!token) throw new Error('No access token available');
        return token; // SDK adds 'Bearer ' prefix automatically
    }
});
```

#### Best Practices
1. Always initialize API instances with the shared SDK configuration
2. Handle 401 errors by redirecting to login
3. Provide proper loading and error states in components
4. Add null checks for API response data
5. Use the debug panel to verify token state

### Component Guidelines

#### Data Fetching Components
```typescript
// Template for components that fetch data
const [data, setData] = useState<DataType[]>([]);  // Initialize as empty array
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
        try {
            const response = await api.getData();
            if (isMounted) {
                setData(response.data || []);  // Provide default value
                setError(null);
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                router.push('/auth/login');
                return;
            }
            setError(error.message || "An error occurred");
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };

    fetchData();
    return () => { isMounted = false; };
}, []);
```

#### Error Handling
1. Always provide user-friendly error messages
2. Handle 401 errors consistently across components
3. Use the toast system for temporary notifications
4. Show loading states during data fetching
5. Provide fallback UI for error states

### SDK Usage Guidelines

#### Creating API Instances
```typescript
// Correct: Use shared configuration
import { sdkConfig } from '@/lib/sdk-config';
const api = new SomeApi(sdkConfig);

// Incorrect: Don't create new configuration per request
const config = new Configuration({ ... });  // Avoid this
```

#### Token Management
1. Use the shared SDK configuration for token handling
2. Don't manually add 'Bearer ' prefix (SDK handles this)
3. Always handle token expiry and refresh
4. Use the debug panel to verify token state

#### Error Handling
1. Check for 401 errors and redirect to login
2. Provide meaningful error messages
3. Handle network errors gracefully
4. Log errors for debugging

### Development Guidelines

#### State Management
1. Initialize state with proper types and default values
2. Handle loading and error states
3. Clean up effects with isMounted flag
4. Provide fallback UI for all states

#### Component Structure
1. Add proper loading states
2. Handle error cases
3. Show empty states
4. Add proper type definitions
5. Use proper null checks