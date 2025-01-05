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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RoleListProps {
  /** List of roles to display */
  roles: Role[];
  /** Callback when a role is selected */
  onRoleSelect?: (roleId: string | undefined) => void;
  /** Currently selected role ID */
  selectedRoleId?: string;
  /** Optional class name for styling */
  className?: string;
  /** Callback when a new role is created */
  onCreateRole?: (name: string, description?: string) => Promise<void>;
  /** Callback to refresh the role list */
  onRefresh?: () => Promise<void>;
}

interface SortableRoleProps {
  /** Role to display */
  role: Role;
  /** Whether this role is currently selected */
  isSelected: boolean;
  /** Callback when the role is selected */
  onSelect: () => void;
  /** Optional callback when the role is deleted */
  onDelete?: () => void;
}

/**
 * Component for displaying a single draggable role item
 * 
 * @component
 * @param {SortableRoleProps} props - Component props
 * @returns {JSX.Element} Sortable role component
 */
function SortableRole({ role, isSelected, onSelect, onDelete }: SortableRoleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id });

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        data-testid="role-item"
        data-role-id={role.id}
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
              data-testid="delete-role-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Component for displaying and managing a list of roles
 * 
 * @component
 * @param {RoleListProps} props - Component props
 * @returns {JSX.Element} Role list component
 */
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
      if (selectedRoleId === roleId) {
        onRoleSelect?.(undefined);
      }
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
      await onRefresh?.();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive"
      });
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
            onDelete={!role.isSystem ? () => handleDeleteRole(role.id) : undefined}
          />
        ))}
      </CardContent>
    </Card>
  );
} 