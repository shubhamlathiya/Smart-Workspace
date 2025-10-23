import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, Settings, Plus, Edit, Trash2, 
  Eye, EyeOff, Palette, ArrowUp, ArrowDown
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import PermissionGuard from '../Auth/PermissionGuard';

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRoles(data.data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/roles/permissions/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPermissions(data.data.permissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  return (
    <PermissionGuard permission="manage_users">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Role Management
            </h1>
            <p className="text-white/70 mt-1">
              Manage user roles and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="glass-button flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles List */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Roles ({roles.length})
            </h2>
            <div className="space-y-3">
              {roles.map((role) => (
                <motion.div
                  key={role._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedRole?._id === role._id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <div>
                        <h3 className="font-medium text-white">{role.name}</h3>
                        <p className="text-sm text-white/60">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!role.isActive && (
                        <EyeOff className="w-4 h-4 text-red-400" />
                      )}
                      {role.isSystemRole && (
                        <Settings className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Role Details */}
          <div className="glass-card p-6">
            {selectedRole ? (
              <RoleDetails 
                role={selectedRole}
                permissions={permissions}
                onUpdate={fetchRoles}
                onEdit={() => setShowEditModal(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-white/50">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a role to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Role Modal */}
        {showCreateModal && (
          <CreateRoleModal
            permissions={permissions}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchRoles();
            }}
          />
        )}

        {/* Edit Role Modal */}
        {showEditModal && selectedRole && (
          <EditRoleModal
            role={selectedRole}
            permissions={permissions}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchRoles();
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default RoleManager;
