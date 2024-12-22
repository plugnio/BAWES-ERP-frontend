'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Permission, PermissionCategory } from '@/services/permissions.service';

interface PermissionListProps {
  categories: PermissionCategory[];
  selectedPermissions?: Set<string>;
  onPermissionToggle?: (permissionId: string) => void;
  onBulkSelect?: (categoryId: string, selected: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function PermissionList({
  categories,
  selectedPermissions = new Set(),
  onPermissionToggle,
  onBulkSelect,
  disabled = false,
  className,
}: PermissionListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([]);

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
    const activePermissions = category.permissions.filter(p => !p.deprecated);
    return activePermissions.every(p => selectedPermissions.has(p.id));
  }, [selectedPermissions]);

  // Handle category expansion
  const handleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  // Handle category bulk selection
  const handleCategorySelect = (category: PermissionCategory) => {
    if (!onBulkSelect) return;
    const isSelected = isCategorySelected(category);
    onBulkSelect(category.id, !isSelected);
  };

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
        <ScrollArea className="h-[400px] pr-4">
          <Accordion
            type="multiple"
            value={expandedCategories}
            onValueChange={setExpandedCategories}
            className="space-y-4"
          >
            {filteredCategories.map(category => (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger
                  onClick={() => handleExpand(category.id)}
                  className="hover:no-underline"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={isCategorySelected(category)}
                      onCheckedChange={() => handleCategorySelect(category)}
                      disabled={disabled}
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{category.name}</span>
                      {category.description && (
                        <span className="text-xs text-muted-foreground">
                          {category.description}
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 py-2">
                    {category.permissions
                      .filter(permission => !permission.deprecated)
                      .map(permission => (
                        <div
                          key={permission.id}
                          className="flex items-start space-x-2 px-6"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={() => onPermissionToggle?.(permission.id)}
                            disabled={disabled}
                          />
                          <div className="space-y-1">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name}
                            </label>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 