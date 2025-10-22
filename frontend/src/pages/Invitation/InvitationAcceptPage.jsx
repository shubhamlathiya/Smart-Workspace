// pages/InvitationAcceptPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {useAppDispatch, useAppSelector} from "../../hooks/redux.js";
import {acceptInvitation, verifyInvitation} from "../../features/invitation/invitationSlice.jsx";
import LoadingSpinner from "../../components/UI/LoadingSpinner.jsx";



const InvitationAcceptPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAppSelector(state => state.auth);

    const token = searchParams.get('token');
    const [invitationData, setInvitationData] = useState(null);
    const [step, setStep] = useState('loading'); // loading, login, register, success, error
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            handleInvitationVerification();
        } else {
            setError('No invitation token found');
            setStep('error');
        }
    }, [token]);

    const handleInvitationVerification = async () => {
        try {
            const result = await verifyInvitation(token);

            if (result.success) {
                setInvitationData(result.data);

                if (isAuthenticated) {
                    // User is logged in, accept invitation directly
                    await handleAcceptInvitation();
                } else {
                    // User needs to login or register
                    if (result.data.userExists) {
                        setStep('login');
                    } else {
                        setStep('register');
                    }
                }
            } else {
                setError(result.error);
                setStep('error');
            }
        } catch (err) {
            setError('Failed to verify invitation');
            setStep('error');
        }
    };

    const handleAcceptInvitation = async () => {
        try {
            const result = await
                acceptInvitation(token);

            if (result.success) {
                setStep('success');

                // Redirect after 3 seconds
                setTimeout(() => {
                    if (result.redirectPath) {
                        navigate(result.redirectPath);
                    } else if (invitationData?.type === 'project') {
                        navigate(`/projects/${invitationData.project?._id}`);
                    } else if (invitationData?.type === 'workspace') {
                        navigate(`/workspaces/${invitationData.workspace?._id}`);
                    } else {
                        navigate('/dashboard');
                    }
                }, 3000);
            } else {
                setError(result.error);
                setStep('error');
            }
        } catch (err) {
            setError('Failed to accept invitation');
            setStep('error');
        }
    };

    const handleLogin = async (loginData) => {
        try {
            await dispatch(login(loginData)).unwrap();
            await handleAcceptInvitation();
        } catch (err) {
            setError('Login failed. Please try again.');
        }
    };

    const handleRegisterRedirect = () => {
        // Redirect to register page with invitation token
        navigate(`/register?token=${token}`);
    };

    const renderContent = () => {
        switch (step) {
            case 'loading':
                return (
                    <div className="text-center py-12">
                        <LoadingSpinner size="large" />
                        <p className="text-white/70 mt-4">Verifying your invitation...</p>
                    </div>
                );

            case 'login':
                return (
                    <LoginForm
                        invitationData={invitationData}
                        onLogin={handleLogin}
                        onRegisterRedirect={handleRegisterRedirect}
                    />
                );

            case 'register':
                return (
                    <RegisterRedirect
                        invitationData={invitationData}
                        onRegister={handleRegisterRedirect}
                        onLoginRedirect={() => setStep('login')}
                    />
                );

            case 'success':
                return (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Invitation Accepted!</h2>
                        <p className="text-white/70 mb-6">
                            {invitationData?.type === 'project'
                                ? `You've successfully joined the project "${invitationData?.project?.name}".`
                                : `You've successfully joined the workspace "${invitationData?.workspace?.name}".`
                            }
                        </p>
                        <p className="text-white/50 text-sm">
                            Redirecting...
                        </p>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Invitation Error</h2>
                        <p className="text-white/70 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Homepage
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card max-w-md w-full p-8"
            >
                {renderContent()}
            </motion.div>
        </div>
    );
};

// Login Form Component
const LoginForm = ({ invitationData, onLogin, onRegisterRedirect }) => {
    const [formData, setFormData] = useState({
        email: invitationData?.email || '',
        password: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(formData);
    };

    return (
        <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Login to Accept</h2>
                <p className="text-white/70">
                    Please login to accept your invitation to{' '}
                    {invitationData?.type === 'project'
                        ? `"${invitationData?.project?.name}"`
                        : `"${invitationData?.workspace?.name}"`
                    }
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Login & Accept Invitation
                </button>
            </form>

            <div className="text-center mt-4">
                <p className="text-white/70 text-sm">
                    Don't have an account?{' '}
                    <button
                        onClick={onRegisterRedirect}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Create one now
                    </button>
                </p>
            </div>
        </div>
    );
};

// Register Redirect Component
const RegisterRedirect = ({ invitationData, onRegister, onLoginRedirect }) => {
    return (
        <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Create Account</h2>
            <p className="text-white/70 mb-6">
                You need to create an account to accept this invitation to{' '}
                {invitationData?.type === 'project'
                    ? `"${invitationData?.project?.name}"`
                    : `"${invitationData?.workspace?.name}"`
                }
            </p>

            <div className="space-y-3">
                <button
                    onClick={onRegister}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Create Account & Join
                </button>

                <button
                    onClick={onLoginRedirect}
                    className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                    Already have an account? Login
                </button>
            </div>
        </div>
    );
};

export default InvitationAcceptPage;