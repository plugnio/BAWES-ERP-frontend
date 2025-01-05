import React from 'react';
import { PermissionsService } from '@/services/permissions.service';
import { RoleService } from '@/services/role.service';

export function useServices() {
  const [services] = React.useState(() => {
    const permissions = new PermissionsService();
    const roles = new RoleService(permissions);
    return {
      permissions,
      roles,
    };
  });

  return services;
} 