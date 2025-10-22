import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, Users, Settings, Tag, Mail } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createWorkspace } from '../../features/workspace/workspaceSlice.jsx';
import { closeModal } from '../../features/ui/uiSlice.jsx';
import LoadingSpinner from '../UI/LoadingSpinner.jsx';

const CreateWorkspaceModal = () => {
  const dispatch = useAppDispatch();
  const { isCreating } = useAppSelector(state => state.workspace);
  const { modals } = useAppSelector(state => state.ui);

  const [inviteEmails, setInviteEmails] = useState(['']);
  const [tags, setTags] = useState(['']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const isOpen = modals.createWorkspace;

  const onSubmit = async (data) => {
    try {
      const workspaceData = {
        name: data.name,
        description: data.description,
        tags: tags.filter(tag => tag.trim()),
        settings: {
          isPublic: data.isPublic,
          allowMemberInvites: data.allowMemberInvites,
        },
      };

      await dispatch(createWorkspace(workspaceData)).unwrap();
      
      // Close modal and reset form
      dispatch(closeModal('createWorkspace'));
      reset();
      setInviteEmails(['']);
      setTags(['']);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleClose = () => {
    dispatch(closeModal('createWorkspace'));
    reset();
    setInviteEmails(['']);
    setTags(['']);
  };

  const addInviteEmail = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const removeInviteEmail = (index) => {
    if (inviteEmails.length > 1) {
      setInviteEmails(inviteEmails.filter((_, i) => i !== index));
    }
  };

  const updateInviteEmail = (index, value) => {
    const updated = [...inviteEmails];
    updated[index] = value;
    setInviteEmails(updated);
  };

  const addTag = () => {
    setTags([...tags, '']);
  };

  const removeTag = (index) => {
    if (tags.length > 1) {
      setTags(tags.filter((_, i) => i !== index));
    }
  };

  const updateTag = (index, value) => {
    const updated = [...tags];
    updated[index] = value;
    setTags(updated);
  };

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
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Create Workspace</h2>
                  <p className="text-white/70 text-sm">Set up a new collaboration space</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit(onSubmit)}  className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Basic Information</span>
                </h3>

                {/* Workspace Name */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Workspace name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                      maxLength: {
                        value: 100,
                        message: 'Name cannot exceed 100 characters',
                      },
                    })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    placeholder="Enter workspace name"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-300"
                    >
                      {errors.name.message}
                    </motion.p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description', {
                      maxLength: {
                        value: 500,
                        message: 'Description cannot exceed 500 characters',
                      },
                    })}
                    rows="3"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none"
                    placeholder="Describe your workspace (optional)"
                  />
                  {errors.description && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-300"
                    >
                      {errors.description.message}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Tags</span>
                </h3>

                <div className="space-y-2">
                  {tags.map((tag, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => updateTag(index, e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Enter tag"
                      />
                      {tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTag}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Member Invitations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Invite Members</span>
                </h3>

                <div className="space-y-2">
                  {inviteEmails.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateInviteEmail(index, e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Enter email address"
                      />
                      {inviteEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInviteEmail(index)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addInviteEmail}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    + Add Email
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </h3>

                <div className="space-y-3">
                  {/* Public Workspace */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-white font-medium">Public Workspace</label>
                      <p className="text-white/70 text-sm">Allow anyone to discover and join</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isPublic')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Allow Member Invites */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-white font-medium">Allow Member Invites</label>
                      <p className="text-white/70 text-sm">Let members invite others to the workspace</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('allowMemberInvites')}
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-white/20">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 glass-button text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isCreating ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="small" color="white" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Workspace'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateWorkspaceModal;
