# Permission System

## Core Implementation
- Location: `src/services/permissions.service.ts`
- Uses bitfield-based permissions with Decimal.js
- 5-minute TTL caching for both dashboard and checks
- Category-based organization
- System role protection

## Key Components

### PermissionService
- Singleton pattern
- Caches with 5min TTL
- Bitfield calculations
- Permission discovery

### Types
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

## Bitwise Operations
- Uses Decimal.js for precision
- Each permission is a bit position
- Permission ID maps to bit position
- Bitfield represents granted permissions
- Example:
  ```
  Permission ID 1 = bit position 1 = binary 10 (decimal 2)
  Binary 3 (11) has bit 1 set -> hasPermission('1', '3') = true
  Binary 1 (01) has bit 1 unset -> hasPermission('1', '1') = false
  ```

## Caching Strategy
- Dashboard cache: 5min TTL
- Permission check cache: 5min TTL
- Automatic cache invalidation
- Cache initialization checks
- Separate caches for different operations

## Testing Requirements
1. Must preserve all test cases:
   - Bitwise operations
   - Cache management
   - Permission checks
   - Edge cases

2. Test Categories:
   - Singleton behavior
   - Cache management
   - Permission checks
   - Bitwise operations
   - Concurrent access

3. Required Test Cases:
   - Basic permission checks
   - Cache TTL behavior
   - Invalid inputs
   - Large numbers
   - System roles
   - Deprecated permissions 