'use client';

import React from 'react';
import { usePermissions } from '@/hooks';
import { useServices } from '@/hooks/use-services';
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
import type { Role, RoleOrderUpdate } from '@/services/role.service';

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
    createRole,
  } = usePermissions();
  const { roles: roleService } = useServices();

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

  // Only update roles when dashboard changes
  React.useEffect(() => {
    if (dashboard?.roles) {
      setRoles(dashboard.roles);
    }
  }, [dashboard?.roles]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = roles.findIndex((role) => role.id === active.id);
      const newIndex = roles.findIndex((role) => role.id === over.id);

      const newRoles = arrayMove(roles, oldIndex, newIndex);
      setRoles(newRoles);

      try {
        setUpdateError(null);
        await updateRoleOrder(
          newRoles.map((role, index) => ({
            roleId: role.id,
            sortOrder: index,
          }))
        );
      } catch (error) {
        console.error('Failed to update role order:', error);
        setUpdateError('Failed to update role order. Please try again.');
      }
    }
  };

  const handlePermissionsChange = async (permissions: string[]) => {
    if (!selectedRoleId) return;

    try {
      setUpdateError(null);
      await roleService.updateRolePermissions(selectedRoleId, permissions);
      // Refresh dashboard after updating permissions
      await loadDashboard();
    } catch (error) {
      console.error('Failed to update permissions:', error);
      setUpdateError('Failed to update permissions. Please try again.');
    }
  };

  const handleCreateRole = async (name: string, description?: string) => {
    try {
      setUpdateError(null);
      await createRole({ name, description });
      // Refresh dashboard after creating role
      await loadDashboard();
    } catch (error) {
      console.error('Failed to create role:', error);
      setUpdateError('Failed to create role. Please try again.');
    }
  };

  const handleRefresh = React.useCallback(async () => {
    try {
      setUpdateError(null);
      await loadDashboard();
    } catch (error) {
      console.error('Failed to refresh roles:', error);
      setUpdateError('Failed to refresh roles. Please try again.');
    }
  }, [loadDashboard]);

  return (
    <div className={className}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {updateError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
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
                onCreateRole={handleCreateRole}
                onRefresh={handleRefresh}
              />
            </SortableContext>
          </DndContext>
          {selectedRoleId && (
            <PermissionDashboard
              role={roles.find(r => r.id === selectedRoleId)!}
              onPermissionsChange={handlePermissionsChange}
            />
          )}
        </div>
      )}
    </div>
  );
} 