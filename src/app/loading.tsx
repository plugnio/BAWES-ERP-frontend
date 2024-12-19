import React from 'react';
import { LoadingSpinner } from '@/components/shared';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
} 