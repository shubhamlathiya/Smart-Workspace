import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {deleteProject, fetchProjects, setCurrentProject} from "../../features/project/projectSlice.jsx";
import {openModal} from "../../features/ui/uiSlice.jsx";
import {useNavigate} from "react-router-dom";
import {showConfirmAlert, showErrorAlert, showSuccessAlert} from "../../utils/alerts.jsx";
import ProjectStatsCards from "../../components/Projects/ProjectStatsCards.jsx";

const ProjectsPage = () => {
    const dispatch = useAppDispatch();
    const {projects, isLoading, currentProject} = useAppSelector((state) => state.project);
    const {user} = useAppSelector((state) => state.auth);

    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        dispatch(fetchProjects());
    }, [dispatch]);

    const handleCreateProject = () => {
        dispatch(openModal('createProject'));
    };

    const handleEditProject = (project) => {
        dispatch(setCurrentProject(project));
        dispatch(openModal('createProject'));
    };

    const handleDeleteProject = async (projectId) => {
        const confirmed = await showConfirmAlert({
            title: 'Delete Project?',
            message: 'Are you sure you want to delete this project? This action cannot be undone.',
            confirmText: 'Yes, delete',
            confirmColor: '#ef4444'
        });

        if (confirmed) {
            try {
                await dispatch(deleteProject(projectId)).unwrap();

                showSuccessAlert(
                    'success',
                    'Project Deleted',
                    'The project has been successfully deleted.'
                );
            } catch (error) {
                showErrorAlert(
                    'error',
                    'Failed',
                    `${error} Unable to delete this project. Please try again.`
                );
            }
        }
    };

    const handleViewProject = (projectId) => {
        console.log(projectId)
        // dispatch(setCurrentProject(project));
        navigate(`/projects/${projectId}`);
        // You can navigate to project detail page or open a modal
        console.log('View project:', projectId);
    };

    // Filter projects based on status and search query
    const filteredProjects = projects.filter(project => {
        const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Group projects by status for stats
    const projectStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on-hold').length,
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

    const getStatusText = (status) => {
        const statusMap = {
            'active': 'Active',
            'completed': 'Completed',
            'on-hold': 'On Hold',
            'planning': 'Planning',
        };
        return statusMap[status] || status;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                        <p className="text-white/70">Manage your projects and track progress</p>
                    </div>
                    <button
                        onClick={handleCreateProject}
                        className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                    >
                        Create New Project
                    </button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <ProjectStatsCards projectStats={projectStats}/>

            {/* Filters and Search */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.2}}
                className="p-4"
            >
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="flex-1 w-full sm:max-w-md">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filters and View Toggle */}
                    <div className="flex gap-4 items-center">
                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active" className="text-black">Active</option>
                            <option value="completed" className="text-black">Completed</option>
                            <option value="on-hold" className="text-black">On Hold</option>
                            <option value="planning" className="text-black">Planning</option>
                        </select>

                        {/* View Toggle */}
                        <div className="flex bg-white/10 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                            >
                                🏠
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                            >
                                📋
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Projects Grid/List */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.3}}
                className=" p-6"
            >
                {isLoading ? (
                    <div className="text-center py-12">
                        <div
                            className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white/70">Loading projects...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <div
                            className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📁</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
                        </h2>
                        <p className="text-white/70 mb-6 max-w-md mx-auto">
                            {searchQuery || filterStatus !== 'all'
                                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                : 'Get started by creating your first project to organize your work and collaborate with your team.'
                            }
                        </p>
                        {(searchQuery || filterStatus !== 'all') ? (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterStatus('all');
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                            >
                                Clear Filters
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateProject}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                            >
                                Create Your First Project
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <div
                                key={project._id}
                                className="bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 hover:transform hover:scale-105"
                                onClick={() => handleViewProject(project._id)}
                            >
                                {/* Project Header */}
                                <div className={`p-4 bg-gradient-to-r ${getStatusColor(project.status)} rounded-t-lg`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-white truncate">{project.name}</h3>
                                        <span className="text-white/80 text-sm bg-white/20 px-2 py-1 rounded-full">
                      {getStatusText(project.status)}
                    </span>
                                    </div>
                                    <p className="text-white/80 text-sm line-clamp-2">{project.description}</p>
                                </div>

                                {/* Project Details */}
                                <div className="p-4">

                                    {/* Project Meta */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-white/70">
                                            <span>Due Date</span>
                                            <span className="text-white">
                        {project.dueDate ? formatDate(project.dueDate) : 'No due date'}
                      </span>
                                        </div>
                                        <div className="flex justify-between text-white/70">
                                            <span>Tasks</span>
                                            <span className="text-white">
                        {project.tasks ? project.tasks.length : 0}
                      </span>
                                        </div>
                                        <div className="flex justify-between text-white/70">
                                            <span>Team</span>
                                            <span className="text-white">
                        {project.assignedMembers ? project.assignedMembers.length : 0} members
                      </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                                        <button
                                            onClick={() => handleViewProject(project._id)}
                                            className="flex-1 py-2 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition-colors"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEditProject(project)}
                                            className="flex-1 py-2 bg-blue-500/20 text-blue-400 text-sm rounded hover:bg-blue-500/30 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProject(project._id)}
                                            className="flex-1 py-2 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // List View
                    <div className="space-y-4">
                        {filteredProjects.map((project) => (
                            <div
                                key={project._id}
                                className="bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div
                                            className={`w-3 h-12 rounded-full bg-gradient-to-b ${getStatusColor(project.status)}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h3 className="text-lg font-bold text-white truncate">{project.name}</h3>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                        project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                                            project.status === 'on-hold' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-purple-500/20 text-purple-400'
                                                }`}>
                          {getStatusText(project.status)}
                        </span>
                                            </div>
                                            <p className="text-white/70 text-sm truncate">{project.description}</p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-white/50">
                                                <span>{project.tasks ? project.tasks.length : 0} tasks</span>
                                                <span>{project.assignedMembers ? project.assignedMembers.length : 0} members</span>
                                                <span>Due: {project.dueDate ? formatDate(project.dueDate) : 'No due date'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">


                                        {/* Actions */}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewProject(project._id)}
                                                className="p-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => handleEditProject(project)}
                                                className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProject(project._id)}
                                                className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ProjectsPage;