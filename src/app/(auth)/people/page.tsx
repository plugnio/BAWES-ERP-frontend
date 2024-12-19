import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'People Management',
  description: 'Manage people and their information in BAWES ERP',
};

export default function PeoplePage() {
  return (
    <div className="container space-y-8 p-8">
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
      <div className="space-y-4">
        {/* Add people list/table here */}
      </div>
    </div>
  );
} 