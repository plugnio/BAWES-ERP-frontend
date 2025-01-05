import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PermissionDashboard } from './permission-dashboard';
import { useServices } from '@/hooks/use-services';

jest.mock('@/hooks/use-services');

describe('PermissionDashboard', () => {
  const mockRole = {
    id: '1',
    name: 'Test Role',
    permissions: ['perm1', 'perm2'],
    isSystem: false,
    sortOrder: 1,
  };

  const mockDashboard = {
    categories: [
      {
        name: 'Test Category',
        permissions: [
          { id: '1', code: 'perm1', name: 'Permission 1', description: 'Description 1', isDeprecated: false },
          { id: '2', code: 'perm2', name: 'Permission 2', description: 'Description 2', isDeprecated: false },
          { id: '3', code: 'perm3', name: 'Permission 3', description: 'Description 3', isDeprecated: false },
        ],
      },
    ],
    roles: [mockRole],
    stats: {
      totalPermissions: 3,
      totalRoles: 1,
      systemRoles: 0,
    },
  };

  beforeEach(() => {
    (useServices as jest.Mock).mockReturnValue({
      permissions: {
        getDashboard: jest.fn().mockResolvedValue(mockDashboard),
        clearDashboardCache: jest.fn(),
      },
      roles: {
        updateRolePermissions: jest.fn().mockResolvedValue(undefined),
        getRole: jest.fn().mockResolvedValue(mockRole),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update role permissions correctly', async () => {
    await act(async () => {
      render(
        <PermissionDashboard
          role={mockRole}
          onPermissionsChange={jest.fn()}
        />
      );
    });

    // Wait for dashboard to load
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByTestId('permission-dashboard')).toBeInTheDocument();
      });
    });

    // Find and click the first permission toggle
    const permissionToggles = await screen.findAllByTestId('permission-toggle');
    await act(async () => {
      await fireEvent.click(permissionToggles[2]); // Click the third permission (code: 'perm3')
    });

    // Verify the service was called with the correct permissions
    const { roles } = useServices();
    expect(roles.updateRolePermissions).toHaveBeenCalledWith(mockRole.id, ['perm1', 'perm2', 'perm3']);
  });
}); 