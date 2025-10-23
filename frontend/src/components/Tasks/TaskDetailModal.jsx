import React, {useState, useEffect, useRef, useCallback} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    X, Clock, User, Paperclip, Edit3, Trash2, Send, MoreVertical, UserPlus, Upload, Download, FileText, Image, File
} from 'lucide-react';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {
    updateTask, addTaskComment, updateTaskComment, deleteTaskComment, setCurrentTask
} from '../../features/task/taskSlice.jsx';
import {uploadTaskFile, deleteTaskFile, downloadFile} from '../../features/upload/uploadSlice';
import {
    useSocket, useProjectSocket, useTaskTypingIndicator, useTaskCommentSocket
} from '../../hooks/useSocket';
import {openModal} from '../../features/ui/uiSlice';
import {showConfirmAlert, showErrorAlert, showSuccessAlert} from "../../utils/alerts.jsx";

const TaskDetailModal = ({task, isOpen, onClose}) => {
    const dispatch = useAppDispatch();
    const {user} = useAppSelector(state => state.auth);
    const {isLoading} = useAppSelector(state => state.task);
    const {isLoading: uploadLoading} = useAppSelector(state => state.upload);
    const {socketService} = useSocket();

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [showAssignees, setShowAssignees] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [realTimeTask, setRealTimeTask] = useState(task);

    const commentInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const {typingUsers, startTyping, stopTyping} = useTaskTypingIndicator(task?.project?._id, task?._id);


    // Join project room for real-time updates
    useProjectSocket(task?.project?._id);

    // Handle real-time task updates
    useEffect(() => {
        if (!socketService || !task) return;

        const handleTaskUpdate = (data) => {
            if (data.taskId === task._id) {
                setRealTimeTask(prev => ({
                    ...prev, ...data, updatedAt: new Date().toISOString()
                }));
            }
        };

        socketService.on('task_updated', handleTaskUpdate);

        return () => {
            socketService.off('task_updated', handleTaskUpdate);
        };
    }, [socketService, task, user?.name]);

    // Handle real-time comment updates
    const handleNewComment = useCallback((data) => {
        if (data.taskId === task?._id) {
            setRealTimeTask(prev => ({
                ...prev, comments: [...(prev.comments || []), {
                    _id: data.commentId || Date.now().toString(),
                    content: data.content,
                    user: { name: user?.name || "Unknown" },
                    createdAt: new Date().toISOString(),
                    isEdited: false
                }]
            }));


        }
    }, [task?._id, user?.name]);

    useTaskCommentSocket(task?.project?._id, task?._id, handleNewComment);

    // Handle real-time file updates (using activity updates for now)
    useEffect(() => {
        if (!socketService || !task) return;

        const handleActivityUpdate = (data) => {
            if (data.taskId === task._id && data.type === 'file_upload') {
                // Refresh task data to get updated attachments
                // In a real app, you'd want to update the specific file
                setRealTimeTask(prev => ({...prev}));


            }
        };

        socketService.on('activity_update', handleActivityUpdate);

        return () => {
            socketService.off('activity_update', handleActivityUpdate);
        };
    }, [socketService, task, user?.name]);

    // Sync realTimeTask with prop task
    useEffect(() => {
        if (task) {
            setRealTimeTask(task);
        }
    }, [task]);

    useEffect(() => {
        if (realTimeTask) {
            setEditData({
                title: realTimeTask.title,
                description: realTimeTask.description,
                priority: realTimeTask.priority,
                status: realTimeTask.status,
                dueDate: realTimeTask.dueDate ? new Date(realTimeTask.dueDate).toISOString().split('T')[0] : '',
                tags: realTimeTask.tags?.join(', ') || '',
            });
        }
    }, [realTimeTask]);

    useEffect(() => {
        if (isOpen && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [isOpen]);

    // File Upload Handlers
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        files.forEach(file => handleFileUpload(file));
        event.target.value = ''; // Reset input
    };

    const handleFileUpload = async (file) => {
        if (!realTimeTask) return;

        try {
            const result = await dispatch(uploadTaskFile({
                taskId: realTimeTask._id, file
            })).unwrap();

            // Emit activity update for file upload
            if (socketService) {
                socketService.emitActivityUpdate({
                    workspaceId: realTimeTask.project.workspaceId,
                    projectId: realTimeTask.project._id,
                    taskId: realTimeTask._id,
                    type: 'file_upload',
                    fileName: file.name,
                    user: user.name,
                    timestamp: new Date(),
                });
            }

            // Update local state with new file
            setRealTimeTask(prev => ({
                ...prev, attachments: [...(prev.attachments || []), result.file]
            }));

            showSuccessAlert('success', 'File Uploaded', 'File has been uploaded successfully');
        } catch (error) {
            console.error('File upload failed:', error);
            showErrorAlert('error', 'Upload Failed', 'Failed to upload file. Please try again.');
        }
    };

    const handleFileDelete = async (filename) => {
        if (!realTimeTask) return;

        const confirmed = await showConfirmAlert({
            title: 'Delete File?',
            message: 'Are you sure you want to delete this file?',
            confirmText: 'Yes, delete',
            confirmColor: '#ef4444'
        });

        if (confirmed) {
            try {
                await dispatch(deleteTaskFile({taskId: realTimeTask._id, filename})).unwrap();

                // Emit activity update for file deletion
                if (socketService) {
                    socketService.emitActivityUpdate({
                        workspaceId: realTimeTask.project.workspaceId,
                        projectId: realTimeTask.project._id,
                        taskId: realTimeTask._id,
                        type: 'file_delete',
                        fileName: filename,
                        user: user.name,
                        timestamp: new Date(),
                    });
                }

                // Update local state by removing the file
                setRealTimeTask(prev => ({
                    ...prev, attachments: prev.attachments?.filter(file => file.filename !== filename) || []
                }));

                showSuccessAlert('success', 'File Deleted', 'The file has been successfully deleted.');
            } catch (e) {
                showErrorAlert('error', 'Failed', `${e} Unable to delete this file. Please try again.`);
            }
        }
    };

    const handleDownload = (filename, originalName) => {
        dispatch(downloadFile(filename))
            .unwrap()
            .then(() => {
                console.log(`${originalName} download started`);
            })
            .catch((error) => {
                console.error('Download failed:', error);
            });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => handleFileUpload(file));
    };

    // File Utility Functions
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimetype) => {
        if (!mimetype) return <File className="w-5 h-5 text-gray-400"/>;
        if (mimetype.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400"/>;
        if (mimetype.startsWith('video/')) return '🎬';
        if (mimetype.startsWith('audio/')) return '🎵';
        if (mimetype.includes('pdf')) return <FileText className="w-5 h-5 text-red-400"/>;
        if (mimetype.includes('word')) return '📝';
        if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
        if (mimetype.includes('zip') || mimetype.includes('compressed')) return '📦';
        return <File className="w-5 h-5 text-gray-400"/>;
    };

    const canDeleteFile = (file) => {
        return file.uploadedBy === user._id || user.role === 'admin' || realTimeTask.createdBy === user._id;
    };

    const getFileType = (mimetype) => {
        if (!mimetype) return 'File';
        if (mimetype.startsWith('image/')) return 'Image';
        if (mimetype.startsWith('video/')) return 'Video';
        if (mimetype.startsWith('audio/')) return 'Audio';
        if (mimetype.includes('pdf')) return 'PDF';
        if (mimetype.includes('word')) return 'Document';
        if (mimetype.includes('excel')) return 'Spreadsheet';
        if (mimetype.includes('zip')) return 'Archive';
        return 'File';
    };

    // Task Handlers with Socket Emissions
    const handleSave = async () => {
        try {
            const updateData = {
                ...editData,
                tags: editData.tags ? editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            };

            await dispatch(updateTask({
                taskId: realTimeTask._id, updateData
            })).unwrap();

            // Emit real-time update using socketService method
            if (socketService) {
                socketService.emitTaskUpdate({
                    projectId: realTimeTask.project._id,
                    taskId: realTimeTask._id,
                    updateData,
                    updatedBy: user.name,
                    timestamp: new Date(),
                });
            }

            setIsEditing(false);
            showSuccessAlert('success', 'Task Updated', 'Task has been updated successfully');
        } catch (error) {
            console.error('Failed to update task:', error);
            showErrorAlert('error', 'Update Failed', 'Failed to update task. Please try again.');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const result = await dispatch(addTaskComment({
                taskId: realTimeTask._id, content: newComment.trim()
            })).unwrap();


            console.log('Comment result:', result); // Debug log to see the actual structure

            // The API returns the updated task with comments array
            // Find the newly added comment (it should be the last one)
            const updatedTask = result.data || result;
            const comments = updatedTask.comments || [];
            const newCommentData = comments[comments.length - 1]; // Get the last comment

            // Emit real-time comment
            if (socketService && newCommentData) {
                socketService.emitNewComment({
                    projectId: realTimeTask.project._id,
                    taskId: realTimeTask._id,
                    commentId: newCommentData._id,
                    content: newComment.trim(),
                    author: user.name,
                    userId: user._id,
                    timestamp: new Date(),
                });
            }

            setNewComment('');
            stopTyping();
        } catch (error) {
            console.error('Failed to add comment:', error);
            showErrorAlert('error', 'Comment Failed', 'Failed to add comment. Please try again.');
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!commentText.trim()) return;

        try {
            await dispatch(updateTaskComment({
                taskId: realTimeTask._id, commentId, content: commentText.trim()
            })).unwrap();

            setEditingComment(null);
            setCommentText('');
            showSuccessAlert('success', 'Comment Updated', 'Comment has been updated successfully');
        } catch (error) {
            console.error('Failed to update comment:', error);
            showErrorAlert('error', 'Update Failed', 'Failed to update comment. Please try again.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmed = await showConfirmAlert({
            title: 'Delete Comment?',
            message: 'Are you sure you want to delete this comment?',
            confirmText: 'Yes, delete',
            confirmColor: '#ef4444'
        });

        if (!confirmed) return;

        try {
            await dispatch(deleteTaskComment({
                taskId: realTimeTask._id, commentId
            })).unwrap();

            showSuccessAlert('success', 'Comment Deleted', 'Comment has been deleted successfully');
        } catch (error) {
            console.error('Failed to delete comment:', error);
            showErrorAlert('error', 'Delete Failed', 'Failed to delete comment. Please try again.');
        }
    };

    const handleCommentInputChange = (e) => {
        setNewComment(e.target.value);

        if (e.target.value.trim()) {
            startTyping();
        } else {
            stopTyping();
        }
    };

    const handleAssignUsers = (task) => {
        dispatch(setCurrentTask(task));
        dispatch(openModal('assignUsers'));
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-green-100 text-green-800 border-green-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            urgent: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[priority] || colors.medium;
    };

    const getStatusColor = (status) => {
        const colors = {
            todo: 'bg-gray-100 text-gray-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            review: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
        };
        return colors[status] || colors.todo;
    };

    const getAssigneeDisplay = (assignment) => {
        if (assignment.user?.name) {
            return assignment.user.name;
        }
        return 'Unknown User';
    };

    const getAssigneeInitial = (assignment) => {
        if (assignment.user?.name) {
            return assignment.user.name.charAt(0).toUpperCase();
        }
        return 'U';
    };

    if (!realTimeTask) return null;

    return (<AnimatePresence>
        {isOpen && (<motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{scale: 0.9, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                exit={{scale: 0.9, opacity: 0}}
                className="glass-card max-w-4xl w-full max-h-[95vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-white">Task Details</h2>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(realTimeTask.status)}`}>
                                    {realTimeTask.status.replace('-', ' ').toUpperCase()}
                                </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white"/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Task Title */}
                            <div>
                                {isEditing ? (<input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                                    className="w-full text-xl font-semibold bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    placeholder="Task title"
                                />) : (
                                    <h3 className="text-xl font-semibold text-white">{realTimeTask.title}</h3>)}
                            </div>

                            {/* Task Description */}
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-2">
                                    Description
                                </label>
                                {isEditing ? (<textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({
                                        ...editData, description: e.target.value
                                    })}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-24"
                                    placeholder="Task description"
                                />) : (<p className="text-white/80 whitespace-pre-wrap">
                                    {realTimeTask.description || 'No description provided'}
                                </p>)}
                            </div>

                            {/* Files Section */}
                            <div className="space-y-6">
                                <h4 className="text-lg font-semibold text-white mb-4">Attachments</h4>

                                {/* File Upload Area */}
                                <div
                                    className={`glass-card p-6 border-2 border-dashed transition-all duration-200 mb-4 ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/30'}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="text-center">
                                        <Upload className="w-12 h-12 text-white/50 mx-auto mb-4"/>
                                        <p className="text-white/70 mb-2">
                                            Drag and drop files here or click to browse
                                        </p>
                                        <p className="text-white/50 text-sm mb-4">
                                            Supports images, documents, PDFs, and other files
                                        </p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadLoading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            {uploadLoading ? 'Uploading...' : 'Select Files'}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Files List */}
                                {realTimeTask.attachments && realTimeTask.attachments.length > 0 ? (
                                    <div className="space-y-3">
                                        {realTimeTask.attachments.map((file, index) => (<div
                                            key={file._id || index}
                                            className="glass-card p-4 flex items-center justify-between group hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="flex-shrink-0">
                                                    {getFileIcon(file.mimeType)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">
                                                        {file.originalName}
                                                    </p>
                                                    <div
                                                        className="flex items-center space-x-4 text-white/70 text-sm">
                                                        <span>{getFileType(file.mimeType)}</span>
                                                        <span>•</span>
                                                        <span>{formatFileSize(file.size)}</span>
                                                        <span>•</span>
                                                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownload(file.filename, file.originalName)}
                                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4 text-white/70"/>
                                                </button>

                                                {canDeleteFile(file) && (<button
                                                    onClick={() => handleFileDelete(file.filename)}
                                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400"/>
                                                </button>)}
                                            </div>
                                        </div>))}
                                    </div>) : (<div className="text-center py-8">
                                    <Paperclip className="w-12 h-12 text-white/30 mx-auto mb-3"/>
                                    <p className="text-white/50">No attachments yet</p>
                                    <p className="text-white/30 text-sm mt-1">
                                        Upload files to share with your team
                                    </p>
                                </div>)}
                            </div>

                            {/* Comments Section */}
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-4">Comments</h4>

                                {/* Comments List */}
                                <div className="space-y-4 mb-6">
                                    {realTimeTask.comments?.map((comment) => (
                                        <div key={comment._id} className="glass-card p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                                <span className="text-white text-sm font-semibold">
                                                                    {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                                </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{comment.user?.name || 'Unknown User'}</p>
                                                        <p className="text-white/70 text-sm">
                                                            {new Date(comment.createdAt).toLocaleString()}
                                                            {comment.isEdited && ' (edited)'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {comment.user?._id === user._id && (
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingComment(comment._id);
                                                                setCommentText(comment.content);
                                                            }}
                                                            className="p-1 hover:bg-white/10 rounded"
                                                        >
                                                            <Edit3 className="w-4 h-4 text-white/70"/>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="p-1 hover:bg-white/10 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-400"/>
                                                        </button>
                                                    </div>)}
                                            </div>

                                            {editingComment === comment._id ? (<div className="mt-3 space-y-2">
                                                            <textarea
                                                                value={commentText}
                                                                onChange={(e) => setCommentText(e.target.value)}
                                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                                                                rows="3"
                                                            />
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleUpdateComment(comment._id)}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingComment(null);
                                                            setCommentText('');
                                                        }}
                                                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>) : (
                                                <p className="mt-3 text-white/80 whitespace-pre-wrap">
                                                    {comment.content}
                                                </p>)}
                                        </div>))}
                                </div>

                                {/* Add Comment */}
                                <div className="glass-card p-4">
                                    <div className="flex space-x-3">
                                        <div
                                            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-sm font-semibold">
                                                        {user?.name?.charAt(0).toUpperCase()}
                                                    </span>
                                        </div>
                                        <div className="flex-1">
                                                    <textarea
                                                        ref={commentInputRef}
                                                        value={newComment}
                                                        onChange={handleCommentInputChange}
                                                        placeholder="Add a comment..."
                                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                                                        rows="3"
                                                    />
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="text-sm text-white/70">
                                                    {typingUsers.length > 0 && (<span>
                                                                    {typingUsers.map(u => u.userName).join(', ')}
                                                        {typingUsers.length === 1 ? ' is' : ' are'} typing...
                                                                </span>)}
                                                </div>
                                                <button
                                                    onClick={handleAddComment}
                                                    disabled={!newComment.trim()}
                                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Send className="w-4 h-4"/>
                                                    <span>Comment</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Task Properties */}
                            <div className="glass-card p-4">
                                <h4 className="font-semibold text-white mb-4">Properties</h4>
                                <div className="space-y-3">
                                    {/* Priority */}
                                    <div>
                                        <label className="block text-sm font-medium text-white/90 mb-1">
                                            Priority
                                        </label>
                                        {isEditing ? (<select
                                            value={editData.priority}
                                            onChange={(e) => setEditData({
                                                ...editData, priority: e.target.value
                                            })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>) : (<span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(realTimeTask.priority)}`}>
                                                        {realTimeTask.priority}
                                                    </span>)}
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-white/90 mb-1">
                                            Due Date
                                        </label>
                                        {isEditing ? (<input
                                            type="date"
                                            value={editData.dueDate}
                                            onChange={(e) => setEditData({
                                                ...editData, dueDate: e.target.value
                                            })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                                        />) : (<div className="flex items-center space-x-2 text-white/80">
                                            <Clock className="w-4 h-4"/>
                                            <span>{realTimeTask.dueDate ? new Date(realTimeTask.dueDate).toLocaleDateString() : 'No due date'}</span>
                                        </div>)}
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-sm font-medium text-white/90 mb-1">
                                            Tags
                                        </label>
                                        {isEditing ? (<input
                                            type="text"
                                            value={editData.tags}
                                            onChange={(e) => setEditData({
                                                ...editData, tags: e.target.value
                                            })}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                                            placeholder="Enter tags separated by commas"
                                        />) : (<div className="flex flex-wrap gap-2">
                                            {realTimeTask.tags?.map((tag, idx) => (<span key={idx}
                                                                                         className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                                                                {tag}
                                                            </span>))}
                                        </div>)}
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Users */}
                            <div className="glass-card p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-white">Assigned To</h4>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleAssignUsers(realTimeTask)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                            title="Assign team members"
                                        >
                                            <UserPlus className="w-4 h-4 text-white/70"/>
                                        </button>
                                        <button
                                            onClick={() => setShowAssignees(!showAssignees)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-white/70"/>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {realTimeTask.assignedTo && realTimeTask.assignedTo.length > 0 ? (realTimeTask.assignedTo.map((assignment, idx) => (
                                        <div key={assignment._id || idx}
                                             className="flex items-center space-x-3">
                                            <div
                                                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-sm font-semibold">
                                                                {getAssigneeInitial(assignment)}
                                                            </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">
                                                    {getAssigneeDisplay(assignment)}
                                                </p>
                                                <p className="text-white/70 text-sm">
                                                    {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'Recently assigned'}
                                                </p>
                                            </div>
                                        </div>))) : (<div className="text-center py-4">
                                        <User className="w-8 h-8 text-white/50 mx-auto mb-2"/>
                                        <p className="text-white/70 text-sm">No one assigned</p>
                                        <button
                                            onClick={() => handleAssignUsers(realTimeTask)}
                                            className="text-blue-400 text-sm hover:text-blue-300 transition-colors mt-1"
                                        >
                                            Assign someone
                                        </button>
                                    </div>)}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="glass-card p-4">
                                <div className="space-y-2">
                                    {isEditing ? (<>
                                        <button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                        >
                                            {isLoading ? (<>
                                                <div
                                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                <span>Saving...</span>
                                            </>) : (<span>Save Changes</span>)}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </>) : (<>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Edit Task
                                        </button>
                                        <button
                                            onClick={() => handleAssignUsers(realTimeTask)}
                                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                                        >
                                            <UserPlus className="w-4 h-4"/>
                                            <span>Assign Team</span>
                                        </button>
                                    </>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>)}
    </AnimatePresence>);
};

export default TaskDetailModal;