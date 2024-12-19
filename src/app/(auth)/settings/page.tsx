import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your BAWES ERP settings',
};

export default function SettingsPage() {
  return (
    <div className="container space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account and system preferences
          </p>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium">Profile Settings</h3>
            {/* Add profile settings form here */}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            {/* Add theme settings here */}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            {/* Add notification settings here */}
          </div>
        </div>
      </div>
    </div>
  );
} 