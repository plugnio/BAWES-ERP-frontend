import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PermissionExplorer } from './permission-explorer';
import { useServices } from '@/hooks/use-services';
import { usePermissions } from '@/hooks/use-permissions';

// Mock the hooks and services
jest.mock('@/hooks/use-services');
jest.mock('@/hooks/use-permissions');

const mockDashboard = {
  roles: [
    { id: '1', name: 'Admin', description: 'Administrator', isSystem: true, permissions: ['1', '2'], sortOrder: 0 },
    { id: '2', name: 'User', description: 'Regular User', isSystem: false, permissions: ['1'], sortOrder: 1 },
  ],
  categories: [
    {
      name: 'User Management',
      permissions: [
        { id: '1', name: 'Create User', description: 'Can create new users', isDeprecated: false },
        { id: '2', name: 'Edit User', description: 'Can edit existing users', isDeprecated: false },
      ],
    },
  ],
  stats: {
    totalPermissions: 2,
    totalRoles: 2,
    systemRoles: 1,
  },
};

describe('PermissionExplorer', () => {
  beforeEach(() => {
    (usePermissions as jest.Mock).mockReturnValue({
      dashboard: mockDashboard,
      currentRole: null,
      isLoading: false,
      error: null,
      loadDashboard: jest.fn().mockResolvedValue(undefined),
      loadRole: jest.fn().mockResolvedValue(undefined),
      updateRoleOrder: jest.fn().mockResolvedValue(undefined),
      createRole: jest.fn().mockResolvedValue(undefined),
      updateRolePermissions: jest.fn().mockResolvedValue(undefined),
      invalidateCache: jest.fn(),
    });

    (useServices as jest.Mock).mockReturnValue({
      roles: {
        updateRolePermissions: jest.fn().mockResolvedValue(undefined),
        deleteRole: jest.fn().mockResolvedValue(undefined),
      },
      permissions: {
        getDashboard: jest.fn().mockResolvedValue(mockDashboard),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle permission updates', async () => {
    await act(async () => {
      render(<PermissionExplorer className="test" />);
    });

    // Wait for roles to load and find the role items
    const roleItems = await screen.findAllByTestId('role-item');
    expect(roleItems).toHaveLength(2);

    // Click on a role to select it
    await act(async () => {
      await fireEvent.click(roleItems[1]); // User role
    });

    // Wait for permission dashboard to load
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByTestId('permission-dashboard')).toBeInTheDocument();
      });
    });

    // Find and click the permission toggle
    const permissionToggles = await screen.findAllByTestId('permission-toggle');
    await act(async () => {
      await fireEvent.click(permissionToggles[1]); // Click the second permission (id: '2')
    });

    // Verify permission update was called with correct data structure
    const { roles } = useServices();
    expect(roles.updateRolePermissions).toHaveBeenCalledWith('2', ['1', '2']);
  });

  it('should handle role selection', async () => {
    await act(async () => {
      render(<PermissionExplorer className="test" />);
    });

    // Wait for roles to load and find the role items
    const roleItems = await screen.findAllByTestId('role-item');
    expect(roleItems).toHaveLength(2);

    // Find and click the Admin role
    await act(async () => {
      await fireEvent.click(roleItems[0]);
    });

    // Wait for permission dashboard to load
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByTestId('permission-dashboard')).toBeInTheDocument();
      });
    });
  });

  it('should handle role deletion', async () => {
    await act(async () => {
      render(<PermissionExplorer className="test" />);
    });

    // Wait for roles to load and find the role items
    const roleItems = await screen.findAllByTestId('role-item');
    expect(roleItems).toHaveLength(2);

    // Find and click delete on the User role (non-system role)
    const deleteButton = roleItems[1].querySelector('[data-testid="delete-role-button"]');
    expect(deleteButton).toBeDefined();
    await act(async () => {
      await fireEvent.click(deleteButton!);
    });

    // Verify role was deleted
    const { roles } = useServices();
    expect(roles.deleteRole).toHaveBeenCalledWith('2');
  });

  it('should handle role order updates', async () => {
    await act(async () => {
      render(<PermissionExplorer className="test" />);
    });

    // Wait for roles to load and find the role items
    const roleItems = await screen.findAllByTestId('role-item');
    expect(roleItems).toHaveLength(2);

    // Verify roles are rendered in correct order
    expect(roleItems[0]).toHaveTextContent('Admin');
    expect(roleItems[1]).toHaveTextContent('User');
  });
}); 