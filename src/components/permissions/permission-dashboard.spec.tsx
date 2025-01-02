import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PermissionDashboard } from './permission-dashboard';
import { useServices } from '@/hooks/use-services';

jest.mock('@/hooks/use-services');

describe('PermissionDashboard', () => {
  const mockRole = {
    id: '1',
    name: 'Test Role',
    permissions: ['1', '2'],
    isSystem: false,
    sortOrder: 1,
  };

  const mockDashboard = {
    categories: [
      {
        name: 'Test Category',
        permissions: [
          { id: '1', name: 'Permission 1', description: 'Description 1', isDeprecated: false },
          { id: '2', name: 'Permission 2', description: 'Description 2', isDeprecated: false },
          { id: '3', name: 'Permission 3', description: 'Description 3', isDeprecated: false },
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
      await fireEvent.click(permissionToggles[2]); // Click the third permission (id: '3')
    });

    // Verify the service was called with the correct permissions
    const { roles } = useServices();
    expect(roles.updateRolePermissions).toHaveBeenCalledWith(mockRole.id, ['1', '2', '3']);
  });
}); 