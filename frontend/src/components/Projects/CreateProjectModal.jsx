import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {X, Calendar, Users, FileText, Folder} from 'lucide-react';
import {useAppSelector, useAppDispatch} from '../../hooks/redux';
import {fetchWorkspaces} from "../../features/workspace/workspaceSlice.jsx";
import {closeModal} from "../../features/ui/uiSlice.jsx";
import {clearCurrentProject, createProject, updateProject} from "../../features/project/projectSlice.jsx";


const CreateProjectModal = () => {
    const dispatch = useAppDispatch();
    const {modals} = useAppSelector(state => state.ui);
    const {currentProject, isLoading} = useAppSelector(state => state.project);
    const {user} = useAppSelector(state => state.auth);
    const {workspaces} = useAppSelector(state => state.workspace);

    const isOpen = modals.createProject;
    const isEditMode = !!currentProject;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        workspace: '',
        priority: 'medium',
        dueDate: '',
        tags: [],
    });

    const [errors, setErrors] = useState({});
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Fetch user's workspaces when modal opens
            dispatch(fetchWorkspaces());
        }
    }, [dispatch, isOpen]);

    useEffect(() => {
        if (isEditMode && currentProject) {
            setFormData({
                name: currentProject.name || '',
                description: currentProject.description || '',
                workspace: currentProject.workspace?._id || '',
                priority: currentProject.priority || 'medium',
                dueDate: currentProject.dueDate ? currentProject.dueDate.split('T')[0] : '',
                tags: currentProject.tags || [],
            });
        } else {
            // Reset form when opening for creation
            setFormData({
                name: '',
                description: '',
                workspace: '',
                priority: 'medium',
                dueDate: '',
                tags: [],
            });
            setErrors({});
            setTagInput('');
        }
    }, [isEditMode, currentProject, isOpen]);

    const handleClose = () => {
        dispatch(closeModal('createProject'));
        dispatch(clearCurrentProject())
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleTagAdd = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleTagRemove = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTagInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTagAdd();
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Project name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Project name must be at least 2 characters';
        } else if (formData.name.trim().length > 100) {
            newErrors.name = 'Project name cannot exceed 100 characters';
        }

        if (formData.description && formData.description.length > 1000) {
            newErrors.description = 'Description cannot exceed 1000 characters';
        }

        if (!formData.workspace) {
            newErrors.workspace = 'Workspace is required';
        }

        if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
            newErrors.dueDate = 'Due date cannot be in the past';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const projectData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                workspace: formData.workspace,
                priority: formData.priority,
                tags: formData.tags,
                ...(formData.dueDate && {dueDate: formData.dueDate})
            };

            if (isEditMode) {
                await dispatch(updateProject({
                    projectId: currentProject._id,
                    updateData: projectData
                })).unwrap();
            } else {
                await dispatch(createProject(projectData)).unwrap();
            }

            handleClose();
        } catch (error) {
            console.error('Project operation failed:', error);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': 'border-red-500 text-red-400 bg-red-500/10',
            'high': 'border-orange-500 text-orange-400 bg-orange-500/10',
            'medium': 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
            'low': 'border-green-500 text-green-400 bg-green-500/10',
        };
        return colors[priority] || 'border-gray-500 text-gray-400 bg-gray-500/10';
    };

    const getPriorityText = (priority) => {
        const texts = {
            'urgent': 'Urgent',
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low',
        };
        return texts[priority] || priority;
    };

    // Filter workspaces to show only those created by the current user
    const userWorkspaces = workspaces.filter(workspace =>
        workspace.owner?._id === user?._id
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{scale: 0.9, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        exit={{scale: 0.9, opacity: 0}}
                        className="glass-card max-w-2xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/20">
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    {isEditMode ? 'Edit Project' : 'Create New Project'}
                                </h2>
                                <p className="text-white/70 text-sm mt-1">
                                    {isEditMode
                                        ? 'Update your project details and settings'
                                        : 'Start a new project in your workspace'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white"/>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="space-y-6">
                                {/* Project Name */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Project Name *
                                    </label>
                                    <div className="relative">
                                        <FileText
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50"/>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.name ? 'border-red-500' : 'border-white/20'
                                            }`}
                                            placeholder="Enter project name (2-100 characters)"
                                            maxLength={100}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                                    )}
                                    <p className="mt-1 text-xs text-white/50">
                                        {formData.name.length}/100 characters
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                                            errors.description ? 'border-red-500' : 'border-white/20'
                                        }`}
                                        placeholder="Describe your project goals and objectives..."
                                        maxLength={1000}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-white/50">
                                        {formData.description.length}/1000 characters
                                    </p>
                                </div>

                                {/* Workspace Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Workspace *
                                    </label>
                                    <div className="relative">
                                        <Folder
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50"/>
                                        <select
                                            name="workspace"
                                            value={formData.workspace}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.workspace ? 'border-red-500' : 'border-white/20'
                                            }`}
                                        >
                                            <option value="">Select a workspace</option>
                                            {userWorkspaces.map((workspace) => (
                                                <option key={workspace._id} value={workspace._id}>
                                                    {workspace.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.workspace && (
                                        <p className="mt-1 text-sm text-red-400">{errors.workspace}</p>
                                    )}
                                    {userWorkspaces.length === 0 && (
                                        <p className="mt-2 text-sm text-orange-400">
                                            You don't have any workspaces. Please create a workspace first.
                                        </p>
                                    )}
                                </div>

                                {/* Priority and Due Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Priority
                                        </label>
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getPriorityColor(formData.priority)}`}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                        <p className="mt-1 text-xs text-white/50">
                                            Current: {getPriorityText(formData.priority)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Due Date
                                        </label>
                                        <div className="relative">
                                            <Calendar
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50"/>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={formData.dueDate}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.dueDate ? 'border-red-500' : 'border-white/20'
                                                }`}
                                            />
                                        </div>
                                        {errors.dueDate && (
                                            <p className="mt-1 text-sm text-red-400">{errors.dueDate}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Tags
                                    </label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagInputKeyDown}
                                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Add a tag and press Enter"
                                                maxLength={20}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleTagAdd}
                                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {formData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                                                    >
                            {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTagRemove(tag)}
                                                            className="hover:text-blue-300"
                                                        >
                              ×
                            </button>
                          </span>
                                                ))}
                                            </div>
                                        )}
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
                                        disabled={isLoading || userWorkspaces.length === 0}
                                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <div
                                                    className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                                                {isEditMode ? 'Updating...' : 'Creating...'}
                                            </div>
                                        ) : (
                                            isEditMode ? 'Update Project' : 'Create Project'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateProjectModal;