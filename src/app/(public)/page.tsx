import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold">Welcome to BAWES ERP</h1>
        <p className="text-xl text-muted-foreground">
          Enterprise Resource Planning System
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>People Management</CardTitle>
            <CardDescription>
              Efficiently manage your organization's people and their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Centralized people database</li>
              <li>Role-based access control</li>
              <li>Detailed profiles and history</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permission System</CardTitle>
            <CardDescription>
              Advanced role-based access control and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Granular permission control</li>
              <li>Role management</li>
              <li>Access auditing</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-x-4">
        <Button asChild>
          <Link href="/auth/login">Login</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/register">Register</Link>
        </Button>
      </div>
    </div>
  );
} 