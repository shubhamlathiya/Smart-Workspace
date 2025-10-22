# Smart Workspace & Collaboration Platform

A comprehensive workspace collaboration platform built with MERN stack (MongoDB, Express, React, Node.js) and Redux Toolkit, featuring modern UI effects like Glassmorphism, Neumorphism, and Parallax.

## 🚀 Features

### 🎯 Core Features
- **Complete MERN Stack Implementation** with production-ready architecture
- **Advanced Redux Patterns** - Every major Redux pattern implemented
- **Real-time Collaboration** with Socket.io integration
- **Modern UI/UX Design** with Glassmorphism, Neumorphism, and Parallax effects
- **Comprehensive Security** with JWT authentication and role-based access control
- **File Management** with upload/download capabilities
- **Email Notifications** for invitations and task updates
- **Advanced Testing** with comprehensive test suite
- **Production Deployment** with Docker, PM2, and CI/CD ready

### Backend Features
- **JWT Authentication** with refresh token mechanism
- **Role-based Access Control** (Admin, Member, Guest)
- **Workspace Management** with member invitations
- **Project Management** with nested task relationships
- **Task Management** with status flow (To-Do → In Progress → Review → Completed)
- **Real-time Comments** and activity tracking
- **Comprehensive Swagger API Documentation**
- **File Upload Support** for task attachments
- **Email Notification System** for invitations and updates
- **Advanced Error Handling** and validation middleware
- **Request Logging** and performance monitoring
- **Comprehensive Test Suite** with Jest and Supertest
- **Production-ready Deployment** with Docker and PM2

### Frontend Features
- **Redux Toolkit** with complete state management
- **Modern UI Effects**: Glassmorphism, Neumorphism, Parallax
- **Responsive Design** for desktop and mobile
- **Dark/Light Theme** toggle
- **Drag & Drop** Kanban board for tasks
- **Real-time Updates** with Socket.io
- **Advanced Filtering** and search capabilities
- **Role-based UI** access control

### Redux Patterns Implemented
- ✅ Actions and Reducers
- ✅ Async Thunks for API calls
- ✅ Slices for modular state management
- ✅ Custom Middleware for logging and error handling
- ✅ Redux Persist for session management
- ✅ Complex Selectors for derived state
- ✅ Normalized state structure
- ✅ Optimistic updates
- ✅ Error handling and loading states
- ✅ Real-time state synchronization

### 🛡️ Security & Performance
- **JWT Authentication** with refresh token rotation
- **Role-based Access Control** with granular permissions
- **Rate Limiting** to prevent abuse
- **Input Validation** with express-validator
- **File Upload Security** with type and size restrictions
- **CORS Configuration** for secure cross-origin requests
- **Helmet.js** for security headers
- **Request Logging** for monitoring and debugging
- **Error Handling** with comprehensive error middleware
- **Performance Monitoring** with slow request detection

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Swagger** for API documentation
- **Multer** for file uploads
- **Bcrypt** for password hashing

### Frontend
- **React 18** with functional components
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Framer Motion** for animations
- **React Beautiful DnD** for drag & drop
- **React Hook Form** for form management
- **Tailwind CSS** for styling
- **Lucide React** for icons

## 📁 Project Structure

```
smart-workspace-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Redux slices and features
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Redux store configuration
│   │   └── App.js          # Main App component
│   └── package.json
├── models/                 # MongoDB models
├── routes/                 # Express routes
├── middleware/             # Custom middleware
├── server.js               # Express server
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-workspace-platform
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-workspace
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_REFRESH_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   ```

5. **Start the development servers**
   ```bash
   # Start both backend and frontend
   npm run dev:full
   
   # Or start them separately
   npm run dev          # Backend only
   npm run client       # Frontend only
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

## 📚 API Documentation

The API documentation is available at `/api/docs` when the server is running. It includes:

- **Authentication endpoints** (login, register, refresh token)
- **Workspace management** (CRUD operations, member invitations)
- **Project management** (CRUD operations, member assignments)
- **Task management** (CRUD operations, comments, assignments)
- **User management** (profile updates, role management)

## 🎨 UI Design Features

### Glassmorphism Effects
- Semi-transparent cards with backdrop blur
- Frosted glass appearance
- Subtle borders and shadows

### Neumorphism Elements
- Soft, extruded appearance
- Inset and outset shadows
- Tactile button interactions

### Parallax Scrolling
- Background elements moving at different speeds
- Layered depth perception
- Smooth scrolling animations

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access, can manage all workspaces and users
- **Member**: Can create workspaces, manage projects and tasks
- **Guest**: Read-only access to assigned content

### Permission System
- Workspace-level permissions
- Project-level permissions
- Task-level permissions
- Role-based UI rendering

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the React app: `cd client && npm run build`
2. Serve the built files with a web server

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
CLIENT_URL=your-production-frontend-url
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Redux team for state management
- Tailwind CSS for styling utilities
- Framer Motion for animations
- All the open-source contributors

## 🧪 Testing

The project includes a comprehensive test suite using Jest and Supertest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- **API Endpoints** - All routes tested with various scenarios
- **Authentication** - Login, register, token validation
- **CRUD Operations** - Workspaces, projects, tasks
- **Error Handling** - Validation errors, server errors
- **Security** - Authorization, access control

## 🔧 Additional Features

### File Upload System
- **Multiple file types** supported (images, documents, etc.)
- **Size restrictions** and validation
- **Secure file storage** with proper access control
- **Download functionality** with proper headers

### Email Notification System
- **Workspace invitations** with beautiful HTML templates
- **Task assignments** and updates
- **Comment notifications** for team collaboration
- **Password reset** functionality

### Advanced Error Handling
- **Comprehensive error middleware** for all error types
- **Validation errors** with detailed field information
- **Database errors** with proper error messages
- **File upload errors** with size and type validation
- **JWT errors** with proper authentication handling

### Monitoring & Logging
- **Request Logging** - All API requests logged with timing
- **Error Logging** - Detailed error tracking and reporting
- **Performance Monitoring** - Slow request detection
- **Database Logging** - Query performance monitoring
- **Socket.io Logging** - Real-time event tracking
- **Log Rotation** - Automatic log file rotation

---

**Built with ❤️ using MERN stack and modern web technologies**
