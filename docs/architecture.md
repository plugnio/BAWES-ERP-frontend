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

The frontend integrates with the BAWES ERP API using the auto-generated SDK:

1. **Configuration**
   - Base URL from environment variables
   - Automatic token injection
   - Error handling

2. **API Clients**
   - `AuthenticationApi` for auth operations
   - `PeopleApi` for user management
   - `PermissionManagementApi` for roles and permissions

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