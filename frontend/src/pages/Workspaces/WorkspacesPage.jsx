import React, {useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';

import {useNavigate} from 'react-router-dom';
import {clearError, fetchWorkspaces, setCurrentWorkspace} from "../../features/workspace/workspaceSlice.jsx";
import {openModal} from "../../features/ui/uiSlice.jsx";
import {clearCurrentProject} from "../../features/project/projectSlice.jsx";
import WorkspaceStatsCards from "../../components/Workspaces/WorkspaceStatsCards.jsx";


// Utility to pick a nice color for the workspace card
const getCardGradient = (index) => {
    const gradients = [
        'from-blue-500/20 to-purple-600/20 border-blue-500/30',
        'from-green-500/20 to-teal-600/20 border-green-500/30',
        'from-yellow-500/20 to-orange-600/20 border-yellow-500/30',
        'from-red-500/20 to-pink-600/20 border-red-500/30',
        'from-indigo-500/20 to-blue-600/20 border-indigo-500/30',
        'from-emerald-500/20 to-green-600/20 border-emerald-500/30',
    ];
    return gradients[index % gradients.length];
};

const WorkspacesPage = () => {
    const dispatch = useAppDispatch();
    const {workspaces, isLoading, error} = useAppSelector((state) => state.workspace);
    const {user} = useAppSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchWorkspaces());
        dispatch(clearCurrentProject())
    }, [dispatch]);

    const handleWorkspaceClick = (workspaceId) => {
        const workspace = workspaces.find(ws => ws._id === workspaceId);
        if (workspace) {
            dispatch(setCurrentWorkspace(workspace));
        }
        navigate(`/workspaces/${workspaceId}`);
    };

    const handleCreateWorkspace = () => {
        dispatch(openModal('createWorkspace'));
    };

    // Filter workspaces to show user's workspaces
    const userWorkspaces = workspaces.filter(workspace =>
        workspace.owner?._id === user?._id ||
        workspace.members?.some(member => member.user?._id === user?._id)
    );

    const ownedWorkspaces = userWorkspaces.filter(workspace => workspace.owner?._id === user?._id);
    const memberWorkspaces = userWorkspaces.filter(workspace => workspace.owner?._id !== user?._id);

    const handleRetry = () => {
        dispatch(clearError());
        dispatch(fetchWorkspaces());
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
                        <h1 className="text-3xl font-bold text-white mb-2">Workspaces</h1>
                        <p className="text-white/70">Manage your collaboration spaces</p>
                    </div>
                    <button
                        onClick={handleCreateWorkspace}
                        className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                        + Create Workspace
                    </button>
                </div>
            </motion.div>

            <WorkspaceStatsCards
                userWorkspaces={userWorkspaces}
                ownedWorkspaces={ownedWorkspaces}
                memberWorkspaces={memberWorkspaces}
            />

            {isLoading && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="glass-card text-center py-12"
                >
                    <div className="flex items-center justify-center">
                        <div
                            className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mr-3"></div>
                        <p className="text-white/70">Loading workspaces...</p>
                    </div>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="glass-card p-6"
                >
                    <div className="text-center">
                        <div
                            className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Error Loading Workspaces</h3>
                        <p className="text-white/70 mb-4">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </motion.div>
            )}

            {!isLoading && !error && userWorkspaces.length === 0 && (
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="glass-card text-center py-12"
                >
                    <div
                        className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🏢</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">No Workspaces Yet</h2>
                    <p className="text-white/70 mb-6 max-w-md mx-auto">
                        You don't have any workspaces yet. Create your first workspace to start collaborating with your
                        team.
                    </p>
                    <button
                        onClick={handleCreateWorkspace}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                        Create Your First Workspace
                    </button>
                </motion.div>
            )}

            {!isLoading && !error && userWorkspaces.length > 0 && (
                <div className="space-y-8">
                    {/* Owned Workspaces */}
                    {ownedWorkspaces.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Your Workspaces</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ownedWorkspaces.map((workspace, index) => (
                                    <WorkspaceCard
                                        key={workspace._id}
                                        workspace={workspace}
                                        index={index}
                                        onClick={handleWorkspaceClick}
                                        isOwner={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Member Workspaces */}
                    {memberWorkspaces.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Shared With You</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {memberWorkspaces.map((workspace, index) => (
                                    <WorkspaceCard
                                        key={workspace._id}
                                        workspace={workspace}
                                        index={index + ownedWorkspaces.length}
                                        onClick={handleWorkspaceClick}
                                        isOwner={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Workspace Card Component
const WorkspaceCard = ({workspace, index, onClick, isOwner}) => {
    const getRoleBadge = (workspace, isOwner) => {
        if (isOwner) {
            return <span
                className="px-2 py-1 bg-blue-500/40 text-blue-200 text-xs rounded-full font-medium">Owner</span>;
        }

        const userRole = workspace.members?.find(member => member.user?._id === workspace.userId)?.role;
        return (
            <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${
                userRole === 'admin' ? 'bg-purple-500/40 text-purple-200' :
                    userRole === 'member' ? 'bg-green-500/40 text-green-200' :
                        'bg-gray-500/40 text-gray-200'
            }`}>
        {userRole || 'member'}
      </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: index * 0.05}}
            className={`glass-card p-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 border bg-gradient-to-br ${getCardGradient(index)}`}
            onClick={() => onClick(workspace._id)}
        >
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-white line-clamp-1 flex-1 mr-2">{workspace.name}</h3>
                {getRoleBadge(workspace, isOwner)}
            </div>

            <p className="text-white/70 mb-4 text-sm line-clamp-2">
                {workspace.description || 'No description provided'}
            </p>

            <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Owner:</span>
                    <span className="text-white font-medium">{workspace.owner?.name || 'Unknown'}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Members:</span>
                    <span className="text-white font-medium">{workspace.members?.length || 0}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Created:</span>
                    <span className="text-white/70">{formatDate(workspace.createdAt)}</span>
                </div>

                {workspace.tags && workspace.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {workspace.tags.slice(0, 3).map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 bg-white/20 text-white/90 text-xs rounded-full border border-white/10"
                            >
                {tag}
              </span>
                        ))}
                        {workspace.tags.length > 3 && (
                            <span className="text-white/50 text-xs">
                +{workspace.tags.length - 3}
              </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default WorkspacesPage;