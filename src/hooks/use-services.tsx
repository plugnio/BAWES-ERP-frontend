import React, { createContext, useContext } from 'react';
import type { Services } from '../services';
import { getServices } from '../services';

const ServicesContext = createContext<Services | null>(null);

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}

export function useAuth() {
  const services = useServices();
  return services.auth;
}

export function usePeople() {
  const services = useServices();
  return services.people;
}

export function usePermissions() {
  const services = useServices();
  return services.permissions;
}

interface ServicesProviderProps {
  children: React.ReactNode;
}

export function ServicesProvider({ children }: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={getServices()}>
      {children}
    </ServicesContext.Provider>
  );
} 