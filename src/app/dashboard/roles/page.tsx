'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { Configuration, PermissionManagementApi } from "@bawes/erp-api-sdk";
import { sdkConfig } from "@/lib/sdk-config";

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

interface Permission {
  code: string;
  description: string;
  category: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = new PermissionManagementApi(sdkConfig);
        const response = await api.permissionManagementControllerGetPermissionDashboard();
        const data = response.data as any;
        setRoles(data.roles);
        setPermissionCategories(data.permissionCategories);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch roles and permissions",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage access control and permissions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <div className="grid gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {role.name}
                  <Badge
                    style={{ backgroundColor: role.color }}
                    className="text-white"
                  >
                    {role.permissions.length} permissions
                  </Badge>
                </CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Edit Role</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Delete Role
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissionCategories.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-sm font-medium mb-2">{category.name}</h4>
                    <div className="grid gap-2">
                      {category.permissions.map((permission) => (
                        <div
                          key={permission.code}
                          className="flex items-center justify-between py-2 px-4 bg-muted rounded-md"
                        >
                          <div>
                            <p className="text-sm font-medium">{permission.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                          {role.permissions.includes(permission.code) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 