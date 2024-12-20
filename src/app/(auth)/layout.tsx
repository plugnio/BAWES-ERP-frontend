import React from 'react';
import { Header } from '@/components/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { DebugPanel } from '@/components/dashboard/debug-panel';
import { DEBUG_CONFIG } from '@/lib/debug';

/**
 * Props for the authenticated layout component
 * @interface AuthLayoutProps
 */
interface AuthLayoutProps {
  /** Child components to render within the layout */
  children: React.ReactNode;
}

/**
 * Layout component for authenticated routes
 * Provides authentication protection and consistent layout structure
 * 
 * Features:
 * - Authentication guard to protect routes
 * - Consistent header navigation
 * - Responsive container with padding
 * - Full height layout with flexbox
 * - Debug panel in development mode
 * 
 * @param {AuthLayoutProps} props - Component props
 * @returns {JSX.Element} Authenticated layout structure
 * 
 * @example
 * ```tsx
 * // Pages wrapped with this layout will be protected
 * // and have consistent navigation
 * export default function DashboardPage() {
 *   return (
 *     <div>Dashboard content</div>
 *   );
 * }
 * ```
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-6 px-4">
          {children}
        </main>
        {DEBUG_CONFIG.isEnabled && <DebugPanel />}
      </div>
    </AuthGuard>
  );
} 