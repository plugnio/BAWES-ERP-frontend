import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Role Management',
  description: 'Manage roles and permissions in BAWES ERP',
};

export default function RolesPage() {
  return (
    <div className="container space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground">
            Manage roles and permissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Add action buttons here */}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Add role list here */}
        </div>
        <div className="space-y-4">
          {/* Add permission editor here */}
        </div>
      </div>
    </div>
  );
} 