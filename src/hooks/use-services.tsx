'use client';

import React, { createContext, useContext } from 'react';
import type { Services } from '../services';
import { getServices } from '../services';

/**
 * Context for dependency injection of application service instances
 * @internal
 */
const ServicesContext = createContext<Services | null>(null);

/**
 * Hook to access the service container
 * @throws {Error} If used outside of ServicesProvider
 * @returns {Services} The service container instance
 */
export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}

/**
 * Hook to access the authentication service
 * @returns {Services['auth']} The authentication service instance
 */
export function useAuth() {
  const services = useServices();
  return services.auth;
}

/**
 * Hook to access the people management service
 * @returns {Services['people']} The people management service instance
 */
export function usePeople() {
  const services = useServices();
  return services.people;
}

/**
 * Hook to access the permissions management service
 * @returns {Services['permissions']} The permissions management service instance
 */
export function usePermissions() {
  const services = useServices();
  return services.permissions;
}

/**
 * Props for the service provider component
 */
interface ServicesProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that makes service instances available to all child components
 * Initializes the service container using getServices() and provides it through context
 * 
 * @param {ServicesProviderProps} props - The provider props
 * @returns {JSX.Element} The provider component
 */
export function ServicesProvider({ children }: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={getServices()}>
      {children}
    </ServicesContext.Provider>
  );
} 