'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Permission, PermissionCategory } from '@/services/permissions.service';
import { cn } from '@/lib/utils';

interface PermissionListProps {
  /** List of permission categories */
  categories: PermissionCategory[];
  /** Set of selected permission IDs */
  selectedPermissions?: Set<string>;
  /** Callback when a permission is toggled */
  onPermissionToggle?: (permissionId: string) => void;
  /** Callback when all permissions in a category are toggled */
  onBulkSelect?: (categoryName: string, selected: boolean) => void;
  /** Whether the permissions are disabled */
  disabled?: boolean;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Component for displaying and managing a list of permissions
 * 
 * @component
 * @param {PermissionListProps} props - Component props
 * @returns {JSX.Element} Permission list component
 */
export function PermissionList({
  categories,
  selectedPermissions = new Set(),
  onPermissionToggle,
  onBulkSelect,
  disabled = false,
  className,
}: PermissionListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter permissions based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories;

    const query = searchQuery.toLowerCase();
    return categories.map(category => ({
      ...category,
      permissions: category.permissions.filter(permission =>
        permission.name.toLowerCase().includes(query) ||
        permission.description?.toLowerCase().includes(query)
      ),
    })).filter(category => category.permissions.length > 0);
  }, [categories, searchQuery]);

  // Check if all permissions in a category are selected
  const isCategorySelected = React.useCallback((category: PermissionCategory) => {
    const activePermissions = category.permissions.filter(p => !p.isDeprecated);
    return activePermissions.every(p => selectedPermissions.has(p.id));
  }, [selectedPermissions]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>Manage permissions by category</CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {filteredCategories.map(category => (
              <div key={category.name} className="space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id={`category-${category.name}`}
                    checked={isCategorySelected(category)}
                    onCheckedChange={() => onBulkSelect?.(category.name, !isCategorySelected(category))}
                    disabled={disabled}
                  />
                  <div>
                    <h3 className="text-sm font-medium">{category.name}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  {category.permissions.map(permission => (
                    <div 
                      key={permission.id}
                      data-testid="permission-item"
                      data-permission-code={permission.code}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={permission.id}
                        data-testid="permission-toggle"
                        checked={selectedPermissions.has(permission.code)}
                        onCheckedChange={() => onPermissionToggle?.(permission.code)}
                        disabled={disabled || permission.isDeprecated}
                      />
                      <div>
                        <label
                          htmlFor={permission.id}
                          className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            permission.isDeprecated && "text-muted-foreground line-through"
                          )}
                        >
                          {permission.name}
                        </label>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground">{permission.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 