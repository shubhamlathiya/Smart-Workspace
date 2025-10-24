// components/Tasks/AssignUsersModal.jsx
import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {X, Search, UserPlus, Check} from 'lucide-react';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {assignTask, clearCurrentTask} from '../../features/task/taskSlice';
import {closeModal} from '../../features/ui/uiSlice';

const AssignUsersModal = () => {
    const dispatch = useAppDispatch();
    const {modals} = useAppSelector(state => state.ui);
    const {currentProject} = useAppSelector(state => state.project);
    const {user} = useAppSelector(state => state.auth);
    const {currentTask, isLoading} = useAppSelector(state => state.task);

    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const isOpen = !!modals.assignUsers;
    const task = modals.assignUsers;

    useEffect(() => {
        if (task && isOpen) {
            // Pre-select already assigned users
            const assignedUserIds =
                task.assignedTo?.map(assignment => assignment.user?._id || assignment.user) || [];
            setSelectedUsers(assignedUserIds);
        }
    }, [task, isOpen]);

    const handleClose = () => {
        dispatch(closeModal('assignUsers'));
        dispatch(clearCurrentTask());
        dispatch(closeModal('assignUsers'));
        setSelectedUsers([]);
        setSearchTerm('');
    };


    const getAvailableUsers = () => {
        if (!currentProject?.assignedMembers) return [];
        return currentProject.assignedMembers.filter(
            member => member.user && member.user._id !== user?._id
        );
    };

    const filteredUsers = getAvailableUsers().filter(member => {
        const userName = member.user?.name?.toLowerCase() || '';
        const userEmail = member.user?.email?.toLowerCase() || '';
        return (
            userName.includes(searchTerm.toLowerCase()) ||
            userEmail.includes(searchTerm.toLowerCase())
        );
    });

    const handleUserToggle = userId => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAssign = async selectedTask => {
        if (!selectedTask || selectedUsers.length === 0) return;
        try {
            await dispatch(
                assignTask({
                    taskId: currentTask._id,
                    userIds: selectedUsers,
                })
            ).unwrap();

            handleClose();
        } catch (error) {
            console.error('Failed to assign users:', error);
        }
    };

    const isUserSelected = userId => selectedUsers.includes(userId);

    if (!isOpen) return null;

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
                        className="glass-card max-w-md w-full max-h-[80vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/20">
                            <div className="flex items-center space-x-3">
                                <UserPlus className="w-6 h-6 text-white"/>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Assign Team Members</h2>
                                    <p className="text-white/70 text-sm">Assign users to: {task?.title}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white"/>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="w-5 h-5 text-white/70 absolute left-3 top-3"/>
                                <input
                                    type="text"
                                    placeholder="Search team members..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                                />
                            </div>

                            {/* Users List */}
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(member => (
                                        <div
                                            key={member.user._id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                isUserSelected(member.user._id)
                                                    ? 'bg-blue-500/20 border-blue-500/30'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                            onClick={() => handleUserToggle(member.user._id)}
                                        >
                                            <div
                                                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">
                                                    {member.user.name}
                                                </p>
                                                <p className="text-white/70 text-sm truncate">
                                                    {member.user.email}
                                                </p>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                    isUserSelected(member.user._id)
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-white/30'
                                                }`}
                                            >
                                                {isUserSelected(member.user._id) && (
                                                    <Check className="w-3 h-3 text-white"/>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <div
                                            className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <UserPlus className="w-6 h-6 text-white/70"/>
                                        </div>
                                        <p className="text-white/70">No team members found</p>
                                        <p className="text-white/50 text-sm mt-1">
                                            {searchTerm
                                                ? 'Try a different search term'
                                                : 'Add members to your project first'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Selected Count */}
                            {selectedUsers.length > 0 && (
                                <div className="text-center">
                                    <p className="text-white/70 text-sm">
                                        {selectedUsers.length} user
                                        {selectedUsers.length !== 1 ? 's' : ''} selected
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAssign(task)}
                                    disabled={isLoading || selectedUsers.length === 0}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                            <span>Assigning...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4"/>
                                            <span>Assign</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AssignUsersModal;
