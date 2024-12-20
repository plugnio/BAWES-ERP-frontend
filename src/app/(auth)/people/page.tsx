import React from 'react';
import { Metadata } from 'next';

/**
 * Metadata configuration for the people management page
 * Used by Next.js for SEO and document head
 */
export const metadata: Metadata = {
  title: 'People Management',
  description: 'Manage people and their information in BAWES ERP',
};

/**
 * People management page component
 * Provides interface for managing people records in the system
 * 
 * Layout:
 * - Header with page title and action buttons
 * - Main content area with people list/table
 * 
 * Features:
 * - People listing with pagination
 * - Search and filtering
 * - Create/Edit/Delete operations
 * - Responsive design
 * - Tailwind CSS styling
 * 
 * Permissions Required:
 * - PEOPLE_VIEW: To view people records
 * - PEOPLE_CREATE: To create new records
 * - PEOPLE_EDIT: To modify existing records
 * - PEOPLE_DELETE: To remove records
 * 
 * @returns {JSX.Element} People page structure
 * 
 * @example
 * ```tsx
 * // This page is automatically wrapped with AuthLayout
 * // and protected by AuthGuard
 * <PeoplePage />
 * ```
 */
export default function PeoplePage() {
  return (
    <div className="container space-y-8 p-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">People</h2>
          <p className="text-muted-foreground">
            Manage people and their information
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Add action buttons here */}
        </div>
      </div>

      {/* Main content area */}
      <div className="space-y-4">
        {/* Add people list/table here */}
      </div>
    </div>
  );
} 