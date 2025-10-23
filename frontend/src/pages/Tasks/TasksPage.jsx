// pages/TasksPage.jsx
import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {fetchTasks, setFilters} from "../../features/task/taskSlice.jsx";
import {openModal} from "../../features/ui/uiSlice.jsx";
import KanbanBoardWrapper from "../../components/Tasks/KanbanBoardWrapper.jsx";
import TaskDetailModal from "../../components/Tasks/TaskDetailModal.jsx";
import {useSocket, useProjectSocket} from '../../hooks/useSocket';
import TaskStatsCards from "../../components/Tasks/taskStatCards.jsx";

const TasksPage = () => {
    const dispatch = useAppDispatch();
    const {tasks, isLoading, filters} = useAppSelector(state => state.task);
    const {user} = useAppSelector(state => state.auth);
    const {currentProject} = useAppSelector(state => state.project);
    const {socketService} = useSocket();

    const [viewMode, setViewMode] = useState('list'); // kanban, list, grid
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // Join project room for real-time updates
    useProjectSocket(currentProject?._id);

    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    useEffect(() => {
        if (!socketService || !currentProject?._id) return;

        // Listen for real-time updates with correct event names
        const handleTaskUpdate = () => {
            console.log('Task updated, refreshing tasks...');
            dispatch(fetchTasks());
        };

        const handleNewComment = () => {
            console.log('New comment added, refreshing tasks...');
            dispatch(fetchTasks());
        };

        const handleFileUpdate = () => {
            console.log('File updated, refreshing tasks...');
            dispatch(fetchTasks());
        };

        const handleActivityUpdate = () => {
            console.log('Activity update, refreshing tasks...');
            dispatch(fetchTasks());
        };

        // Register event listeners
        socketService.on('task_updated', handleTaskUpdate);
        socketService.on('task_comment_added', handleNewComment);
        socketService.on('task_file_uploaded', handleFileUpdate);
        socketService.on('task_file_deleted', handleFileUpdate);
        socketService.on('activity_update', handleActivityUpdate);

        // Clean up on unmount
        return () => {
            socketService.off('task_updated', handleTaskUpdate);
            socketService.off('task_comment_added', handleNewComment);
            socketService.off('task_file_uploaded', handleFileUpdate);
            socketService.off('task_file_deleted', handleFileUpdate);
            socketService.off('activity_update', handleActivityUpdate);
        };
    }, [socketService, currentProject?._id, dispatch]);

    const handleCreateTask = () => {
        dispatch(openModal('createTask'));
    };

    const handleCreateTaskInColumn = (columnId) => {
        dispatch(openModal('createTask', {status: columnId}));
    };

    const handleFilterChange = (key, value) => {
        dispatch(setFilters({[key]: value}));
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setSelectedTask(null);
    };

    const taskStats = {
        total: tasks.length,
        todo: tasks.filter(task => task.status === 'todo').length,
        inProgress: tasks.filter(task => task.status === 'in-progress').length,
        review: tasks.filter(task => task.status === 'review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        overdue: tasks.filter(task => {
            if (!task.dueDate || task.status === 'completed') return false;
            return new Date(task.dueDate) < new Date();
        }).length,
    };

    return (<div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
                        <p className="text-white/70">Manage your tasks with Kanban board</p>
                    </div>
                    <button
                        onClick={handleCreateTask}
                        className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
                    >
                        Create New Task
                    </button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <TaskStatsCards taskStats={taskStats}/>

            {/* Filters and View Toggle */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.2}}
                className="glass-card p-4"
            >
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {/* View Toggle */}
                    <div className="flex bg-white/10 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-2 rounded flex items-center space-x-2 transition-colors ${viewMode === 'kanban' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                        >
                            <span>📊</span>
                            <span className="text-sm">Kanban</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 rounded flex items-center space-x-2 transition-colors ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                        >
                            <span>📋</span>
                            <span className="text-sm">List</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 rounded flex items-center space-x-2 transition-colors ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                        >
                            <span>⏹️</span>
                            <span className="text-sm">Grid</span>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="todo" className="text-black">To Do</option>
                            <option value="in-progress" className="text-black">In Progress</option>
                            <option value="review" className="text-black">Review</option>
                            <option value="completed" className="text-black">Completed</option>
                        </select>

                        <select
                            value={filters.priority || ''}
                            onChange={(e) => handleFilterChange('priority', e.target.value)}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Priority</option>
                            <option value="low" className="text-black">Low</option>
                            <option value="medium" className="text-black">Medium</option>
                            <option value="high" className="text-black">High</option>
                            <option value="urgent" className="text-black">Urgent</option>
                        </select>

                        <select
                            value={filters.assignedTo || ''}
                            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Assignees</option>
                            <option value="me" className="text-black">Assigned to Me</option>
                            <option value="unassigned" className="text-black">Unassigned</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Content Area */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.3}}
                className="glass-card p-6"
            >
                {isLoading ? (<div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div
                                className="w-12 h-12 border-t-2 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-white/70">Loading tasks...</p>
                        </div>
                    </div>) : viewMode === 'kanban' ? (<KanbanBoardWrapper
                        projectId={currentProject?._id}
                        onTaskClick={handleTaskClick}
                        onAddTask={handleCreateTaskInColumn}
                    />) : viewMode === 'list' ? (<div className="space-y-3">
                        {tasks.length > 0 ? (tasks.map((task) => (
                                <TaskListItem key={task._id} task={task} onClick={() => handleTaskClick(task)}/>))) : (
                            <div className="text-center py-8">
                                <p className="text-white/70">No tasks found</p>
                                <button
                                    onClick={handleCreateTask}
                                    className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Create your first task
                                </button>
                            </div>)}
                    </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.length > 0 ? (tasks.map((task) => (
                                <TaskGridItem key={task._id} task={task} onClick={() => handleTaskClick(task)}/>))) : (
                            <div className="col-span-full text-center py-8">
                                <p className="text-white/70">No tasks found</p>
                                <button
                                    onClick={handleCreateTask}
                                    className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Create your first task
                                </button>
                            </div>)}
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

// Simple list and grid item components
const TaskListItem = ({task, onClick}) => (<div
        onClick={onClick}
        className="p-4 bg-gradient-to-r from-white/5 to-white/2 rounded-xl border border-white/10 hover:border-white/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3 overflow-hidden">
                <h3 className="text-white font-semibold truncate">{task.title}</h3>
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    {task.priority}
                </span>
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-500/20 text-green-400' : task.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' : task.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {task.status.replace('-', ' ')}
                </span>
            </div>
            <div className="text-white/70 text-sm">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </div>
        </div>
        {task.description && (<p className="text-white/60 text-sm line-clamp-2">{task.description}</p>)}
    </div>);


const TaskGridItem = ({task, onClick}) => (<div
        onClick={onClick}
        className="p-4 bg-gradient-to-b from-white/5 to-white/2 rounded-xl border border-white/10 hover:border-white/20 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between h-full"
    >
        <div>
            <h3 className="text-white font-semibold mb-2 truncate">{task.title}</h3>
            {task.description && (<p className="text-white/70 text-sm mb-3 line-clamp-3">{task.description}</p>)}
        </div>
        <div className="flex justify-between items-center mt-2">
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                {task.priority}
            </span>
            <span className="text-white/70 text-xs">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </span>
        </div>
    </div>);


export default TasksPage;