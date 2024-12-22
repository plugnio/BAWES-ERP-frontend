# RBAC Implementation Plan

## Overview

This document outlines the implementation plan for Role-Based Access Control (RBAC) in the BAWES ERP frontend, using bitfield-based permissions with Decimal.js for precise calculations.

## Directory Structure
```
src/
├── services/
│   ├── base.service.ts                    # Base service class
│   └── permissions/
│       ├── permission.service.ts          # Permission service + types
│       └── permission-manager.ts          # Internal singleton + types
├── components/
│   ├── auth/
│   │   └── AuthGuard.tsx                 # Auth guard + types
│   └── permissions/
│       ├── PermissionGuard.tsx           # Permission guard + types
│       └── discovery/                     # Permission discovery and management
│           ├── PermissionExplorer.tsx     # Main permission discovery interface
│           ├── PermissionList.tsx         # Category-based permission list
│           └── PermissionMatrix.tsx       # Role-permission assignment matrix
└── hooks/
    └── usePermissions.ts                 # Permission hook + types
```

## Implementation Plan

### 1. Core Permission Infrastructure
- [ ] Permission Service Implementation
  - Bitfield calculations using Decimal.js
  - Permission caching with TTL (5 minutes)
  - Permission discovery
  - Type-safe permission checks

### 2. Permission Components
- [ ] Permission Guard Component
  - Single permission checks
  - Multiple permission checks with requireAll option
  - Fallback UI handling
  - Loading state management

### 3. Permission Management UI
- [ ] Permission Explorer Component
  - Role selection interface with drag-and-drop sorting (@dnd-kit/core)
  - Category-based permission viewing
  - Role-permission assignment matrix
  - Permission toggle functionality
  - Role order persistence using sortOrder field

### 4. Permission Discovery
- [ ] Permission List Component
  - Category grouping
  - Permission details display (code, name, description)
  - Permission toggle integration
  - Loading states

## Technical Requirements

### Permission Service
```typescript
interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  bitfield: string;
  isDeprecated: boolean;
}

interface PermissionCategory {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  sortOrder: number;
  permissions: Permission[];
}

interface PermissionDashboard {
  roles: Role[];
  categories: PermissionCategory[];
}
```

### Permission Explorer
```typescript
interface PermissionExplorerProps {
  roles: Role[];
  categories: PermissionCategory[];
}

function PermissionExplorer({ roles, categories }: PermissionExplorerProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="permission-explorer">
      <div className="permission-explorer__roles">
        <h2>Roles</h2>
        <RoleList
          roles={roles}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
        />
      </div>

      <div className="permission-explorer__permissions">
        <h2>Permissions by Category</h2>
        <PermissionList
          categories={categories}
          selectedRole={selectedRole}
        />
      </div>

      {selectedRole && (
        <div className="permission-explorer__matrix">
          <h2>Permission Matrix</h2>
          <PermissionMatrix
            role={selectedRole}
            categories={categories}
          />
        </div>
      )}
    </div>
  );
}
```

### Permission Matrix
```typescript
interface PermissionMatrixProps {
  role: Role;
  categories: PermissionCategory[];
}

function PermissionMatrix({ role, categories }: PermissionMatrixProps) {
  const [updating, setUpdating] = useState(false);
  const permissionService = usePermissionService();

  const handleTogglePermission = async (permission: Permission) => {
    try {
      setUpdating(true);
      const hasPermission = role.permissions.some(p => p.id === permission.id);
      const updatedPermissions = hasPermission
        ? role.permissions.filter(p => p.id !== permission.id)
        : [...role.permissions, permission];

      await permissionService.updateRole(role.id, {
        ...role,
        permissions: updatedPermissions,
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="permission-matrix">
      {categories.map(category => (
        <div key={category.id} className="permission-matrix__category">
          <h4>{category.name}</h4>
          <div className="permission-matrix__grid">
            {category.permissions.map(permission => (
              <div key={permission.id} className="permission-matrix__item">
                <label>
                  <input
                    type="checkbox"
                    checked={role.permissions.some(p => p.id === permission.id)}
                    onChange={() => handleTogglePermission(permission)}
                    disabled={updating || permission.isDeprecated}
                  />
                  {permission.name}
                </label>
                <small>{permission.code}</small>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Role List with Sorting
```typescript
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

interface RoleListProps {
  roles: Role[];
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
}

function SortableRole({ role, isSelected, onSelect }: {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "p-4 border rounded-lg",
        "hover:border-primary/50 transition-colors",
        isSelected && "border-primary",
        isDragging && "opacity-50",
        role.isSystem && "border-secondary/50"
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <h3 className="font-medium">{role.name}</h3>
          <p className="text-sm text-muted-foreground">{role.description}</p>
        </div>
        {role.isSystem && (
          <Badge variant="secondary">System</Badge>
        )}
      </div>
    </div>
  );
}

function RoleList({ roles, selectedRole, onSelectRole }: RoleListProps) {
  const [items, setItems] = useState(roles);
  const permissionService = usePermissionService();

  // Support mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    
    // Update sort orders
    const updates = newItems.map((role, index) => ({
      ...role,
      sortOrder: index,
    }));

    setItems(updates);

    // Update on backend
    try {
      await permissionService.updateRoleOrder(
        updates.map(role => ({
          roleId: role.id,
          sortOrder: role.sortOrder,
        }))
      );
    } catch (error) {
      // Rollback on error
      setItems(roles);
      throw error;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(role => role.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((role) => (
            <SortableRole
              key={role.id}
              role={role}
              isSelected={selectedRole?.id === role.id}
              onSelect={() => onSelectRole(role)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

## Implementation Priorities

### Phase 1: Core Infrastructure
1. Permission Service with Decimal.js
2. Permission Manager singleton
3. Permission caching system

### Phase 2: Components
1. Permission Guard component
2. Permission Explorer component
3. Permission List component
4. Permission Matrix component

### Phase 3: Integration
1. Role-permission management
2. Permission discovery interface
3. Permission toggle functionality

## Next Steps

1. **Core Implementation**
   - Set up Permission Service
   - Implement Permission Manager
   - Create usePermissions hook

2. **Component Development**
   - Build Permission Guard
   - Create Permission Explorer
   - Implement Permission Matrix

3. **Testing & Validation**
   - Unit test permission calculations
   - Integration test permission checks
   - Test permission toggle functionality