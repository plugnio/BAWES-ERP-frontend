'use client';

import React from 'react';
import { usePermissions } from '@/hooks';
import { LoadingSpinner } from '@/components/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { RoleList } from './role-list';
import { PermissionDashboard } from './permission-dashboard';
import type { Role } from '@/services/permissions.service';

interface PermissionExplorerProps {
  className?: string;
}

export function PermissionExplorer({ className }: PermissionExplorerProps) {
  const {
    dashboard,
    isLoading,
    error,
    loadDashboard,
    updateRoleOrder,
    updateRolePermissions,
  } = usePermissions();

  const [selectedRoleId, setSelectedRoleId] = React.useState<string | undefined>();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  // Support mouse, touch, and keyboard interactions
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => {
    if (dashboard) {
      // Extract and sort roles by sortOrder
      const sortedRoles = [...dashboard.roles].sort((a, b) => 
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );
      setRoles(sortedRoles);
    }
  }, [dashboard]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = roles.findIndex(role => role.id === active.id);
    const newIndex = roles.findIndex(role => role.id === over.id);

    // Update local state immediately for smooth UI
    const newRoles = arrayMove(roles, oldIndex, newIndex);
    
    // Update sort orders
    const updates = newRoles.map((role, index) => ({
      ...role,
      sortOrder: index,
    }));

    setRoles(updates);

    // Update on backend
    try {
      setUpdateError(null);
      await updateRoleOrder(
        updates.map(role => ({
          roleId: role.id,
          sortOrder: role.sortOrder ?? 0,
        }))
      );
    } catch (err) {
      // Rollback on error
      setRoles(roles);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update role order');
    }
  };

  const handlePermissionsChange = async (permissions: string[]) => {
    if (!selectedRoleId) return;

    try {
      setUpdateError(null);
      await updateRolePermissions(selectedRoleId, permissions);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || updateError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || updateError}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={roles.map(role => role.id)}
            strategy={verticalListSortingStrategy}
          >
            <RoleList
              roles={roles}
              selectedRoleId={selectedRoleId}
              onRoleSelect={setSelectedRoleId}
            />
          </SortableContext>
        </DndContext>

        <PermissionDashboard
          roleId={selectedRoleId}
          onPermissionsChange={handlePermissionsChange}
        />
      </div>
    </div>
  );
} 