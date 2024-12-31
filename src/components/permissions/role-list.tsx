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
import { GripVertical } from 'lucide-react';
import type { Role } from '@/services/role.service';

interface RoleListProps {
  roles: Role[];
  onRoleSelect?: (roleId: string) => void;
  selectedRoleId?: string;
  className?: string;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
        <div className="text-left pl-8">
          <div className="font-medium">{role.name}</div>
          {role.description && (
            <div className="text-sm text-muted-foreground">
              {role.description}
            </div>
          )}
        </div>
      </Button>
    </div>
  );
}

export function RoleList({
  roles,
  onRoleSelect,
  selectedRoleId,
  className,
}: RoleListProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>Drag to reorder roles and click to manage permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {roles.map((role) => (
          <SortableRole
            key={role.id}
            role={role}
            isSelected={selectedRoleId === role.id}
            onSelect={() => onRoleSelect?.(role.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
} 