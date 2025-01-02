'use client';

import React from 'react';
import { usePermissions } from '@/hooks';
import { LoadingSpinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { Role } from '@/services/role.service';
import { RoleDialog } from './role-dialog';
import { useServices } from '@/hooks/use-services';
import { toast } from '@/components/ui/use-toast';

interface RoleListProps {
  roles: Role[];
  onRoleSelect?: (roleId: string) => void;
  selectedRoleId?: string;
  className?: string;
  onCreateRole?: (name: string, description?: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

function SortableRole({ role, isSelected, onSelect, onDelete }: {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onDelete();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete role'
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      <Button
        variant={isSelected ? 'default' : 'outline'}
        className="w-full justify-start group"
        onClick={onSelect}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="text-left pl-8 flex-1">
          <div className="font-medium">{role.name}</div>
          {role.description && (
            <div className="text-sm text-muted-foreground">
              {role.description}
            </div>
          )}
        </div>
        {!role.isSystem && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </Button>
    </div>
  );
}

export function RoleList({
  roles,
  onRoleSelect,
  selectedRoleId,
  className,
  onCreateRole,
  onRefresh,
}: RoleListProps) {
  const { roles: roleService } = useServices();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCreateRole = async ({ name, description }: { name: string; description?: string }) => {
    if (onCreateRole) {
      await onCreateRole(name, description);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      setIsLoading(true);
      await roleService.deleteRole(roleId);
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle role="heading" aria-level={2}>Roles</CardTitle>
            <CardDescription>Drag to reorder roles and click to manage permissions</CardDescription>
          </div>
          {onCreateRole && <RoleDialog onSubmit={handleCreateRole} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {roles.map((role) => (
          <SortableRole
            key={role.id}
            role={role}
            isSelected={selectedRoleId === role.id}
            onSelect={() => onRoleSelect?.(role.id)}
            onDelete={() => handleDeleteRole(role.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
} 