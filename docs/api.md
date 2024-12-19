# API Documentation

## SDK Overview

The BAWES ERP API SDK provides TypeScript/JavaScript bindings for interacting with the backend API. The SDK is auto-generated from OpenAPI/Swagger specifications.

## Available APIs

### Authentication API

```typescript
import { AuthenticationApi } from '@bawes/erp-api-sdk';

// Available methods
authControllerLogin(loginDto: LoginDto): Promise<LoginResponse>
authControllerLogout(): Promise<void>
authControllerGetProfile(): Promise<ProfileResponse>
```

#### Login
- Method: `authControllerLogin`
- Purpose: Authenticate user and get access token
- Parameters:
  ```typescript
  interface LoginDto {
    email: string;
    password: string;
  }
  ```
- Response:
  ```typescript
  interface LoginResponse {
    access_token: string;
  }
  ```

#### Logout
- Method: `authControllerLogout`
- Purpose: Invalidate current session
- Parameters: None
- Response: Void

#### Get Profile
- Method: `authControllerGetProfile`
- Purpose: Get current user profile
- Parameters: None
- Response:
  ```typescript
  interface ProfileResponse {
    id: string;
    nameEn: string;
    nameAr: string;
    accountStatus: string;
  }
  ```

### People API

```typescript
import { PeopleApi } from '@bawes/erp-api-sdk';

// Available methods
personControllerCreate(createPersonDto: CreatePersonDto): Promise<Person>
personControllerFindAll(): Promise<Person[]>
personControllerFindOne(id: string): Promise<Person>
personControllerUpdate(id: string, updatePersonDto: UpdatePersonDto): Promise<Person>
personControllerRemove(id: string): Promise<void>
```

#### Create Person
- Method: `personControllerCreate`
- Purpose: Create new user
- Parameters:
  ```typescript
  interface CreatePersonDto {
    nameEn?: string;
    nameAr?: string;
    passwordHash: string;
    accountStatus: string;
  }
  ```

#### List People
- Method: `personControllerFindAll`
- Purpose: Get all users
- Parameters: None
- Response: Array of Person objects

#### Get Person
- Method: `personControllerFindOne`
- Purpose: Get user by ID
- Parameters: id (string)
- Response: Person object

#### Update Person
- Method: `personControllerUpdate`
- Purpose: Update user details
- Parameters:
  - id: string
  - updatePersonDto: UpdatePersonDto

#### Delete Person
- Method: `personControllerRemove`
- Purpose: Soft delete user
- Parameters: id (string)
- Response: Void

### Permission Management API

```typescript
import { PermissionManagementApi } from '@bawes/erp-api-sdk';

// Available methods
permissionManagementControllerCreateRole(createRoleDto: CreateRoleDto): Promise<Role>
permissionManagementControllerGetRole(id: string): Promise<Role>
permissionManagementControllerGetPermissionDashboard(): Promise<PermissionDashboard>
```

#### Create Role
- Method: `permissionManagementControllerCreateRole`
- Purpose: Create new role
- Parameters:
  ```typescript
  interface CreateRoleDto {
    name: string;
    description?: string;
    color?: string;
    permissions?: string[];
  }
  ```

#### Get Role
- Method: `permissionManagementControllerGetRole`
- Purpose: Get role details
- Parameters: id (string)
- Response: Role object

#### Get Permission Dashboard
- Method: `permissionManagementControllerGetPermissionDashboard`
- Purpose: Get roles and permissions overview
- Parameters: None
- Response:
  ```typescript
  interface PermissionDashboard {
    roles: Role[];
    permissionCategories: PermissionCategory[];
  }
  ```

## Using the SDK

### Configuration

```typescript
import { Configuration } from '@bawes/erp-api-sdk';

const config = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL,
  accessToken: getAccessToken() || undefined,
});
```

### Error Handling

The SDK uses Axios for HTTP requests. Errors are thrown as AxiosError instances:

```typescript
try {
  await api.someMethod();
} catch (error) {
  if (error?.response?.status === 401) {
    // Handle unauthorized
  } else if (error?.response?.status === 404) {
    // Handle not found
  } else {
    // Handle other errors
  }
}
```

### Token Refresh

Use the `withTokenRefresh` higher-order function for automatic token refresh:

```typescript
import { withTokenRefresh } from '@/lib/api';

const result = await withTokenRefresh(() => 
  api.someMethod()
);
```

## Best Practices

1. **Configuration Management**
   - Use environment variables for API URL
   - Handle token management centrally
   - Implement proper error handling

2. **Type Safety**
   - Use TypeScript interfaces provided by SDK
   - Validate API responses
   - Handle null/undefined cases

3. **Error Handling**
   - Implement proper error boundaries
   - Use toast notifications for user feedback
   - Log errors appropriately

4. **Performance**
   - Cache responses when appropriate
   - Implement request debouncing
   - Use proper loading states