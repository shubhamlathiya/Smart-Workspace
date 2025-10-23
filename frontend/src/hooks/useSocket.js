import {useEffect, useRef, useState} from 'react';
import {useAppSelector} from './redux.js';
import socketService from '../services/socketService.jsx';

// Core socket hook
export const useSocket = () => {
    const {token, isAuthenticated} = useAppSelector(state => state.auth);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated && token) {
            // Connect to socket
            socketRef.current = socketService.connect(token);

            // Listen for connection status
            const handleConnectionStatus = (data) => {
                setIsConnected(data.connected);
                if (data.connected) setConnectionError(null);
            };

            const handleConnectionError = (error) => {
                setConnectionError(error);
                setIsConnected(false);
            };

            socketService.on('connection_status', handleConnectionStatus);
            socketService.on('connection_error', handleConnectionError);

            return () => {
                socketService.off('connection_status', handleConnectionStatus);
                socketService.off('connection_error', handleConnectionError);
            };
        } else {
            socketService.disconnect();
            setIsConnected(false);
            setConnectionError(null);
        }
    }, [isAuthenticated, token]);

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
        socketService,
    };
};

// Generic socket event listener hook
export const useSocketEvent = (event, callback, dependencies = []) => {
    const {socketService} = useSocket();

    useEffect(() => {
        if (!socketService) return;

        socketService.on(event, callback);
        return () => socketService.off(event, callback);
    }, [socketService, event, ...dependencies]);
};

// Join/leave workspace
export const useWorkspaceSocket = (workspaceId) => {
    const {socketService} = useSocket();

    useEffect(() => {
        if (!socketService || !workspaceId) return;

        socketService.joinWorkspace(workspaceId);
        return () => socketService.leaveWorkspace(workspaceId);
    }, [socketService, workspaceId]);
};

// Join/leave project
export const useProjectSocket = (projectId) => {
    const {socketService} = useSocket();

    useEffect(() => {
        if (!socketService || !projectId) return;

        socketService.joinProject(projectId);
        return () => socketService.leaveProject(projectId);
    }, [socketService, projectId]);
};

// Typing indicator for tasks
export const useTaskTypingIndicator = (projectId, taskId) => {
    const {socketService} = useSocket();
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef({});

    const startTyping = () => {
        if (socketService && projectId && taskId) {
            socketService.startTyping({projectId, taskId});
        }
    };

    const stopTyping = () => {
        if (socketService && projectId && taskId) {
            socketService.stopTyping({projectId, taskId});
        }
    };

    useEffect(() => {
        if (!socketService) return;

        const handleUserTyping = (data) => {
            if (data.taskId !== taskId) return;

            setTypingUsers(prev => {
                if (!prev.find(u => u.userId === data.userId)) {
                    return [...prev, {userId: data.userId, userName: data.userName}];
                }
                return prev;
            });

            if (typingTimeoutRef.current[data.userId]) {
                clearTimeout(typingTimeoutRef.current[data.userId]);
            }

            typingTimeoutRef.current[data.userId] = setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
                delete typingTimeoutRef.current[data.userId];
            }, 3000);
        };

        const handleUserStoppedTyping = (data) => {
            if (data.taskId !== taskId) return;

            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
            if (typingTimeoutRef.current[data.userId]) {
                clearTimeout(typingTimeoutRef.current[data.userId]);
                delete typingTimeoutRef.current[data.userId];
            }
        };

        socketService.on('user_typing', handleUserTyping);
        socketService.on('user_stopped_typing', handleUserStoppedTyping);

        return () => {
            socketService.off('user_typing', handleUserTyping);
            socketService.off('user_stopped_typing', handleUserStoppedTyping);

            Object.values(typingTimeoutRef.current).forEach(clearTimeout);
            typingTimeoutRef.current = {};
        };
    }, [socketService, taskId]);

    return {typingUsers, startTyping, stopTyping};
};

// Task Comment Socket
export const useTaskCommentSocket = (projectId, taskId, onNewComment) => {
    const {socketService} = useSocket();

    useEffect(() => {
        if (!socketService || !projectId || !taskId) return;

        const handleNewComment = (data) => {
            if (data.taskId === taskId && onNewComment) {
                onNewComment(data);
            }
        };

        socketService.on('task_comment_added', handleNewComment);

        return () => {
            socketService.off('task_comment_added', handleNewComment);
        };
    }, [socketService, projectId, taskId, onNewComment]);
};

// NEW: Task File Socket
export const useTaskFileSocket = (projectId, taskId, onFileChange) => {
    const {socketService} = useSocket();

    useEffect(() => {
        if (!socketService || !projectId || !taskId) return;

        const handleFileUploaded = (data) => {
            if (data.taskId === taskId && onFileChange) {
                onFileChange({type: 'uploaded', file: data});
            }
        };

        const handleFileDeleted = (data) => {
            if (data.taskId === taskId && onFileChange) {
                onFileChange({type: 'deleted', file: data});
            }
        };

        socketService.on('task_file_uploaded', handleFileUploaded);
        socketService.on('task_file_deleted', handleFileDeleted);

        return () => {
            socketService.off('task_file_uploaded', handleFileUploaded);
            socketService.off('task_file_deleted', handleFileDeleted);
        };
    }, [socketService, projectId, taskId, onFileChange]);
};

export default useSocket;