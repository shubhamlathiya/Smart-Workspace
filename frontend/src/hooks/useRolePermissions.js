import { useMemo } from 'react';
import { useAppSelector } from './redux';

export const useRolePermissions = () => {
  const { user } = useAppSelector(state => state.auth);

  const permissions = useMemo(() => {
    if (!user?.role?.permissions) {
      // Fallback to legacy role permissions
      return getLegacyPermissions(user?.legacyRole || 'guest');
    }

    return user.role.permissions.reduce((acc, permission) => {
      permission.actions.forEach(action => {
        const key = `${action}_${permission.resource}`;
        acc[key] = {
          hasPermission: true,
          conditions: permission.conditions || {},
          resource: permission.resource,
          action
        };
      });
      return acc;
    }, {});
  }, [user]);

  const hasPermission = (resource, action, conditions = {}) => {
    const permissionKey = `${action}_${resource}`;
    const permission = permissions[permissionKey];
    
    if (!permission) return false;
    
    // Check conditions if they exist
    if (Object.keys(conditions).length > 0) {
      for (const [key, value] of Object.entries(conditions)) {
        if (permission.conditions[key] !== value) {
          return false;
        }
      }
    }
    
    return permission.hasPermission;
  };

  const hasAnyPermission = (permissionChecks) => {
    return permissionChecks.some(check => 
      hasPermission(check.resource, check.action, check.conditions)
    );
  };

  const hasAllPermissions = (permissionChecks) => {
    return permissionChecks.every(check => 
      hasPermission(check.resource, check.action, check.conditions)
    );
  };

  const canAccessResource = (resource, actions = ['read']) => {
    return actions.some(action => hasPermission(resource, action));
  };

  const getResourcePermissions = (resource) => {
    return Object.keys(permissions)
      .filter(key => key.endsWith(`_${resource}`))
      .map(key => ({
        action: key.split('_')[0],
        ...permissions[key]
      }));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource,
    getResourcePermissions,
    userRole: user?.role?.name || user?.legacyRole || 'guest'
  };
};

// Fallback function for legacy role permissions
const getLegacyPermissions = (role) => {
  const permissionMap = {
    admin: {
      'create_workspace': { hasPermission: true, resource: 'workspace', action: 'create' },
      'read_workspace': { hasPermission: true, resource: 'workspace', action: 'read' },
      'update_workspace': { hasPermission: true, resource: 'workspace', action: 'update' },
      'delete_workspace': { hasPermission: true, resource: 'workspace', action: 'delete' },
      'manage_workspace': { hasPermission: true, resource: 'workspace', action: 'manage' },
      'invite_workspace': { hasPermission: true, resource: 'workspace', action: 'invite' },
      // ... other admin permissions
    },
    member: {
      'read_workspace': { hasPermission: true, resource: 'workspace', action: 'read' },
      'create_project': { hasPermission: true, resource: 'project', action: 'create' },
      'read_project': { hasPermission: true, resource: 'project', action: 'read' },
      'update_project': { hasPermission: true, resource: 'project', action: 'update' },
      // ... other member permissions
    },
    guest: {
      'read_workspace': { hasPermission: true, resource: 'workspace', action: 'read' },
      'read_project': { hasPermission: true, resource: 'project', action: 'read' },
      // ... other guest permissions
    }
  };

  return permissionMap[role] || {};
};
