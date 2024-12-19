import React from 'react';
import { LoadingSpinner } from '@/components/shared';

export default function AuthLoading() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading protected content...</p>
      </div>
    </div>
  );
} 