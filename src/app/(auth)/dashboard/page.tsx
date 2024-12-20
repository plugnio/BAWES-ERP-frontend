import React from 'react';
import { Metadata } from 'next';

/**
 * Metadata configuration for the dashboard page
 * Used by Next.js for SEO and document head
 */
export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'BAWES ERP Dashboard',
};

/**
 * Main dashboard page component
 * Displays an overview of the ERP system with key metrics and information
 * 
 * Layout:
 * - Welcome header with user context
 * - Grid of metric cards (responsive layout)
 * - Main content area with activity feed
 * - Secondary content area with additional widgets
 * 
 * Features:
 * - Responsive grid layout
 * - Tailwind CSS styling
 * - Placeholder sections for future widgets
 * 
 * @returns {JSX.Element} Dashboard page structure
 * 
 * @example
 * ```tsx
 * // This page is automatically wrapped with AuthLayout
 * // and protected by AuthGuard
 * <DashboardPage />
 * ```
 */
export default function DashboardPage() {
  return (
    <div className="container space-y-8 p-8">
      {/* Welcome header section */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your ERP system
          </p>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Add dashboard cards/widgets here */}
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Primary content area */}
        <div className="col-span-4">
          {/* Add main content area */}
        </div>
        {/* Secondary content area */}
        <div className="col-span-3">
          {/* Add secondary content area */}
        </div>
      </div>
    </div>
  );
} 