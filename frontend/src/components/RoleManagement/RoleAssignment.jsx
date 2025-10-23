import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Users, Search, Filter } from 'lucide-react';
import PermissionGuard from '../Auth/PermissionGuard';

const RoleAssignment = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?includeRoles=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles?active=true', {
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
    }
  };

  const assignRole = async (userId, roleId) => {
    try {
      const response = await fetch(`/api/roles/${roleId}/assign/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh user list
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRoleFilter || 
                       user.role?.name === selectedRoleFilter ||
                       user.legacyRole === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <PermissionGuard permission="manage_users">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-8 h-8" />
              Role Assignment
            </h1>
            <p className="text-white/70 mt-1">
              Assign roles to users
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 glass-input"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full px-3 py-2 glass-input"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role._id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Users ({filteredUsers.length})
            </h2>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border border-white/20 rounded-lg hover:border-white/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{user.name}</h3>
                    <p className="text-sm text-white/60">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role?.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.role?.name || user.legacyRole || 'No Role'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={user.role?._id || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        assignRole(user._id, e.target.value);
                      }
                    }}
                    className="px-3 py-2 glass-input text-sm"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default RoleAssignment;
