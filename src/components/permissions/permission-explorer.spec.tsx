import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionExplorer } from './permission-explorer';
import { useServices } from '@/hooks/use-services';
import { usePermissions } from '@/hooks/use-permissions';

// Mock the hooks
jest.mock('@/hooks/use-services', () => ({
  useServices: jest.fn(),
}));

jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: jest.fn(),
}));

describe('PermissionExplorer', () => {
  const mockRoles = [
    {
      id: '1',
      name: 'Admin',
      description: 'Administrator',
      permissions: ['1', '2'],
      isSystem: true,
      sortOrder: 1,
    },
    {
      id: '2',
      name: 'User',
      description: 'Regular User',
      permissions: ['1'],
      isSystem: false,
      sortOrder: 2,
    },
  ];

  const mockDashboard = {
    roles: mockRoles,
    categories: [],
    stats: {
      totalPermissions: 2,
      totalRoles: 2,
      systemRoles: 1,
    },
  };

  beforeEach(() => {
    (useServices as jest.Mock).mockReturnValue({
      roles: {
        getRoles: jest.fn().mockResolvedValue(mockRoles),
        getRole: jest.fn().mockImplementation((id) => 
          Promise.resolve(mockRoles.find(role => role.id === id))
        ),
        updateRolePermissions: jest.fn().mockResolvedValue(undefined),
        updateRoleOrder: jest.fn().mockResolvedValue(undefined),
      },
      permissions: {
        getDashboard: jest.fn().mockResolvedValue(mockDashboard),
      },
    });

    (usePermissions as jest.Mock).mockReturnValue({
      dashboard: mockDashboard,
      isLoading: false,
      error: null,
      loadDashboard: jest.fn().mockResolvedValue(mockDashboard),
      createRole: jest.fn().mockResolvedValue(mockRoles[0]),
      updateRoleOrder: jest.fn().mockResolvedValue(undefined),
      invalidateCache: jest.fn(),
    });
  });

  it('should handle role selection', async () => {
    render(<PermissionExplorer className="test" />);

    // Wait for roles to load and find the role items
    const roleItems = await screen.findAllByTestId('role-item');
    expect(roleItems).toHaveLength(2);

    // Find and click the Admin role
    const adminRole = roleItems.find(item => item.textContent?.includes('Admin'));
    expect(adminRole).toBeDefined();
    fireEvent.click(adminRole!);

    // Verify permission dashboard is shown
    expect(await screen.findByTestId('permission-dashboard')).toBeInTheDocument();
  });

  it('should handle role order updates', async () => {
    render(<PermissionExplorer className="test" />);

    // Wait for roles to load
    const roleItems = await screen.findAllByTestId('role-item');
    expect(roleItems).toHaveLength(2);

    // Verify roles are rendered in correct order
    expect(roleItems[0]).toHaveTextContent('Admin');
    expect(roleItems[1]).toHaveTextContent('User');
  });
}); 