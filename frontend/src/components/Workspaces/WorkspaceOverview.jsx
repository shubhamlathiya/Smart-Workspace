import React from 'react';
import {motion} from 'framer-motion';

const WorkspaceOverview = ({currentWorkspace, isOwner, user, formatDate}) => {
    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.1}}
            className="lg:col-span-2 space-y-6"
        >
            <h3 className="text-xl font-bold text-white mb-4">Workspace Overview</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="glass-card p-4">
                    <h4 className="font-semibold text-white mb-3">Basic Information</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-white/70">Owner:</span>
                            <span className="text-white">{currentWorkspace.owner?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Created:</span>
                            <span className="text-white">{formatDate(currentWorkspace.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Last Updated:</span>
                            <span className="text-white">{formatDate(currentWorkspace.updatedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="glass-card p-4">
                    <h4 className="font-semibold text-white mb-3">Settings</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-white/70">Visibility:</span>
                            <span
                                className={`font-semibold ${
                                    currentWorkspace.settings?.isPublic ? 'text-green-400' : 'text-blue-400'
                                }`}
                            >
                {currentWorkspace.settings?.isPublic ? 'Public' : 'Private'}
              </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Members:</span>
                            <span className="text-white">{currentWorkspace.members?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Your Role:</span>
                            <span className="text-white capitalize">
                {isOwner
                    ? 'Owner'
                    : currentWorkspace.members?.find(m => m.user?._id === user?._id)?.role || 'Member'}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tags */}
            {currentWorkspace.tags && currentWorkspace.tags.length > 0 && (
                <div className="glass-card p-4">
                    <h4 className="font-semibold text-white mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {currentWorkspace.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30"
                            >
                {tag}
              </span>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default WorkspaceOverview;
