import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { usePermissions } from './RoleBasedAccess.jsx';

const PermissionGuard = ({ 
  children, 
  permission, 
  permissions = [],
  requireAll = false,
  showLocked = false,
  lockedMessage = 'You do not have permission to view this content',
  className = ''
}) => {
  const { hasPermission, hasAllPermissions } = usePermissions();

  // Check if user has required permissions
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasPermission(permissions);
  } else {
    hasAccess = true; // No permissions specified, allow access
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  if (showLocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`glass-card p-6 text-center ${className}`}
      >
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
        <p className="text-white/70">{lockedMessage}</p>
      </motion.div>
    );
  }

  return null;
};

// Specific permission guards
export const AdminOnly = ({ children, ...props }) => (
  <PermissionGuard permission="manage_users" {...props}>
    {children}
  </PermissionGuard>
);

export const MemberOrAdmin = ({ children, ...props }) => (
  <PermissionGuard permissions={['create_workspace', 'manage_users']} {...props}>
    {children}
  </PermissionGuard>
);

export const WorkspaceOwner = ({ children, workspace, ...props }) => {
  const { user } = usePermissions();
  
  const isOwner = workspace?.owner?._id === user?._id;
  
  if (isOwner) {
    return <div>{children}</div>;
  }
  
  return props.showLocked ? (
    <PermissionGuard {...props}>
      {children}
    </PermissionGuard>
  ) : null;
};

export const ProjectLead = ({ children, project, ...props }) => {
  const { user } = usePermissions();
  
  const isLead = project?.assignedMembers?.some(
    member => member.user._id === user?._id && member.role === 'lead'
  );
  
  if (isLead) {
    return <div>{children}</div>;
  }
  
  return props.showLocked ? (
    <PermissionGuard {...props}>
      {children}
    </PermissionGuard>
  ) : null;
};

export const TaskAssignee = ({ children, task, ...props }) => {
  const { user } = usePermissions();
  
  const isAssigned = task?.assignedTo?.some(
    assignment => assignment.user._id === user?._id
  );
  
  if (isAssigned) {
    return <div>{children}</div>;
  }
  
  return props.showLocked ? (
    <PermissionGuard {...props}>
      {children}
    </PermissionGuard>
  ) : null;
};

// Conditional rendering hook
export const useConditionalRender = () => {
  const { hasPermission, hasRole, canAccess } = usePermissions();

  const renderIf = (condition, component, fallback = null) => {
    return condition ? component : fallback;
  };

  const renderIfPermission = (permission, component, fallback = null) => {
    return hasPermission(permission) ? component : fallback;
  };

  const renderIfRole = (role, component, fallback = null) => {
    return hasRole(role) ? component : fallback;
  };

  const renderIfCanAccess = (resource, action, component, fallback = null) => {
    return canAccess(resource, action) ? component : fallback;
  };

  return {
    renderIf,
    renderIfPermission,
    renderIfRole,
    renderIfCanAccess,
  };
};

export default PermissionGuard;
