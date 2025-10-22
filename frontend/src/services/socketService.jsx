import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io('http://localhost:5000', {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.emit('connection_error', error);
    });

    // Task-related events - UPDATED
    this.socket.on('task_updated', (data) => {
      this.emit('task_updated', data);
    });

    this.socket.on('task_comment_added', (data) => { // NEW: Changed from new_comment
      this.emit('task_comment_added', data);
    });

    // Activity events
    this.socket.on('activity_update', (data) => {
      this.emit('activity_update', data);
    });

    // Typing indicators - UPDATED event names
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    // NEW: File events
    this.socket.on('task_file_uploaded', (data) => {
      this.emit('task_file_uploaded', data);
    });

    this.socket.on('task_file_deleted', (data) => {
      this.emit('task_file_deleted', data);
    });

    // NEW: Task assignment events
    this.socket.on('task_assignment_updated', (data) => {
      this.emit('task_assignment_updated', data);
    });

    this.socket.on('task_assignment_removed', (data) => {
      this.emit('task_assignment_removed', data);
    });

  }

  // Room management
  joinWorkspace(workspaceId) {
    if (this.socket) {
      this.socket.emit('join_workspace', workspaceId);
    }
  }

  leaveWorkspace(workspaceId) {
    if (this.socket) {
      this.socket.emit('leave_workspace', workspaceId);
    }
  }

  joinProject(projectId) {
    if (this.socket) {
      this.socket.emit('join_project', projectId);
    }
  }

  leaveProject(projectId) {
    if (this.socket) {
      this.socket.emit('leave_project', projectId);
    }
  }

  // Task events - UPDATED method names to match frontend
  emitTaskUpdate(data) {
    if (this.socket) {
      this.socket.emit('task_updated', data);
    }
  }

  emitNewComment(data) {
    if (this.socket) {
      this.socket.emit('task_comment_added', data); // UPDATED: Changed from 'new_comment'
    }
  }

  emitActivityUpdate(data) {
    if (this.socket) {
      this.socket.emit('activity_update', data);
    }
  }

  // NEW: File events
  emitFileUploaded(data) {
    if (this.socket) {
      this.socket.emit('task_file_uploaded', data);
    }
  }

  emitFileDeleted(data) {
    if (this.socket) {
      this.socket.emit('task_file_deleted', data);
    }
  }

  // NEW: Task assignment methods
  emitTaskAssignmentUpdated(data) {
    if (this.socket) {
      this.socket.emit('task_assignment_updated', data);
    }
  }

  emitTaskAssignmentRemoved(data) {
    if (this.socket) {
      this.socket.emit('task_assignment_removed', data);
    }
  }

  // Typing indicators - UPDATED method names to match frontend
  startTyping(data) {
    if (this.socket) {
      this.socket.emit('start_typing', data); // UPDATED: Changed from 'typing_start'
    }
  }

  stopTyping(data) {
    if (this.socket) {
      this.socket.emit('stop_typing', data); // UPDATED: Changed from 'typing_stop'
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Connection management
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket,
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;