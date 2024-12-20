import React from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';

/**
 * Props for the public layout component
 * @interface PublicLayoutProps
 */
interface PublicLayoutProps {
  /** Child components to render within the layout */
  children: React.ReactNode;
}

/**
 * Layout component for public routes
 * Provides a simplified layout for unauthenticated pages
 * 
 * Features:
 * - Minimal header with theme toggle
 * - Centered content with max width
 * - Responsive container with padding
 * - Full height layout with flexbox
 * 
 * Used for:
 * - Login page
 * - Registration page
 * - Email verification
 * - Public landing pages
 * 
 * @param {PublicLayoutProps} props - Component props
 * @returns {JSX.Element} Public layout structure
 * 
 * @example
 * ```tsx
 * // Pages wrapped with this layout will have centered content
 * // and minimal navigation
 * export default function LoginPage() {
 *   return (
 *     <div>Login form</div>
 *   );
 * }
 * ```
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 flex items-center px-4 border-b">
        <div className="flex-1" />
        <ModeToggle />
      </header>
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 