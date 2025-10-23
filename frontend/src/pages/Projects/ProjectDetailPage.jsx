import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useParams, useNavigate} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {
    deleteProject, fetchProjectById, removeProjectMember, updateProject
} from "../../features/project/projectSlice.jsx";
import {
    fetchTasks
} from "../../features/task/taskSlice.jsx";
import {openModal} from "../../features/ui/uiSlice.jsx";
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';
import KanbanBoardWrapper from '../../components/Tasks/KanbanBoardWrapper.jsx';
import {showConfirmAlert, showErrorAlert, showSuccessAlert} from "../../utils/alerts.jsx";
import {useSocket, useProjectSocket} from '../../hooks/useSocket';
import StatsCard from "../../components/Dashboard/StatsCard.jsx";

const ProjectDetailPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {currentProject, isLoading, isUpdating} = useAppSelector((state) => state.project);
    const {tasks, isLoading: tasksLoading} = useAppSelector((state) => state.task);
    const {user} = useAppSelector((state) => state.auth);
    const {socketService} = useSocket();

    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'kanban', 'grid'

    // Join project room for real-time updates
    useProjectSocket(id);

    useEffect(() => {
        if (id) {
            dispatch(fetchProjectById(id));
            dispatch(fetchTasks({projectId: id}));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (currentProject) {
            setEditData({
                name: currentProject.name || '',
                description: currentProject.description || '',
                status: currentProject.status || 'active',
                priority: currentProject.priority || 'medium',
                dueDate: currentProject.dueDate || '',
            });
        }
    }, [currentProject]);

    // Listen for real-time updates
    useEffect(() => {
        if (!socketService || !id) return;

        const handleTaskUpdate = () => {
            console.log('Task updated, refreshing tasks...');
            dispatch(fetchTasks({projectId: id}));
        };

        const handleNewComment = () => {
            console.log('New comment added, refreshing tasks...');
            dispatch(fetchTasks({projectId: id}));
        };

        const handleFileUpdate = () => {
            console.log('File updated, refreshing tasks...');
            dispatch(fetchTasks({projectId: id}));
        };

        const handleActivityUpdate = () => {
            console.log('Activity update, refreshing tasks...');
            dispatch(fetchTasks({projectId: id}));
        };

        // Register event listeners
        socketService.on('task_updated', handleTaskUpdate);
        socketService.on('task_comment_added', handleNewComment);
        socketService.on('task_file_uploaded', handleFileUpdate);
        socketService.on('task_file_deleted', handleFileUpdate);
        socketService.on('activity_update', handleActivityUpdate);

        // Clean up
        return () => {
            socketService.off('task_updated', handleTaskUpdate);
            socketService.off('task_comment_added', handleNewComment);
            socketService.off('task_file_uploaded', handleFileUpdate);
            socketService.off('task_file_deleted', handleFileUpdate);
            socketService.off('activity_update', handleActivityUpdate);
        };
    }, [socketService, id, dispatch]);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleEditChange = (e) => {
        const {name, value} = e.target;
        setEditData(prev => ({
            ...prev, [name]: value
        }));
    };

    const handleSaveEdit = async () => {
        try {
            await dispatch(updateProject({
                projectId: currentProject._id, updateData: editData
            })).unwrap();

            // Emit project update via socket
            if (socketService) {
                socketService.emitActivityUpdate({
                    workspaceId: currentProject.workspace?._id,
                    projectId: currentProject._id,
                    type: 'project_updated',
                    user: user.name,
                    timestamp: new Date(),
                });
            }

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update project:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditData({
            name: currentProject.name || '',
            description: currentProject.description || '',
            status: currentProject.status || 'active',
            priority: currentProject.priority || 'medium',
            dueDate: currentProject.dueDate || '',
        });
        setIsEditing(false);
    };

    const handleDeleteProject = async () => {
        const confirmed = await showConfirmAlert({
            title: 'Delete Project?',
            message: 'Are you sure you want to delete this project? This action cannot be undone.',
            confirmText: 'Yes, delete',
            confirmColor: '#ef4444'
        });

        if (confirmed) {
            try {
                await dispatch(deleteProject(currentProject._id)).unwrap();

                // Emit project deletion via socket
                if (socketService) {
                    socketService.emitActivityUpdate({
                        workspaceId: currentProject.workspace?._id,
                        projectId: currentProject._id,
                        type: 'project_deleted',
                        user: user.name,
                        timestamp: new Date(),
                    });
                }

                showSuccessAlert('success', 'Project Deleted', 'The project has been successfully deleted.');

                navigate('/projects');
            } catch (error) {
                showErrorAlert('error', 'Failed', 'Unable to delete this project. Please try again.');
            }
        }
    };

    const handleAddMember = () => {
        dispatch(openModal('inviteMember'));
    };

    const handleRemoveMember = async (memberId) => {
        const confirmed = await showConfirmAlert({
            title: 'Remove Member?',
            text: 'Are you sure you want to remove this member from the project?',
            confirmText: 'Yes, remove',
        });

        if (confirmed) {
            try {
                await dispatch(removeProjectMember({
                    projectId: currentProject._id, userId: memberId
                })).unwrap();

                // Emit member removal via socket
                if (socketService) {
                    socketService.emitActivityUpdate({
                        workspaceId: currentProject.workspace?._id,
                        projectId: currentProject._id,
                        type: 'member_removed',
                        user: user.name,
                        timestamp: new Date(),
                    });
                }

                showSuccessAlert('Member removed successfully');
            } catch (err) {
                showErrorAlert('Failed to remove member. Please try again.');
            }
        }
    };

    const handleCreateTask = () => {
        dispatch(openModal('createTask', {projectId: currentProject._id}));
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setSelectedTask(null);
    };

    const handleCreateTaskInColumn = (columnId) => {
        dispatch(openModal('createTask', {
            projectId: currentProject._id, status: columnId
        }));
    };

    const getStatusColor = (status) => {
        const colors = {
            'active': 'from-green-500 to-emerald-600',
            'completed': 'from-blue-500 to-cyan-600',
            'on-hold': 'from-orange-500 to-red-600',
            'planning': 'from-purple-500 to-indigo-600',
        };
        return colors[status] || 'from-gray-500 to-gray-600';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'text-red-400 bg-red-500/20 border-red-500/30',
            'medium': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
            'low': 'text-green-400 bg-green-500/20 border-green-500/30',
            'urgent': 'text-red-500 bg-red-500/20 border-red-500/30',
        };
        return colors[priority] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            'todo': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'completed': 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return colors[status] || colors.todo;
    };

    const getPriorityText = (priority) => {
        const texts = {
            'high': 'High', 'medium': 'Medium', 'low': 'Low', 'urgent': 'Urgent',
        };
        return texts[priority] || priority;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const calculateProgress = () => {
        if (!tasks || tasks.length === 0) return 0;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        return Math.round((completedTasks / tasks.length) * 100);
    };

    const getTaskStats = () => {
        const total = tasks.length;
        const completed = tasks.filter(task => task.status === 'completed').length;
        const pending = total - completed;
        const overdue = tasks.filter(task => {
            if (!task.dueDate || task.status === 'completed') return false;
            return new Date(task.dueDate) < new Date();
        }).length;

        return {total, completed, pending, overdue};
    };

    const getTasksByStatus = (status) => {
        return tasks.filter(task => task.status === status);
    };

    if (isLoading) {
        return (<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div
                    className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/70">Loading project details...</p>
            </div>
        </div>);
    }

    if (!currentProject) {
        return (<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div
                    className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">❌</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Project Not Found</h2>
                <p className="text-white/70 mb-6">The project you're looking for doesn't exist or you don't have
                    access to it.</p>
                <button
                    onClick={() => navigate('/projects')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                >
                    Back to Projects
                </button>
            </div>
        </div>);
    }

    const taskStats = getTaskStats();
    const progress = calculateProgress();

    // Task List Item Component
    const TaskListItem = ({task}) => (<div
        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group"
        onClick={() => handleTaskClick(task)}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
                <div
                    className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-blue-500' : task.status === 'review' ? 'bg-yellow-500' : 'bg-gray-500'}`}/>
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate">{task.title}</h4>
                    {task.description && (<p className="text-white/70 text-sm truncate">{task.description}</p>)}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadgeColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                    </span>
                <span
                    className={`px-2 py-1 rounded-full text-xs border ${task.assignedTo.length > 0 ? 'border-green-400 text-green-400' : 'border-red-400 text-red-400'}`}>
                        {task.assignedTo.length > 0 ? task.assignedTo.map(a => a.user.name).join(', ') : 'Not Assigned'}
                    </span>
                {task.dueDate && (<span
                    className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-400' : 'text-white/70'}`}>
                            {formatDate(task.dueDate)}
                        </span>)}
                {task.comments?.length > 0 && (<span className="text-white/70 text-xs flex items-center space-x-1">
                            <span>💬</span>
                            <span>{task.comments.length}</span>
                        </span>)}
            </div>
        </div>
    </div>);

    // Task Grid Item Component
    const TaskGridItem = ({task}) => (<div
        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group"
        onClick={() => handleTaskClick(task)}
    >
        <div className="flex items-start justify-between mb-3">
            <h4 className="text-white font-semibold text-sm line-clamp-2 flex-1">{task.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
        </div>

        {task.description && (<p className="text-white/70 text-sm mb-3 line-clamp-2">{task.description}</p>)}

        <div className="flex items-center justify-between text-xs text-white/70">
                <span className={`px-2 py-1 rounded-full border ${getStatusBadgeColor(task.status)}`}>
                    {task.status.replace('-', ' ')}
                </span>
            <div className="flex items-center space-x-2">
                {task.comments?.length > 0 && (<span className="flex items-center space-x-1">
                            <span>💬</span>
                            <span>{task.comments.length}</span>
                        </span>)}
                {task.dueDate && (<span
                    className={new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-400' : ''}>
                            {formatDate(task.dueDate)}
                        </span>)}
            </div>
        </div>
    </div>);

    return (<div className="space-y-6">
        {/* Header */}
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5}}
        >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                    {isEditing ? (<input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="w-full text-3xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />) : (<h1 className="text-3xl font-bold text-white mb-2">{currentProject.name}</h1>)}

                    {isEditing ? (<textarea
                        name="description"
                        value={editData.description}
                        onChange={handleEditChange}
                        rows="2"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Project description..."
                    />) : (<p className="text-white/70 text-lg">{currentProject.description}</p>)}
                </div>

                <div className="flex gap-3">
                    {isEditing ? (<>
                        <button
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                        >
                            {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </>) : (<>
                        <button
                            onClick={handleEditToggle}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                        >
                            Edit Project
                        </button>
                        <button
                            onClick={handleDeleteProject}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200"
                        >
                            Delete
                        </button>
                    </>)}
                </div>
            </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard title="Progress" value={`${progress}%`} color="green" icon="TrendingUp" progress={progress}/>
            <StatsCard title="Total Tasks" value={taskStats.total} subValue={`${taskStats.completed} completed`}
                       color="blue" icon="CheckSquare"/>
            <StatsCard title="Pending" value={taskStats.pending} color="yellow" icon="Clock"/>
            <StatsCard title="Overdue" value={taskStats.overdue} color="red" icon="AlertCircle"/>
            <StatsCard title="Team Members" value={currentProject.assignedMembers?.length || 0} color="purple"
                       icon="Users"/>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.2}}
            className=" p-4"
        >
            <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                {['overview', 'tasks', 'team', 'settings'].map((tab) => (<button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>))}
            </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.3}}
            className=" p-6"
        >
            {/* Overview Tab */}
            {activeTab === 'overview' && (<div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Project Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">Project Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Priority */}
                                <div className="glass-card p-4">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Priority</label>
                                    {isEditing ? (
                                        <select
                                            name="priority"
                                            value={editData.priority}
                                            onChange={handleEditChange}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(currentProject.priority)}`}>
              {getPriorityText(currentProject.priority)}
            </span>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div className="glass-card p-4">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Due Date</label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={editData.dueDate ? editData.dueDate.split('T')[0] : ''}
                                            onChange={handleEditChange}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-white">{formatDate(currentProject.dueDate)}</p>
                                    )}
                                </div>

                                {/* Created At */}
                                <div className="glass-card p-4">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Created</label>
                                    <p className="text-white">{formatDate(currentProject.createdAt)}</p>
                                </div>

                                {/* Last Updated */}
                                <div className="glass-card p-4">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Last Updated</label>
                                    <p className="text-white">{formatDate(currentProject.updatedAt)}</p>
                                </div>

                                {/* Workspace */}
                                {currentProject.workspace && (
                                    <div className="glass-card p-4 md:col-span-2">
                                        <label className="block text-sm font-medium text-white/70 mb-2">Workspace</label>
                                        <p className="text-white font-semibold">{currentProject.workspace.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-4">
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className="glass-card w-full p-4 flex items-center space-x-4 hover:shadow-lg transition-shadow duration-200"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-lg">
                                        ➕
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-semibold">Add New Task</p>
                                        <p className="text-white/70 text-sm">Create a new task in this project</p>
                                    </div>
                                </button>

                                <button
                                    onClick={handleAddMember}
                                    className="glass-card w-full p-4 flex items-center space-x-4 hover:shadow-lg transition-shadow duration-200"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-lg">
                                        👥
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-semibold">Invite Team Member</p>
                                        <p className="text-white/70 text-sm">Add someone to this project</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (<div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-xl font-bold text-white">Tasks</h3>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-white/10 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded flex items-center space-x-2 ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                            >
                                <span>📋</span>
                                <span className="text-sm">List</span>
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded flex items-center space-x-2 ${viewMode === 'kanban' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                            >
                                <span>📊</span>
                                <span className="text-sm">Kanban</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded flex items-center space-x-2 ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                            >
                                <span>⏹️</span>
                                <span className="text-sm">Grid</span>
                            </button>
                        </div>

                        <button
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                            onClick={handleCreateTask}
                        >
                            Add Task
                        </button>
                    </div>
                </div>

                {tasksLoading ? (<div className="flex items-center justify-center h-32">
                    <div className="text-center">
                        <div
                            className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-white/70">Loading tasks...</p>
                    </div>
                </div>) : tasks.length > 0 ? (<>
                    {viewMode === 'kanban' ? (<KanbanBoardWrapper
                        projectId={currentProject._id}
                        onTaskClick={handleTaskClick}
                        onAddTask={handleCreateTaskInColumn}
                    />) : viewMode === 'list' ? (<div className="space-y-3">
                        {tasks.map((task) => (<TaskListItem key={task._id} task={task}/>))}
                    </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map((task) => (<TaskGridItem key={task._id} task={task}/>))}
                    </div>)}
                </>) : (<div className="text-center py-12">
                    <div
                        className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">📝</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">No Tasks Yet</h4>
                    <p className="text-white/70 mb-6">Get started by creating your first task for this
                        project.</p>
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                        onClick={handleCreateTask}
                    >
                        Create First Task
                    </button>
                </div>)}
            </div>)}

            {/* Team Tab */}
            {activeTab === 'team' && (<div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Team Members</h3>
                    {currentProject.createdBy === user._id ? (<button
                        onClick={handleAddMember}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                        Add Member
                    </button>) : (<p className="text-white/50 text-sm">
                        Only the project creator can add members.
                    </p>)}
                </div>

                {currentProject.assignedMembers && currentProject.assignedMembers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentProject.assignedMembers.map((member) => (
                            <div
                                key={member.user._id}
                                className="glass-card p-5 hover:shadow-lg transition-shadow duration-200 border border-white/10 rounded-xl"
                            >
                                {/* Member Info */}
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                        {member.user.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-white font-semibold">{member.user.name}</h4>
                                        <p className="text-white/70 text-sm truncate">{member.user.email}</p>
                                    </div>
                                </div>

                                {/* Role and Actions */}
                                <div className="flex justify-between items-center">
        <span className="px-3 py-1 bg-blue-500/20 text-white text-xs font-medium rounded-full">
          {member.role}
        </span>

                                    {currentProject.createdBy === user._id && user._id !== member.user._id && (
                                        <button
                                            onClick={() => handleRemoveMember(member.user._id)}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (<div className="text-center py-12">
                    <div
                        className="w-24 h-24 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">👥</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">No Team Members</h4>
                    <p className="text-white/70 mb-6">Add team members to collaborate on this project.</p>
                    <button
                        onClick={handleAddMember}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                        Add First Member
                    </button>
                </div>)}
            </div>)}

            {/* Settings Tab */}
            {activeTab === 'settings' && (<div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Project Settings</h3>

                <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <h4 className="text-red-400 font-semibold mb-2">Danger Zone</h4>
                        <p className="text-white/70 text-sm mb-4">
                            Once you delete a project, there is no going back. Please be certain.
                        </p>

                        {currentProject.createdBy === user._id ? (<button
                            onClick={handleDeleteProject}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200"
                        >
                            Delete Project
                        </button>) : (<p className="text-white/50 text-sm">
                            Only the project creator can delete this project.
                        </p>)}
                    </div>
                </div>
            </div>)}
        </motion.div>

        {/* Task Detail Modal */}
        <TaskDetailModal
            task={selectedTask}
            isOpen={isTaskModalOpen}
            onClose={handleCloseTaskModal}
        />
    </div>);
};

export default ProjectDetailPage;