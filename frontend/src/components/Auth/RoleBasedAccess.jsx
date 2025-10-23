import React from 'react';
import {useAppSelector} from "../../hooks/redux.js";


const RoleBasedAccess = ({
                             children,
                             allowedRoles = [],
                             allowedPermissions = [],
                             fallback = null,
                             requireAll = false
                         }) => {
    const {user} = useAppSelector(state => state.auth);

    // If no user is logged in, show fallback
    if (!user) {
        return fallback;
    }

    // Check role-based access
    if (allowedRoles.length > 0) {
        const hasRole = allowedRoles.includes(user.role);
        if (!hasRole) {
            return fallback;
        }
    }

    // Check permission-based access
    if (allowedPermissions.length > 0) {
        const userPermissions = getUserPermissions(user.role);

        if (requireAll) {
            // User must have ALL specified permissions
            const hasAllPermissions = allowedPermissions.every(permission =>
                userPermissions.includes(permission)
            );
            if (!hasAllPermissions) {
                return fallback;
            }
        } else {
            // User must have AT LEAST ONE of the specified permissions
            const hasAnyPermission = allowedPermissions.some(permission =>
                userPermissions.includes(permission)
            );
            if (!hasAnyPermission) {
                return fallback;
            }
        }
    }

    return children;
};

// Helper function to get user permissions based on role
const getUserPermissions = (role) => {
    const permissions = {
        admin: [
            'create_workspace',
            'delete_workspace',
            'manage_workspace_settings',
            'invite_members',
            'remove_members',
            'create_project',
            'delete_project',
            'manage_project_settings',
            'assign_project_members',
            'create_task',
            'delete_task',
            'assign_task',
            'manage_all_tasks',
            'view_all_tasks',
            'manage_users',
            'view_analytics',
            'export_data',
        ],
        member: [
            'create_workspace',
            'invite_members',
            'create_project',
            'assign_project_members',
            'create_task',
            'assign_task',
            'manage_assigned_tasks',
            'view_assigned_tasks',
            'comment_on_tasks',
        ],
        guest: [
            'view_assigned_tasks',
            'comment_on_tasks',
        ],
    };

    return permissions[role] || [];
};

// Higher-order component for role-based access
export const withRoleAccess = (Component, options = {}) => {
    return (props) => (
        <RoleBasedAccess {...options}>
            <Component {...props} />
        </RoleBasedAccess>
    );
};

// Hook for checking permissions
export const usePermissions = () => {
    const {user} = useAppSelector(state => state.auth);

    const hasRole = (roles) => {
        if (!user) return false;
        return Array.isArray(roles) ? roles.includes(user.role) : roles === user.role;
    };

    const hasPermission = (permissions) => {
        if (!user) return false;

        const userPermissions = getUserPermissions(user.role);
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

        return permissionArray.some(permission => userPermissions.includes(permission));
    };

    const hasAllPermissions = (permissions) => {
        if (!user) return false;

        const userPermissions = getUserPermissions(user.role);
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

        return permissionArray.every(permission => userPermissions.includes(permission));
    };

    const canAccess = (resource, action) => {
        if (!user) return false;

        const permission = `${action}_${resource}`;
        return hasPermission(permission);
    };

    return {
        user,
        hasRole,
        hasPermission,
        hasAllPermissions,
        canAccess,
        permissions: getUserPermissions(user?.role),
    };
};

export default RoleBasedAccess;
