const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// const ipCounters = new Map();
// app.use((req, res, next) => {
//   const ip = req.ip;
//   const currentCount = ipCounters.get(ip) || 0;
//   ipCounters.set(ip, currentCount + 1);
//   console.log(`IP ${ip} has made ${currentCount + 1} requests`);
//   next();
// });
//
// app.use('/api/', limiter);

// Import logging middleware
const {requestLogger, errorLogger, Logger} = require('./middleware/logger');

// Body parsing middleware
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

// Request logging
app.use(requestLogger);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-workspace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Workspace API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/invitations', require('./routes/invitation'));

// Swagger documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Smart Workspace API',
            version: '1.0.0',
            description: `
        # Smart Workspace & Collaboration Platform API
        
        A comprehensive workspace collaboration platform that enables teams to:
        - Create and manage workspaces
        - Organize projects with nested task relationships
        - Assign tasks and track progress
        - Collaborate in real-time with comments and notifications
        - Manage user roles and permissions
        
        ## Authentication
        This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your-token>\`
        
        ## Rate Limiting
        API requests are limited to 100 requests per 15-minute window per IP address.
        
        ## Error Handling
        All errors follow a consistent format with success, message, and optional error details.
      `,
            contact: {
                name: 'Smart Workspace Team',
                email: 'support@smartworkspace.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: 'Development server',
            },
            {
                url: 'https://api.smartworkspace.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from login endpoint',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Error message',
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {type: 'string'},
                                    message: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: {type: 'integer', example: 1},
                        limit: {type: 'integer', example: 10},
                        total: {type: 'integer', example: 100},
                        pages: {type: 'integer', example: 10},
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication information is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Access denied. No token provided.',
                            },
                        },
                    },
                },
                ForbiddenError: {
                    description: 'Access denied. Insufficient permissions.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Access denied. Insufficient permissions.',
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Resource not found',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Validation failed',
                                errors: [
                                    {
                                        field: 'email',
                                        message: 'Please provide a valid email',
                                    },
                                ],
                            },
                        },
                    },
                },
                ServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                            example: {
                                success: false,
                                message: 'Something went wrong!',
                            },
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization',
            },
            {
                name: 'Workspaces',
                description: 'Workspace management and member invitations',
            },
            {
                name: 'Projects',
                description: 'Project management within workspaces',
            },
            {
                name: 'Tasks',
                description: 'Task management with comments and assignments',
            },
            {
                name: 'Users',
                description: 'User profile and account management',
            },
        ],
    },
    apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Socket.io connection handling
const jwt = require('jsonwebtoken');
const User = require('./models/User');

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join workspace rooms
    socket.on('join_workspace', (workspaceId) => {
        socket.join(`workspace_${workspaceId}`);
        console.log(`User ${socket.user.name} joined workspace ${workspaceId}`);
    });

    // Leave workspace rooms
    socket.on('leave_workspace', (workspaceId) => {
        socket.leave(`workspace_${workspaceId}`);
        console.log(`User ${socket.user.name} left workspace ${workspaceId}`);
    });

    // Join project rooms
    socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
        console.log(`User ${socket.user.name} joined project ${projectId}`);
    });

    // Leave project rooms
    socket.on('leave_project', (projectId) => {
        socket.leave(`project_${projectId}`);
        console.log(`User ${socket.user.name} left project ${projectId}`);
    });

    // Handle task updates
    socket.on('task_updated', (data) => {
        socket.to(`project_${data.projectId}`).emit('task_updated', {
            ...data,
            updatedBy: socket.user.name,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle new comments - UPDATED to match frontend
    socket.on('task_comment_added', (data) => {
        socket.to(`project_${data.projectId}`).emit('task_comment_added', {
            ...data,
            author: socket.user.name,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle activity updates
    socket.on('activity_update', (data) => {
        socket.to(`workspace_${data.workspaceId}`).emit('activity_update', {
            ...data,
            user: socket.user.name,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle typing indicators - UPDATED to match frontend
    socket.on('start_typing', (data) => {
        socket.to(`project_${data.projectId}`).emit('user_typing', {
            userId: socket.userId,
            userName: socket.user.name,
            projectId: data.projectId,
            taskId: data.taskId,
            timestamp: new Date()
        });
    });

    socket.on('stop_typing', (data) => {
        socket.to(`project_${data.projectId}`).emit('user_stopped_typing', {
            userId: socket.userId,
            projectId: data.projectId,
            taskId: data.taskId,
            timestamp: new Date()
        });
    });

    // NEW: Handle file uploads
    socket.on('task_file_uploaded', (data) => {
        socket.to(`project_${data.projectId}`).emit('task_file_uploaded', {
            ...data,
            uploadedBy: socket.user.name,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // NEW: Handle file deletions
    socket.on('task_file_deleted', (data) => {
        socket.to(`project_${data.projectId}`).emit('task_file_deleted', {
            ...data,
            deletedBy: socket.user.name,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    socket.on('task_assignment_updated', (data) => {
        socket.to(`project_${data.projectId}`).emit('task_assignment_updated', {
            ...data,
            assignedBy: socket.user.name,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // NEW: Handle task assignment removed
    socket.on('task_assignment_removed', (data) => {
        socket.to(`project_${data.projectId}`).emit('task_assignment_removed', {
            ...data,
            removedBy: socket.user.name,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // Handle connection status
    socket.emit('connection_status', {connected: true});

    socket.on('disconnect', (reason) => {
        console.log(`User ${socket.user.name} disconnected: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.user.name}:`, error);
    });
});

// Utility function to send notifications to specific users
const sendNotificationToUser = (userId, notification) => {
    io.to(`user_${userId}`).emit('notification_received', {
        ...notification,
        timestamp: new Date()
    });
};

// Utility function to broadcast to project
const broadcastToProject = (projectId, event, data) => {
    io.to(`project_${projectId}`).emit(event, {
        ...data,
        timestamp: new Date()
    });
};

// Utility function to broadcast to workspace
const broadcastToWorkspace = (workspaceId, event, data) => {
    io.to(`workspace_${workspaceId}`).emit(event, {
        ...data,
        timestamp: new Date()
    });
};

// Make io and utility functions available to routes
app.set('io', io);
app.set('socketUtils', {
    sendNotificationToUser,
    broadcastToProject,
    broadcastToWorkspace
});

// Import error handling middleware
const {errorHandler, notFound} = require('./middleware/errorHandler');

// 404 handler
app.use(notFound);

// Error logging
app.use(errorLogger);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.io server ready for real-time connections');
});

module.exports = {app, server, io};
