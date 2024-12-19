'use client';

import { useState, useEffect } from "react";
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
import { Configuration, PermissionManagementApi } from "@bawes/erp-api-sdk";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const token = Cookies.get('accessToken');
                if (!token) {
                    throw new Error('No access token available');
                }

                // Debug log token
                console.debug('Access Token:', token);

                // Create SDK configuration with current token
                const config = new Configuration({
                    basePath: process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000',
                    baseOptions: {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                });

                // Create API instance with current token
                const api = new PermissionManagementApi(config);

                console.debug('Fetching roles and permissions...');
                const response = await api.permissionManagementControllerGetPermissionDashboard();
                
                // Debug log
                console.debug('API Response:', response.data);

                if (isMounted) {
                    setRoles(response.data.roles || []);
                    setPermissionCategories(response.data.permissionCategories || []);
                    setError(null);
                }
            } catch (error: any) {
                console.error('Error fetching roles:', error);
                console.debug('Error config:', error.config);
                console.debug('Error response:', error.response);
                
                if (error.message === 'Authentication failed' || error.response?.status === 401) {
                    router.push('/auth/login');
                    return;
                }

                setError(error.message || "Failed to fetch roles and permissions");
                toast({
                    title: "Error",
                    description: error.message || "Failed to fetch roles and permissions",
                    variant: "destructive",
                });
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [toast, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Loading...</h2>
                    <p className="text-muted-foreground">Please wait while we fetch the data.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

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
                {roles && roles.length > 0 ? (
                    roles.map((role) => (
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
                                    {permissionCategories && permissionCategories.map((category) => (
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
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No roles found.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 