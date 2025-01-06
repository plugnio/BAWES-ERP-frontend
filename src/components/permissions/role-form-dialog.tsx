/**
 * Role form dialog component that supports both creation and updates
 */
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Role } from '@/services/role.service';
import { Pencil } from 'lucide-react';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormDialogProps {
  /** Role to edit, if undefined then create mode */
  role?: Role;
  /** Callback when form is submitted */
  onSubmit: (data: RoleFormData) => Promise<void>;
  /** Optional class name for styling */
  className?: string;
}

export function RoleFormDialog({ role, onSubmit, className }: RoleFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? '',
      description: role?.description ?? '',
    },
  });

  const handleSubmit = async (data: RoleFormData) => {
    try {
      await onSubmit(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const isEditMode = !!role;
  const triggerButton = isEditMode ? (
    <Button
      variant="ghost"
      size="icon"
      data-testid="edit-role-button"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="outline" className={className}>New Role</Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update role details.' : 'Add a new role to manage permissions.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter role name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter role description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 