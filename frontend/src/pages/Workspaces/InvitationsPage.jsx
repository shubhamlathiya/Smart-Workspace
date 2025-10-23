// pages/InvitationsPage.jsx
import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {fetchUserInvitations, acceptWorkspaceInvitation} from '../../store/slices/workspaceSlice';

const InvitationsPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {invitations, isLoading} = useAppSelector((state) => state.workspace);
    const {user} = useAppSelector((state) => state.auth);

    const [acceptingId, setAcceptingId] = useState(null);

    useEffect(() => {
        if (user) {
            dispatch(fetchUserInvitations());
        }
    }, [dispatch, user]);

    const handleAcceptInvitation = async (invitation) => {
        setAcceptingId(invitation._id);
        try {
            await dispatch(acceptWorkspaceInvitation({
                workspaceId: invitation.workspace._id,
                token: invitation.token
            })).unwrap();

            // Refresh invitations list
            dispatch(fetchUserInvitations());
        } catch (error) {
            console.error('Failed to accept invitation:', error);
        } finally {
            setAcceptingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/70">Loading invitations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <div className="glass-card p-6 mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Workspace Invitations</h1>
                    <p className="text-white/70">Manage your pending workspace invitations</p>
                </div>

                {invitations.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div
                            className="w-24 h-24 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📨</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">No Pending Invitations</h2>
                        <p className="text-white/70 mb-6">
                            You don't have any pending workspace invitations at the moment.
                        </p>
                        <button
                            onClick={() => navigate('/workspaces')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                        >
                            View Your Workspaces
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invitations.map((invitation) => (
                            <div key={invitation._id} className="glass-card p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {invitation.workspace.name}
                                        </h3>
                                        <p className="text-white/70 mb-2">
                                            Invited by: {invitation.invitedBy.name}
                                        </p>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="text-white/60">
                                                Role: <span
                                                className="text-white font-medium capitalize">{invitation.role}</span>
                                            </span>
                                            <span className="text-white/60">
                                                Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleAcceptInvitation(invitation)}
                                            disabled={acceptingId === invitation._id}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                                        >
                                            {acceptingId === invitation._id ? (
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                                                    Accepting...
                                                </div>
                                            ) : (
                                                'Accept'
                                            )}
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200">
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvitationsPage;