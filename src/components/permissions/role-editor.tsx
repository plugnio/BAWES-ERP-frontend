import React from 'react';
import { usePermissions } from '@/hooks';
import { RoleList } from './role-list';
import { PermissionDashboard } from './permission-dashboard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/shared';

interface RoleEditorProps {
  className?: string;
}

export function RoleEditor({ className }: RoleEditorProps) {
  const { updateRolePermissions, isLoading, error } = usePermissions();
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>();
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!selectedRoleId) return;

    try {
      setIsSaving(true);
      await updateRolePermissions(selectedRoleId, selectedPermissions);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={className}>
      <div className="grid gap-6 md:grid-cols-2">
        <RoleList
          selectedRoleId={selectedRoleId}
          onRoleSelect={setSelectedRoleId}
        />
        <PermissionDashboard
          roleId={selectedRoleId}
          onPermissionsChange={setSelectedPermissions}
        />
      </div>

      {selectedRoleId && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 