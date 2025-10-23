import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {Toaster} from 'react-hot-toast';

import {store, persistor} from './store';
import {useAppDispatch, useAppSelector} from './hooks/redux';

// Components
import Layout from './components/Layout/Layout.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import LoadingSpinner from './components/UI/LoadingSpinner.jsx';
import ModalManager from './components/Modals/ModalManager.jsx';

// Pages
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import WorkspacesPage from './pages/Workspaces/WorkspacesPage.jsx';
import WorkspaceDetailPage from './pages/Workspaces/WorkspaceDetailPage.jsx';
import ProjectsPage from './pages/Projects/ProjectsPage.jsx';
import ProjectDetailPage from './pages/Projects/ProjectDetailPage.jsx';
import TasksPage from './pages/Tasks/TasksPage.jsx';
import TaskDetailPage from './pages/Tasks/TaskDetailPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import NotFoundPage from './pages/NotFound/NotFoundPage.jsx';

// Actions
import {getCurrentUser} from './features/auth/authSlice.jsx';
import {fetchWorkspaces} from './features/workspace/workspaceSlice.jsx';
import {fetchProjects} from './features/project/projectSlice.jsx';
import {fetchTasks} from './features/task/taskSlice.jsx';

// App component
function AppContent() {
    const dispatch = useAppDispatch();
    const {isAuthenticated, isLoading, user} = useAppSelector(state => state.auth);
    const {globalLoading} = useAppSelector(state => state.ui);

    // Initialize app data
    useEffect(() => {
        const initializeApp = async () => {
            if (isAuthenticated && user) {
                try {
                    // Fetch initial data
                    await Promise.all([
                        dispatch(fetchWorkspaces()),
                        dispatch(fetchProjects()),
                        dispatch(fetchTasks()),
                    ]);
                } catch (error) {
                    console.error('Failed to initialize app data:', error);
                }
            }
        };

        initializeApp();
    }, [dispatch, isAuthenticated, user]);

    // Check for existing token on app load
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !isAuthenticated) {
            dispatch(getCurrentUser());
        }
    }, [dispatch, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
                <LoadingSpinner size="large"/>
            </div>
        );
    }

    return (
        <Router>
            <div className="min-h-screen bg-gradient-primary">
                <Routes>
                    {/* Public routes */}
                    <Route path="/register/accept" element={<RegisterPage/>}/>

                    <Route
                        path="/login"
                        element={
                            isAuthenticated ? <Navigate to="/dashboard" replace/> : <LoginPage/>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            isAuthenticated ? <Navigate to="/dashboard" replace/> : <RegisterPage/>
                        }
                    />

                    {/* Protected routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout/>
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/dashboard" replace/>}/>
                        <Route path="dashboard" element={<DashboardPage/>}/>

                        {/* Workspace routes */}
                        <Route path="workspaces" element={<WorkspacesPage/>}/>
                        <Route path="workspaces/:id" element={<WorkspaceDetailPage/>}/>

                        {/* Project routes */}
                        <Route path="projects" element={<ProjectsPage/>}/>
                        <Route path="projects/:id" element={<ProjectDetailPage/>}/>

                        {/* Task routes */}
                        <Route path="tasks" element={<TasksPage/>}/>
                        <Route path="tasks/:id" element={<TaskDetailPage/>}/>

                        {/* Profile route */}
                        <Route path="profile" element={<ProfilePage/>}/>

                    </Route>

                    {/* 404 route */}
                    <Route path="*" element={<NotFoundPage/>}/>
                </Routes>

                {/* Global loading overlay */}
                {globalLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <LoadingSpinner size="large"/>
                    </div>
                )}

                {/* Toast notifications */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />

                {/* Modal Manager */}
                <ModalManager/>
            </div>
        </Router>
    );
}

// Main App component
function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={<LoadingSpinner size="large"/>} persistor={persistor}>
                <AppContent/>
            </PersistGate>
        </Provider>
    );
}

export default App;
