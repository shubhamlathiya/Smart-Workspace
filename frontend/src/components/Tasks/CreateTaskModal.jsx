import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {X, Calendar, Users, FileText, Tag, AlertCircle} from 'lucide-react';
import {useAppSelector, useAppDispatch} from '../../hooks/redux';
import {fetchProjects} from "../../features/project/projectSlice.jsx";
import {closeModal} from "../../features/ui/uiSlice.jsx";
import {createTask, updateTask} from "../../features/task/taskSlice.jsx";


const CreateTaskModal = () => {
    const dispatch = useAppDispatch();
    const {modals} = useAppSelector(state => state.ui);
    const {currentTask, isLoading} = useAppSelector(state => state.task);
    const {projects} = useAppSelector(state => state.project);
    const {user} = useAppSelector(state => state.auth);

    const isOpen = modals.createTask;
    const isEditMode = !!currentTask;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        tags: [],
        assignedTo: [],
    });

    const [errors, setErrors] = useState({});
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchProjects());
        }
    }, [dispatch, isOpen]);

    useEffect(() => {
        if (isEditMode && currentTask) {
            setFormData({
                title: currentTask.title || '',
                description: currentTask.description || '',
                project: currentTask.project?._id || '',
                status: currentTask.status || 'todo',
                priority: currentTask.priority || 'medium',
                dueDate: currentTask.dueDate ? currentTask.dueDate.split('T')[0] : '',
                tags: currentTask.tags || [],
                assignedTo: currentTask.assignedTo?.map(a => a.user?._id) || [],
            });
        } else {
            setFormData({
                title: '',
                description: '',
                project: '',
                status: 'todo',
                priority: 'medium',
                dueDate: '',
                tags: [],
                assignedTo: [],
            });
            setErrors({});
            setTagInput('');
        }
    }, [isEditMode, currentTask, isOpen]);

    const handleClose = () => {
        dispatch(closeModal('createTask'));
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

        if (!formData.title.trim()) {
            newErrors.title = 'Task title is required';
        } else if (formData.title.trim().length < 2) {
            newErrors.title = 'Task title must be at least 2 characters';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = 'Task title cannot exceed 100 characters';
        }

        if (!formData.project) {
            newErrors.project = 'Project is required';
        }

        if (formData.description && formData.description.length > 1000) {
            newErrors.description = 'Description cannot exceed 1000 characters';
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
            const taskData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                project: formData.project,
                status: formData.status,
                priority: formData.priority,
                tags: formData.tags,
                assignedTo: formData.assignedTo,
                ...(formData.dueDate && {dueDate: formData.dueDate})
            };

            if (isEditMode) {
                await dispatch(updateTask({
                    taskId: currentTask._id,
                    updateData: taskData
                })).unwrap();
            } else {
                await dispatch(createTask(taskData)).unwrap();
            }

            handleClose();
        } catch (error) {
            console.error('Task operation failed:', error);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': 'border-red-500 text-red-400 bg-red-500/10',
            'high': 'border-orange-500 text-orange-400 bg-orange-500/10',
            'medium': 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
            'low': 'border-green-500 text-green-400 bg-green-500/10',
        };
        return colors[priority] || colors.medium;
    };

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
                                    {isEditMode ? 'Edit Task' : 'Create New Task'}
                                </h2>
                                <p className="text-white/70 text-sm mt-1">
                                    {isEditMode
                                        ? 'Update task details and assignments'
                                        : 'Create a new task for your project'
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
                                {/* Task Title */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Task Title *
                                    </label>
                                    <div className="relative">
                                        <FileText
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50"/>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.title ? 'border-red-500' : 'border-white/20'
                                            }`}
                                            placeholder="Enter task title"
                                            maxLength={100}
                                        />
                                    </div>
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1"/>
                                            {errors.title}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-white/50">
                                        {formData.title.length}/100 characters
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
                                        placeholder="Describe the task details, requirements, and objectives..."
                                        maxLength={1000}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-white/50">
                                        {formData.description.length}/1000 characters
                                    </p>
                                </div>

                                {/* Project Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Project *
                                    </label>
                                    <select
                                        name="project"
                                        value={formData.project}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${errors.project ? 'border-red-500' : 'border-white/20'} text-white`}
                                    >
                                        <option value="">Select a project</option>
                                        {projects.map((project) => (
                                            <option key={project._id} value={project._id} className="text-black">
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.project && (
                                        <p className="mt-1 text-sm text-red-400">{errors.project}</p>
                                    )}
                                </div>

                                {/* Status and Priority */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="review">Review</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

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
                                    </div>
                                </div>

                                {/* Due Date */}
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

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Tags
                                    </label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Tag
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50"/>
                                                <input
                                                    type="text"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={handleTagInputKeyDown}
                                                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Add a tag and press Enter"
                                                    maxLength={20}
                                                />
                                            </div>
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
                                                            className="hover:text-blue-300 text-xs"
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
                                        disabled={isLoading}
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <div
                                                    className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                                                {isEditMode ? 'Updating...' : 'Creating...'}
                                            </div>
                                        ) : (
                                            isEditMode ? 'Update Task' : 'Create Task'
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

export default CreateTaskModal;