import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { PermissionExplorer } from './permission-explorer';
import { useServices } from '@/hooks/use-services';
import { usePermissions } from '@/hooks/use-permissions';
import userEvent from '@testing-library/user-event';
import { PermissionContext, PermissionState } from '@/hooks/use-permissions';
import type { PermissionDashboard } from '@/services/permissions.service';
import type { Role } from '@/services/role.service';

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// Mock the hooks and services
jest.mock('@/hooks/use-services');
jest.mock('@/hooks/use-permissions');

const mockServices = {
  permissions: {
    getDashboard: jest.fn().mockResolvedValue(null),
    hasPermission: jest.fn().mockResolvedValue(true),
    clearDashboardCache: jest.fn(),
  },
  roles: {
    updateRolePermissions: jest.fn().mockResolvedValue(undefined),
    deleteRole: jest.fn().mockResolvedValue(undefined),
    getRole: jest.fn().mockResolvedValue(null),
    updateRoleOrder: jest.fn().mockResolvedValue(undefined),
  },
};

(useServices as jest.Mock).mockReturnValue(mockServices);

type MockPermissionState = {
  dashboard: PermissionDashboard | null;
  currentRole: Role | null;
  isLoading: boolean;
  error: string | null;
  loadDashboard: jest.Mock;
  loadRole: jest.Mock;
  updateRoleOrder: jest.Mock;
  createRole: jest.Mock;
  deleteRole: jest.Mock;
  updateRolePermissions: jest.Mock;
  invalidateCache: jest.Mock;
};

const mockPermissions = [
  { id: '1', name: 'Read', description: 'Can read data', code: 'READ', category: 'General', isDeprecated: false, sortOrder: 0, bitfield: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', name: 'Write', description: 'Can write data', code: 'WRITE', category: 'General', isDeprecated: false, sortOrder: 1, bitfield: '2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '3', name: 'Delete', description: 'Can delete data', code: 'DELETE', category: 'General', isDeprecated: false, sortOrder: 2, bitfield: '3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

const mockDashboard: PermissionDashboard = {
  roles: [
    { id: '1', name: 'Admin', description: 'Administrator', permissions: ['READ', 'WRITE', 'DELETE'], sortOrder: 0, isSystem: true },
    { id: '2', name: 'User', description: 'Regular User', permissions: ['READ'], sortOrder: 1, isSystem: false },
    { id: '3', name: 'Guest', description: 'Guest User', permissions: [], sortOrder: 2, isSystem: false },
  ],
  categories: [
    { name: 'General', permissions: mockPermissions },
  ],
  stats: {
    totalRoles: 3,
    totalPermissions: 3,
    systemRoles: 1,
  },
};

// Mock usePermissions hook
(usePermissions as jest.Mock).mockReturnValue({
  dashboard: mockDashboard,
  currentRole: null,
  isLoading: false,
  error: null,
  loadDashboard: jest.fn(),
  loadRole: jest.fn(),
  updateRoleOrder: jest.fn(),
  createRole: jest.fn(),
  deleteRole: jest.fn(),
  updateRolePermissions: jest.fn(),
  invalidateCache: jest.fn(),
});

// Mock DndContext
jest.mock('@dnd-kit/core', () => {
  let onDragEndHandler: any;
  return {
    ...jest.requireActual('@dnd-kit/core'),
    DndContext: ({ children, onDragEnd }: any) => {
      onDragEndHandler = onDragEnd;
      (global as any).mockDndOnDragEnd = (args: any) => {
        onDragEndHandler(args);
      };
      return children;
    },
  };
});

describe('PermissionExplorer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock responses
    mockServices.permissions.getDashboard.mockResolvedValue(mockDashboard);
    mockServices.roles.getRole.mockResolvedValue(mockDashboard.roles[1]);
    
    // Reset usePermissions mock for each test
    (usePermissions as jest.Mock).mockReturnValue({
      dashboard: mockDashboard,
      currentRole: mockDashboard.roles[1],
      isLoading: false,
      error: null,
      loadDashboard: jest.fn(),
      loadRole: jest.fn(),
      updateRoleOrder: jest.fn(),
      createRole: jest.fn(),
      deleteRole: jest.fn(),
      updateRolePermissions: jest.fn(),
      invalidateCache: jest.fn(),
    });
  });

  it('should handle permission updates', async () => {
    // Mock usePermissions to return the selected role and permissions
    const updateRolePermissions = jest.fn().mockResolvedValue(undefined);
    const loadDashboard = jest.fn();
    const loadRole = jest.fn();
    const invalidateCache = jest.fn();

    (usePermissions as jest.Mock).mockReturnValue({
      dashboard: mockDashboard,
      currentRole: mockDashboard.roles[1],
      isLoading: false,
      error: null,
      loadDashboard,
      loadRole,
      updateRoleOrder: jest.fn(),
      createRole: jest.fn(),
      deleteRole: jest.fn(),
      updateRolePermissions,
      invalidateCache,
    });

    // Mock service responses
    mockServices.permissions.getDashboard.mockResolvedValue(mockDashboard);
    mockServices.roles.getRole.mockResolvedValue(mockDashboard.roles[1]);
    mockServices.roles.updateRolePermissions.mockResolvedValue(undefined);

    render(<PermissionExplorer />);

    // Wait for the dashboard to load and roles to be visible
    await waitFor(() => {
      expect(screen.getAllByTestId('role-item')).toHaveLength(mockDashboard.roles.length);
    });

    // Click the second role (non-system role)
    const roleItems = screen.getAllByTestId('role-item');
    await userEvent.click(roleItems[1]);

    // Wait for permission items to be available
    const permissionItems = await screen.findAllByTestId('permission-item');
    expect(permissionItems).toHaveLength(mockPermissions.length);

    // Get the first permission item and its toggle
    const firstPermissionItem = permissionItems[0];
    const permissionCode = firstPermissionItem.getAttribute('data-permission-code');
    expect(permissionCode).toBeTruthy();

    const firstToggle = within(firstPermissionItem).getByTestId('permission-toggle');
    expect(firstToggle).toBeInTheDocument();

    // Get current permissions
    const currentPermissions = new Set(mockDashboard.roles[1].permissions);
    const isEnabled = !currentPermissions.has(permissionCode!);

    // Click the toggle
    await userEvent.click(firstToggle);

    // Verify the update was called with the correct permissions
    await waitFor(() => {
      if (isEnabled) {
        expect(mockServices.roles.updateRolePermissions).toHaveBeenCalledWith(
          mockDashboard.roles[1].id,
          [...currentPermissions, permissionCode!]
        );
      } else {
        expect(mockServices.roles.updateRolePermissions).toHaveBeenCalledWith(
          mockDashboard.roles[1].id,
          Array.from(currentPermissions).filter(p => p !== permissionCode!)
        );
      }
    });
  });

  it('should handle role selection', async () => {
    // Mock usePermissions to return the selected role and permissions
    (usePermissions as jest.Mock).mockReturnValue({
      dashboard: mockDashboard,
      currentRole: mockDashboard.roles[0],
      isLoading: false,
      error: null,
      loadDashboard: jest.fn(),
      loadRole: jest.fn(),
      updateRoleOrder: jest.fn(),
      createRole: jest.fn(),
      deleteRole: jest.fn(),
      updateRolePermissions: jest.fn(),
      invalidateCache: jest.fn(),
    });

    // Mock service responses
    mockServices.permissions.getDashboard.mockResolvedValue(mockDashboard);
    mockServices.roles.getRole.mockResolvedValue(mockDashboard.roles[0]);

    render(<PermissionExplorer />);

    // Wait for roles to be visible
    await waitFor(() => {
      expect(screen.getAllByTestId('role-item')).toHaveLength(mockDashboard.roles.length);
    });

    // Click the first role
    const roleItems = screen.getAllByTestId('role-item');
    await userEvent.click(roleItems[0]);

    // Verify role selection
    await waitFor(() => {
      expect(roleItems[0]).toHaveClass('border-secondary/50');
    });

    // Wait for permission items to be available
    const permissionItems = await screen.findAllByTestId('permission-item');
    expect(permissionItems).toHaveLength(mockPermissions.length);

    // Verify permission toggles are present
    permissionItems.forEach(item => {
      const toggle = within(item).getByTestId('permission-toggle');
      expect(toggle).toBeInTheDocument();
    });
  });

  it('should handle role deletion', async () => {
    // Mock usePermissions to return the selected role and permissions
    const deleteRole = jest.fn().mockResolvedValue(undefined);
    const loadDashboard = jest.fn();
    const loadRole = jest.fn();
    const invalidateCache = jest.fn();

    (usePermissions as jest.Mock).mockReturnValue({
      dashboard: mockDashboard,
      currentRole: mockDashboard.roles[1],
      isLoading: false,
      error: null,
      loadDashboard,
      loadRole,
      updateRoleOrder: jest.fn(),
      createRole: jest.fn(),
      deleteRole,
      updateRolePermissions: jest.fn(),
      invalidateCache,
    });

    // Mock service responses
    mockServices.permissions.getDashboard.mockResolvedValue(mockDashboard);
    mockServices.roles.getRole.mockResolvedValue(mockDashboard.roles[1]);
    mockServices.roles.deleteRole.mockResolvedValue(undefined);

    render(<PermissionExplorer />);

    // Wait for roles to be visible
    await waitFor(() => {
      expect(screen.getAllByTestId('role-item')).toHaveLength(mockDashboard.roles.length);
    });

    // Find and click the delete button for the second role (non-system role)
    const roleItems = screen.getAllByTestId('role-item');
    const deleteButton = within(roleItems[1]).getByTestId('delete-role-button');
    await userEvent.click(deleteButton);

    // Wait for and click the confirm delete button in the dialog
    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    await userEvent.click(confirmButton);

    // Verify the role was deleted
    await waitFor(() => {
      expect(mockServices.roles.deleteRole).toHaveBeenCalledWith('2');
    });
  });

  it('should handle role order updates', async () => {
    // Mock usePermissions to return the initial state
    const updateRoleOrder = jest.fn();
    const testState: MockPermissionState = {
      dashboard: mockDashboard,
      currentRole: null,
      isLoading: false,
      error: null,
      loadDashboard: jest.fn(),
      loadRole: jest.fn(),
      updateRoleOrder,
      createRole: jest.fn(),
      deleteRole: jest.fn(),
      updateRolePermissions: jest.fn(),
      invalidateCache: jest.fn(),
    };

    (usePermissions as jest.Mock).mockReturnValue(testState);

    // Render with mock state
    render(<PermissionExplorer />);

    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getAllByTestId('role-item')).toHaveLength(3);
    });

    // Get all role items
    const roleItems = screen.getAllByTestId('role-item');
    const firstRoleId = roleItems[0].getAttribute('data-role-id');
    const secondRoleId = roleItems[1].getAttribute('data-role-id');
    const thirdRoleId = roleItems[2].getAttribute('data-role-id');

    // Mock the DndContext onDragEnd event
    const mockDndEvent = {
      active: { id: secondRoleId! },
      over: { id: firstRoleId! },
    };

    // Simulate drag and drop
    act(() => {
      (global as any).mockDndOnDragEnd(mockDndEvent);
    });

    // Wait for the update to be called with the new order
    await waitFor(() => {
      expect(updateRoleOrder).toHaveBeenCalledWith([
        { roleId: secondRoleId!, sortOrder: 0 },
        { roleId: firstRoleId!, sortOrder: 1 },
        { roleId: thirdRoleId!, sortOrder: 2 },
      ]);
    });
  });
});

const createWrapper = (mockState: MockPermissionState) => {
  return ({ children }: { children: React.ReactNode }) => (
    <PermissionContext.Provider value={mockState}>
      {children}
    </PermissionContext.Provider>
  );
}; 