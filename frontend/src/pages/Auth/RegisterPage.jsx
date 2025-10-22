import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {registerUser} from "../../features/auth/authSlice.jsx";


const RegisterPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    // Get invitation parameters from URL
    const workspaceId = searchParams.get('workspace');
    const projectId = searchParams.get('project');
    const invitationEmail = searchParams.get('email');

    const role = searchParams.get('role') || 'member';

    const [formData, setFormData] = useState({
        name: '',
        email: invitationEmail || '',
        password: '',
        confirmPassword: '',
        workspaceId: workspaceId || '',
        projectId: projectId || '',
        role: role
    });

    const [errors, setErrors] = useState({});
    const [isInvitation, setIsInvitation] = useState(false);

    useEffect(() => {
        // Check if this is an invitation signup
        if (workspaceId && invitationEmail) {
            setIsInvitation(true);
            console.log('Workspace invitation detected:', {
                workspaceId,
                email: invitationEmail,
                role
            });
        }else if (invitationEmail && projectId) {
            setIsInvitation(true);
            console.log('Workspace invitation detected:', {
                projectId,
                email: invitationEmail,
                role
            });
        }
    }, [workspaceId, invitationEmail, projectId, role]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = 'Name must be less than 50 characters';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Prepare data according to API requirements
            const userData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
            };

            // Add invitation data if this is an invitation
            if (isInvitation) {
                userData.invitation = {
                    workspaceId: formData.workspaceId,
                    projectId: formData.projectId ,
                    role: formData.role,
                    email: formData.email
                };
            }

            console.log(userData);
            const result = await dispatch(registerUser(userData)).unwrap();
            // console.log(isInvitation)
            // console.log(formData.workspaceId)
            // Registration successful - redirect based on invitation status
            if (isInvitation) {
                // Redirect to workspace after successful invitation signup
                navigate(`/workspaces/${formData.workspaceId}`, {
                    state: {
                        message: `Welcome! You've successfully joined the workspace as a ${formData.role}.`,
                        type: 'success'
                    },
                    replace: true
                });
            } else {
                // Regular signup - redirect to login
                navigate('/login', {
                    state: {
                        message: 'Registration successful! Please login to continue.',
                        type: 'success'
                    },
                    replace: true
                });
            }
        } catch (error) {
            // Error is handled by the auth slice and shown via toast
            console.error('Registration failed:', error);
        }
    };

    const getRoleDisplayName = (role) => {
        const roleNames = {
            'admin': 'Administrator',
            'member': 'Team Member',
            'viewer': 'Viewer',
            'guest': 'Guest'
        };
        return roleNames[role] || role;
    };

    return (
        <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className=" max-w-md w-full"
            >
                {/* Header with invitation info */}
                <div className="text-center mb-8">
                    {isInvitation ? (
                        <>
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">👥</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Join Workspace</h1>
                            <p className="text-white/70">
                                You've been invited to join a workspace as{' '}
                                <span className="text-green-400 font-semibold capitalize">
                                    {getRoleDisplayName(formData.role)}
                                </span>
                            </p>
                            {invitationEmail && (
                                <p className="text-white/60 text-sm mt-2">
                                    Email: <span className="text-white">{invitationEmail}</span>
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                            <p className="text-white/70">Join Smart Workspace today</p>
                        </>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white mb-1">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.name ? 'border-red-500' : 'border-white/20'
                            }`}
                            placeholder="John Doe"
                            minLength={2}
                            maxLength={50}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                        )}
                        <p className="mt-1 text-xs text-white/50">
                            {formData.name.length}/50 characters
                        </p>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.email ? 'border-red-500' : 'border-white/20'
                            }`}
                            placeholder="john@example.com"
                            readOnly={isInvitation} // Make email read-only for invitations
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                        )}
                        {isInvitation && (
                            <p className="mt-1 text-xs text-blue-400">
                                This email was used for your workspace invitation
                            </p>
                        )}
                    </div>

                    {/* Password Fields */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                            Password *
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.password ? 'border-red-500' : 'border-white/20'
                            }`}
                            placeholder="••••••••"
                            minLength={6}
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                        )}
                        <p className="mt-1 text-xs text-white/50">
                            Minimum 6 characters
                        </p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.confirmPassword ? 'border-red-500' : 'border-white/20'
                            }`}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Invitation Notice */}
                    {isInvitation && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-400 text-sm">
                                <span>🔒</span>
                                <p>
                                    By creating an account, you'll automatically join the workspace as a{' '}
                                    <span className="font-semibold">{getRoleDisplayName(formData.role)}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                                {isInvitation ? 'Joining Workspace...' : 'Creating Account...'}
                            </div>
                        ) : (
                            isInvitation ? 'Join Workspace' : 'Create Account'
                        )}
                    </button>

                    {/* Server Error */}
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Login Link */}
                    <div className="text-center pt-4">
                        <p className="text-white/70">
                            {isInvitation ? (
                                <>
                                    Already have an account?{' '}
                                    <Link
                                        to={`/login?workspace=${workspaceId}&email=${encodeURIComponent(invitationEmail)}`}
                                        className="text-white font-semibold hover:text-white/80 transition-colors underline"
                                    >
                                        Sign in here
                                    </Link>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className="text-white font-semibold hover:text-white/80 transition-colors underline"
                                    >
                                        Sign in here
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Regular Signup Link for Invitation Flow */}
                    {isInvitation && (
                        <div className="text-center">
                            <p className="text-white/50 text-sm">
                                Not joining a workspace?{' '}
                                <Link
                                    to="/register"
                                    className="text-white/70 hover:text-white transition-colors underline"
                                >
                                    Create regular account
                                </Link>
                            </p>
                        </div>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default RegisterPage;