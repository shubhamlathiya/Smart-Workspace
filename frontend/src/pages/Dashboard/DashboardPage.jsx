import React, {useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

// Components
import StatsCard from '../../components/Dashboard/StatsCard';
import RecentActivity from '../../components/Dashboard/RecentActivity';
import QuickActions from '../../components/Dashboard/QuickActions';
import {openModal} from "../../features/ui/uiSlice.jsx";
import {fetchTasks} from "../../features/task/taskSlice.jsx";
import {fetchWorkspaces} from "../../features/workspace/workspaceSlice.jsx";
import {fetchProjects} from "../../features/project/projectSlice.jsx";
import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";

const DashboardPage = () => {
    const dispatch = useAppDispatch();
    const {user} = useAppSelector(state => state.auth);
    const {workspaces, isLoading: workspaceLoading} = useAppSelector(state => state.workspace);
    const {projects, isLoading: projectLoading} = useAppSelector(state => state.project);
    const {tasks, isLoading: taskLoading} = useAppSelector(state => state.task);

    useEffect(() => {
        // Fetch all data when component mounts
        dispatch(fetchWorkspaces());
        dispatch(fetchProjects());
        dispatch(fetchTasks());
    }, [dispatch]);

    const handleCreateWorkspace = () => {
        dispatch(openModal('createWorkspace'));
    };

    const handleCreateProject = () => {
        dispatch(openModal('createProject'));
    };

    // Calculate real statistics
    const calculateStats = () => {
        const userWorkspaces = workspaces.filter(workspace => workspace.owner?._id === user?._id || workspace.members?.some(member => member.user?._id === user?._id));

        const userProjects = projects.filter(project => project.createdBy?._id === user?._id || project.assignedMembers?.some(member => member.user?._id === user?._id));

        const userTasks = tasks.filter(task => task.assignedTo?.some(assignment => assignment.user?._id === user?._id));

        const completedTasks = userTasks.filter(task => task.status === 'completed').length;
        const completionRate = userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0;

        // Calculate overdue tasks
        const overdueTasks = userTasks.filter(task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed').length;

        // Calculate tasks by status
        const tasksByStatus = {
            todo: userTasks.filter(task => task.status === 'todo').length,
            inProgress: userTasks.filter(task => task.status === 'in-progress').length,
            review: userTasks.filter(task => task.status === 'review').length,
            completed: completedTasks
        };

        return {
            totalWorkspaces: userWorkspaces.length,
            totalProjects: userProjects.length,
            totalTasks: userTasks.length,
            completionRate,
            overdueTasks,
            tasksByStatus,
            userWorkspaces,
            userProjects,
            userTasks
        };
    };

    const stats = calculateStats();
    const isLoading = workspaceLoading || projectLoading || taskLoading;

    // Get recent activities (last 5 items)
    const getRecentActivities = () => {
        const activities = [];

        // Add recent workspaces
        stats.userWorkspaces.slice(0, 3).forEach(workspace => {
            activities.push({
                id: workspace._id,
                type: 'workspace',
                action: 'created',
                title: workspace.name,
                description: 'Workspace was created',
                timestamp: workspace.createdAt,
                user: workspace.owner
            });
        });

        // Add recent projects
        stats.userProjects.slice(0, 3).forEach(project => {
            activities.push({
                id: project._id,
                type: 'project',
                action: 'created',
                title: project.name,
                description: 'Project was created',
                timestamp: project.createdAt,
                user: project.createdBy
            });
        });

        // Add recent tasks
        stats.userTasks.slice(0, 4).forEach(task => {
            activities.push({
                id: task._id,
                type: 'task',
                action: 'created',
                title: task.title,
                description: 'Task was created',
                timestamp: task.createdAt,
                user: task.createdBy
            });
        });

        // Sort by timestamp and return latest 5
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    };

    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-96">
            <LoadingSpinner size="large" text="Loading dashboard..."/>
        </div>);
    }

    // Define the status data array once with all necessary properties
    const taskStatuses = [
        {
            label: 'To Do',
            key: 'todo',
            color: '#374151', // Slate Gray
            bg: 'rgba(55,65,81,0.25)', // Muted Glass Background
            chartFill: '#374151'
        },
        {
            label: 'In Progress',
            key: 'inProgress',
            color: '#92400e', // Burnt Orange
            bg: 'rgba(146,64,14,0.25)',
            chartFill: '#92400e'
        },
        {
            label: 'In Review',
            key: 'review',
            color: '#4338ca', // Indigo
            bg: 'rgba(67,56,202,0.25)',
            chartFill: '#4338ca'
        },
        {
            label: 'Completed',
            key: 'completed',
            color: '#065f46', // Deep Teal
            bg: 'rgba(6,95,70,0.25)',
            chartFill: '#065f46'
        },
    ];

    const hasData = stats.totalWorkspaces > 0 || stats.totalProjects > 0 || stats.totalTasks > 0;

    return (<div className="space-y-6">
        {/* Welcome section */}
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5}}

        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-white/70">
                        {hasData ? "Here's what's happening in your workspace today." : "Let's get started with your first workspace!"}
                    </p>
                </div>
                {hasData && (<div className="mt-4 sm:mt-0">
              <span className="text-sm text-white/50">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
                </div>)}
            </div>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.1}}
            >
                <StatsCard
                    title="Total Workspaces"
                    value={stats.totalWorkspaces.toString()}
                    icon="🏢"
                    color="blue"
                    description="Workspaces you own or belong to"
                />
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.2}}
            >
                <StatsCard
                    title="Active Projects"
                    value={stats.totalProjects.toString()}
                    icon="📁"
                    color="green"
                    description="Projects you're involved in"
                />
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.3}}
            >
                <StatsCard
                    title="Tasks Assigned"
                    value={stats.totalTasks.toString()}
                    icon="✅"
                    color="purple"
                    description="Total tasks assigned to you"
                    subValue={stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : undefined}
                    subValueColor={stats.overdueTasks > 0 ? 'red' : 'green'}
                />
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.4}}
            >
                <StatsCard
                    title="Completion Rate"
                    value={`${stats.completionRate}%`}
                    icon="📈"
                    color="orange"
                    description="Task completion progress"
                    progress={stats.completionRate}
                />
            </motion.div>
        </div>



        {stats.totalTasks > 0 && (
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.5}}
                className=" p-6"
            >
                <h3 className="text-xl font-bold text-gray-100 mb-6">Task Overview</h3>

                {/* Task Status Cards (Glass View) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {taskStatuses.map((status) => {
                        const count = stats.tasksByStatus[status.key] || 0;
                        const percentage = stats.totalTasks
                            ? Math.round((count / stats.totalTasks) * 100)
                            : 0;

                        return (
                            <div
                                key={status.label}
                                // KEY GLASSMORPHISM STYLES: backdrop-blur-xl and border-white/10
                                className="p-5 rounded-xl border border-white/10 **backdrop-blur-xl**
transition-all duration-300 flex flex-col justify-between
hover:shadow-lg hover:scale-105"
                                style={{backgroundColor: status.bg}} // Uses light RGBA background
                            >
                                {/* Status Count */}
                                <div className="flex items-center justify-between mb-3">
                                    <div
                                        className="text-3xl font-extrabold drop-shadow-md"
                                        style={{color: status.color}}
                                    >
                                        {count}
                                    </div>
                                    <div
                                        className="text-sm font-semibold uppercase tracking-wide"
                                        style={{color: '#E2E8F0'}}
                                    >
                                        {status.label}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mt-auto">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: status.color,
                                        }}
                                    ></div>
                                </div>

                                {/* Percentage Label */}
                                <div className="text-xs text-gray-300 mt-2 text-right">
                                    {percentage}% of total tasks
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- */}

                {/* Pie Chart Section (Uses consistent colors) */}
                <div className="flex flex-col items-center justify-center mt-10">
                    <h4 className="text-lg font-semibold text-gray-100 mb-4">
                        Task Status Distribution
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={taskStatuses.map(status => ({
                                    name: status.label,
                                    value: stats.tasksByStatus[status.key] || 0,
                                }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={110}
                                dataKey="value"
                                label={({name, percent}) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {/* Map over the status array for chart cell colors */}
                                {taskStatuses.map((status) => (
                                    <Cell key={status.key} fill={status.chartFill}/>
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15,23,42,0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#F8FAFC',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{
                                    color: '#E2E8F0',
                                    marginTop: '10px',
                                    fontSize: '0.9rem',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        )}

        {/* Main content grid */}
        {hasData ? (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <motion.div
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                transition={{duration: 0.5, delay: 0.6}}
                className="lg:col-span-1"
            >
                <QuickActions
                    workspaceCount={stats.totalWorkspaces}
                    projectCount={stats.totalProjects}
                    taskCount={stats.totalTasks}
                />
            </motion.div>

            {/* Recent Activity */}
            <motion.div
                initial={{opacity: 0, x: 20}}
                animate={{opacity: 1, x: 0}}
                transition={{duration: 0.5, delay: 0.7}}
                className="lg:col-span-2"
            >
                <RecentActivity activities={getRecentActivities()}/>
            </motion.div>
        </div>) : (/* Empty state for new users */
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.5}}
                className="glass-card text-center py-12"
            >
                <div
                    className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🚀</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                    Ready to get started?
                </h2>
                <p className="text-white/70 mb-6 max-w-md mx-auto">
                    Create your first workspace and start collaborating with your team.
                    You'll be able to organize projects, assign tasks, and track progress all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                        onClick={handleCreateWorkspace}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                        whileHover={{scale: 1.05}}
                        whileTap={{scale: 0.95}}
                    >
                        Create Your First Workspace
                    </motion.button>
                    <button
                        onClick={() => window.open('https://docs.smartworkspace.com', '_blank')}
                        className="px-6 py-3 glass-button text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                        Learn More
                    </button>
                </div>
            </motion.div>)}

        {/* Quick Tips Section */}
        {hasData && stats.totalTasks > 0 && (<motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.8}}
            className="glass-card p-6"
        >
            <h3 className="text-xl font-bold text-white mb-4">Quick Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.overdueTasks > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-400 mb-2">
                            <span>⚠️</span>
                            <span className="font-semibold">Attention Needed</span>
                        </div>
                        <p className="text-red-300 text-sm">
                            You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}.
                            Review them soon.
                        </p>
                    </div>)}

                {stats.tasksByStatus.todo > 0 && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-400 mb-2">
                            <span>📋</span>
                            <span className="font-semibold">Tasks Pending</span>
                        </div>
                        <p className="text-blue-300 text-sm">
                            {stats.tasksByStatus.todo} task{stats.tasksByStatus.todo > 1 ? 's' : ''} waiting to
                            be started.
                        </p>
                    </div>)}


                {stats.completionRate >= 80 && (<div
                    className="p-4 bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-l-4 border-green-500 rounded-r-xl backdrop-blur-md">
                    <div className="flex items-start space-x-3">
                        <div
                            className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-green-400 text-sm">★</span>
                        </div>
                        <div>
                            <div className="text-green-300 font-semibold mb-1">Exceptional Progress</div>
                            <p className="text-green-200 text-sm leading-relaxed">
                                With <span
                                className="text-green-400 font-semibold">{stats.completionRate}%</span> of
                                tasks completed,
                                you're demonstrating outstanding productivity and efficiency.
                            </p>
                        </div>
                    </div>
                </div>)}
            </div>
        </motion.div>)}
    </div>);
};

export default DashboardPage;