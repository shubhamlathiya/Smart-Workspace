import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {useParams, useNavigate} from 'react-router-dom';
import {
    deleteWorkspace,
    fetchWorkspaceById,
    removeMember,
    updateWorkspace
} from "../../features/workspace/workspaceSlice.jsx";
import {openModal} from "../../features/ui/uiSlice.jsx";
import Swal from "sweetalert2";
import {showConfirmAlert, showErrorAlert, showSuccessAlert} from "../../utils/alerts.jsx";
import QuickStats from "../../components/Workspaces/QuickStats.jsx";
import WorkspaceOverview from "../../components/Workspaces/WorkspaceOverview.jsx";


const WorkspaceDetailPage = () => {
    const dispatch = useAppDispatch();
    const {id} = useParams();
    const navigate = useNavigate();
    const {currentWorkspace, isLoading, error} = useAppSelector((state) => state.workspace);
    const {user} = useAppSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        if (id) {
            dispatch(fetchWorkspaceById(id));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (currentWorkspace) {
            setEditData({
                name: currentWorkspace.name || '',
                description: currentWorkspace.description || '',
                tags: currentWorkspace.tags?.join(', ') || '',
                settings: {
                    isPublic: currentWorkspace.settings?.isPublic || false,
                    allowInvites: currentWorkspace.settings?.allowInvites || true,
                }
            });
        }
    }, [currentWorkspace]);

    const handleSave = async () => {
        try {
            const updateData = {
                ...editData,
                tags: editData.tags ? editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            };

            await dispatch(updateWorkspace({
                workspaceId: currentWorkspace._id,
                updateData
            })).unwrap();

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update workspace:', error);
        }
    };

    const handleDelete = async () => {
        const confirmed = await showConfirmAlert({
            title: 'Delete Workspace?',
            message: 'Are you sure you want to delete this workspace? This action cannot be undone.',
            confirmText: 'Yes, delete',
            confirmColor: '#ef4444'
        });

        if (confirmed) {
            try {
                await dispatch(deleteWorkspace(currentWorkspace._id)).unwrap();

                showSuccessAlert(
                    'success',
                    'Workspace Deleted',
                    'The workspace has been successfully deleted.'
                );

                navigate('/workspaces');
            } catch (e) {
                showErrorAlert(
                    'error',
                    'Failed',
                    'Unable to delete this workspace. Please try again.'
                );
            }
        }
    };

    const handleInviteMember = () => {
        dispatch(openModal('inviteMember'));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRemoveMember = async (memberId) => {
        const confirmed = await showConfirmAlert({
            title: 'Remove Member?',
            message: 'Are you sure you want to remove this member from the workspace?',
            confirmText: 'Yes, remove'
        });

        if (confirmed) {
            try {
                await dispatch(removeMember({
                    workspaceId: currentWorkspace._id,
                    userId: memberId
                })).unwrap();

                showSuccessAlert('Member removed successfully');
            } catch (error) {
                showErrorAlert('Failed to remove member. Please try again.');
            }
        }
    };

    const isOwner = currentWorkspace?.owner?._id === user?._id;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/70">Loading workspace details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Workspace Not Found</h2>
                    <p className="text-white/70 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/workspaces')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                        Back to Workspaces
                    </button>
                </div>
            </div>
        );
    }

    if (!currentWorkspace) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
            >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.name}
                                onChange={(e) => setEditData({...editData, name: e.target.value})}
                                className="w-full text-3xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                placeholder="Workspace name"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold text-white mb-2">{currentWorkspace.name}</h1>
                        )}

                        {isEditing ? (
                            <textarea
                                value={editData.description}
                                onChange={(e) => setEditData({...editData, description: e.target.value})}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Workspace description"
                                rows="2"
                            />
                        ) : (
                            <p className="text-white/70 text-lg">{currentWorkspace.description || 'No description provided'}</p>
                        )}
                    </div>

                    {isOwner && (
                        <div className="flex gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                                    >
                                        Edit Workspace
                                    </button>
                                    <button
                                        onClick={handleInviteMember}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                                    >
                                        Invite Member
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.1}}
                className="p-4"
            >
                <div className="flex space-x-2 bg-white/10 backdrop-blur-md rounded-xl p-1 shadow-sm">
                    {['overview', 'members', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-5 rounded-lg text-sm font-semibold transition-all duration-200 text-center
                    ${
                                activeTab === tab
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.2}}
                className=" p-6"
            >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <WorkspaceOverview
                            currentWorkspace={currentWorkspace}
                            user={user}
                            isOwner={isOwner}
                            formatDate={formatDate}
                        />

                        <QuickStats currentWorkspace={currentWorkspace}/>
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Workspace Members</h3>
                            {isOwner && (
                                <button
                                    onClick={handleInviteMember}
                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                                >
                                    Invite Members
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {currentWorkspace.members?.map((member) => (
                                <div
                                    key={member.user?._id}
                                    className="glass-card p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold">{member.user?.name}</h4>
                                            <p className="text-white/70 text-sm">{member.user?.email}</p>
                                            <p className="text-white/50 text-xs">
                                                Joined {formatDate(member.joinedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        member.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                            member.role === 'owner' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-green-500/20 text-green-400'
                    }`}>
                      {member.role}
                    </span>

                                        {isOwner && member.role !== 'owner' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.user?._id)}
                                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white">Workspace Settings</h3>

                        {isOwner ? (
                            <div className="space-y-6">
                                {/* Danger Zone */}
                                <div className="glass-card p-6 border border-red-500/20">
                                    <h4 className="text-red-400 font-semibold mb-4">Danger Zone</h4>
                                    <p className="text-white/70 text-sm mb-4">
                                        Once you delete a workspace, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200"
                                    >
                                        Delete Workspace
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div
                                    className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">Settings Restricted</h4>
                                <p className="text-white/70">
                                    Only workspace owners can modify workspace settings.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default WorkspaceDetailPage;