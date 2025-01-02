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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RoleListProps {
  roles: Role[];
  onRoleSelect?: (roleId: string) => void;
  selectedRoleId?: string;
  className?: string;
  onCreateRole?: (name: string, description?: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

interface SortableRoleProps {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

function SortableRole({ role, isSelected, onSelect, onDelete }: SortableRoleProps) {
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
      data-testid="role-item"
      className={cn(
        "p-4 border rounded-lg cursor-pointer",
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
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{role.name}</h3>
          <p className="text-sm text-muted-foreground">{role.description}</p>
        </div>
        {role.isSystem ? (
          <Badge variant="secondary">System</Badge>
        ) : onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
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