import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Mail, User, Shield, Check, XCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {closeModal} from "../../features/ui/uiSlice.jsx";
import {inviteMember} from "../../features/workspace/workspaceSlice.jsx";
import {addProjectMember} from "../../features/project/projectSlice.jsx";

const InviteMemberModal = () => {
  const dispatch = useAppDispatch();
  const { modals } = useAppSelector(state => state.ui);
  const { currentWorkspace } = useAppSelector(state => state.workspace);
  const { currentProject } = useAppSelector(state => state.project);
  const { user } = useAppSelector(state => state.auth);
  const { isLoading } = useAppSelector(state => state.workspace);

  const isOpen = modals.inviteMember;
  const isProjectInvite = !!currentProject;
  const targetEntity = isProjectInvite ? currentProject : currentWorkspace;

  const [formData, setFormData] = useState({
    emails: [''],
    role: 'member',
    message: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      emails: [''],
      role: 'member',
      message: '',
    });
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setErrors({});
    setInviteSent(false);
  };

  const handleClose = () => {
    dispatch(closeModal('inviteMember'));
    resetForm();
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData(prev => ({ ...prev, emails: newEmails }));

    if (errors.emails) {
      setErrors(prev => ({ ...prev, emails: '' }));
    }
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }));
  };

  const removeEmailField = (index) => {
    if (formData.emails.length > 1) {
      const newEmails = formData.emails.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, emails: newEmails }));
    }
  };

  const handleUserSelect = (user) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(prev => [...prev, user]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user._id !== userId));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate emails
    const validEmails = formData.emails.filter(email => email.trim());
    if (validEmails.length === 0 && selectedUsers.length === 0) {
      newErrors.emails = 'Please add at least one email address or select users';
    } else {
      for (const email of validEmails) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          newErrors.emails = 'Please enter valid email addresses';
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Filter out empty emails
      const emailsToInvite = formData.emails.filter(email => email.trim());
      if (emailsToInvite.length === 0) return;

      // Loop through each email and send invite
      for (const email of emailsToInvite) {
        const invitePayload = {
          email: email.trim(),
          role: formData.role || 'member'
        };

        if (isProjectInvite) {

          await dispatch(addProjectMember({
            projectId: currentProject._id,
            memberData: invitePayload
          })).unwrap();
        } else {
          await dispatch(inviteMember({
            workspaceId: currentWorkspace._id,
            memberData: invitePayload
          })).unwrap();
        }

        console.log(`Invite sent to ${email}`);
      }

      setInviteSent(true);
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Invite failed:', error);
    }
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Full access to all features and settings',
      member: 'Can create and edit content, but limited settings access',
      viewer: 'Can view content but cannot make changes',
      guest: 'Limited access to specific content only'
    };
    return descriptions[role] || '';
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-red-500 to-pink-600',
      member: 'from-blue-500 to-cyan-600',
      viewer: 'from-green-500 to-emerald-600',
      guest: 'from-purple-500 to-indigo-600',
    };
    return colors[role] || colors.member;
  };

  if (!targetEntity) return null;

  return (
      <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={handleClose}
            >
              <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="glass-card max-w-md w-full max-h-[90vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Invite to {isProjectInvite ? 'Project' : 'Workspace'}
                    </h2>
                    <p className="text-white/70 text-sm mt-1">
                      Invite members to {targetEntity.name}
                    </p>
                  </div>
                  <button
                      onClick={handleClose}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Success State */}
                {inviteSent ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Invites Sent!</h3>
                      <p className="text-white/70">
                        Your invitation has been sent successfully.
                      </p>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                      <div className="space-y-6">
                        {/* Invite by Email */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-3">
                            Invite by Email
                          </label>
                          <div className="space-y-2">
                            {formData.emails.map((email, index) => (
                                <div key={index} className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => handleEmailChange(index, e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter email address"
                                    />
                                  </div>
                                  {formData.emails.length > 1 && (
                                      <button
                                          type="button"
                                          onClick={() => removeEmailField(index)}
                                          className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                  )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addEmailField}
                                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Add another email</span>
                            </button>
                          </div>
                          {errors.emails && (
                              <p className="mt-2 text-sm text-red-400 flex items-center">
                                <XCircle className="w-4 h-4 mr-1" />
                                {errors.emails}
                              </p>
                          )}
                        </div>


                        {/* Role Selection */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-3">
                            Role
                          </label>
                          <div className="space-y-3">
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                              <option value="guest">Guest</option>
                            </select>
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex items-center space-x-2 mb-1">
                                <Shield className="w-4 h-4 text-white/70" />
                                <span className="text-white text-sm font-medium capitalize">
                            {formData.role} Role
                          </span>
                              </div>
                              <p className="text-white/70 text-xs">
                                {getRoleDescription(formData.role)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Personal Message */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Personal Message (Optional)
                          </label>
                          <textarea
                              value={formData.message}
                              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                              rows="3"
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder={`Add a personal message to your invitation...`}
                              maxLength={500}
                          />
                          <p className="mt-1 text-xs text-white/50">
                            {formData.message.length}/500 characters
                          </p>
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <h4 className="text-white font-medium mb-2">Invitation Summary</h4>
                          <div className="space-y-2 text-sm text-white/70">
                            <div className="flex justify-between">
                              <span>Emails:</span>
                              <span>{formData.emails.filter(e => e.trim()).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Users:</span>
                              <span>{selectedUsers.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Role:</span>
                              <span className="capitalize">{formData.role}</span>
                            </div>
                          </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                          <button
                              type="button"
                              onClick={handleClose}
                              className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                          >
                            Cancel
                          </button>
                          <button
                              type="submit"
                              disabled={isLoading}
                              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                                  Sending...
                                </div>
                            ) : (
                                'Send Invites'
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                )}
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
  );
};

export default InviteMemberModal;