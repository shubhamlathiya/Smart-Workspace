import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {getCurrentUser, updateUserProfile} from "../../features/auth/authSlice.jsx";

const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const { user, isLoading, error } = useAppSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        company: '',
        bio: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                company: user.company || '',
                bio: user.bio || '',
            });
        }
    }, [user]);

    useEffect(() => {
        // Fetch current user data if not already loaded
        if (!user) {
            dispatch(getCurrentUser());
        }
    }, [dispatch, user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateProfile = () => {
        const newErrors = {};

        if (!profileData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (profileData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!profileData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (profileData.phoneNumber && !/^\+?[\d\s-()]+$/.test(profileData.phoneNumber)) {
            newErrors.phoneNumber = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePassword = () => {
        const newErrors = {};

        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        if (!validateProfile()) {
            return;
        }

        try {
            await dispatch(updateUserProfile({
                id: user._id,
                ...profileData
            })).unwrap();

            setSuccessMessage('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Profile update failed:', error);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!validatePassword()) {
            return;
        }

        try {
            // This would call a separate password update API endpoint
            // For now, we'll use the same update endpoint
            await dispatch(updateUserProfile({
                id: user._id,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })).unwrap();

            setSuccessMessage('Password updated successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Password update failed:', error);
        }
    };

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').toUpperCase()
            : 'U';
    };

    const getAvatarColor = (name) => {
        const colors = [
            'from-blue-500 to-cyan-600',
            'from-green-500 to-emerald-600',
            'from-purple-500 to-indigo-600',
            'from-orange-500 to-red-600',
            'from-pink-500 to-rose-600',
        ];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                <p className="text-white/70">Manage your account settings</p>
            </motion.div>

            {/* Success Message */}
            {successMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/20 border border-green-500 rounded-lg"
                >
                    <p className="text-green-400 text-center">{successMessage}</p>
                </motion.div>
            )}

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/20 border border-red-500 rounded-lg"
                >
                    <p className="text-red-400 text-center">{error}</p>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="lg:col-span-1"
                >
                    <div className="glass-card p-6">
                        {/* User Info */}
                        <div className="text-center mb-6">
                            <div className={`w-20 h-20 bg-gradient-to-r ${getAvatarColor(user.name)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-2xl font-bold text-white">
                  {getInitials(user.name)}
                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                            <p className="text-white/70 text-sm">{user.email}</p>
                            <div className="mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full inline-block">
                                {user.role || 'Member'}
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === 'profile'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Profile Information
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === 'password'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Change Password
                            </button>
                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === 'preferences'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Preferences
                            </button>
                        </nav>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-3"
                >
                    {/* Profile Information Tab */}
                    {activeTab === 'profile' && (
                        <div className="glass-card p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Profile Information</h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={profileData.name}
                                                onChange={handleProfileChange}
                                                className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.name ? 'border-red-500' : 'border-white/20'
                                                }`}
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                onChange={handleProfileChange}
                                                className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.email ? 'border-red-500' : 'border-white/20'
                                                }`}
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={profileData.phoneNumber}
                                                onChange={handleProfileChange}
                                                className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.phoneNumber ? 'border-red-500' : 'border-white/20'
                                                }`}
                                                placeholder="+1 (555) 123-4567"
                                            />
                                            {errors.phoneNumber && (
                                                <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Company
                                            </label>
                                            <input
                                                type="text"
                                                name="company"
                                                value={profileData.company}
                                                onChange={handleProfileChange}
                                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={profileData.bio}
                                            onChange={handleProfileChange}
                                            rows="4"
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Tell us a little about yourself..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                                        >
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setErrors({});
                                                // Reset form data to original user data
                                                setProfileData({
                                                    name: user.name || '',
                                                    email: user.email || '',
                                                    phoneNumber: user.phoneNumber || '',
                                                    company: user.company || '',
                                                    bio: user.bio || '',
                                                });
                                            }}
                                            className="px-6 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-1">
                                                Full Name
                                            </label>
                                            <p className="text-white">{user.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-1">
                                                Email Address
                                            </label>
                                            <p className="text-white">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-1">
                                                Phone Number
                                            </label>
                                            <p className="text-white">{user.phoneNumber || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-1">
                                                Company
                                            </label>
                                            <p className="text-white">{user.company || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    {user.bio && (
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-1">
                                                Bio
                                            </label>
                                            <p className="text-white">{user.bio}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Change Password Tab */}
                    {activeTab === 'password' && (
                        <div className="glass-card p-6">
                            <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Current Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.currentPassword ? 'border-red-500' : 'border-white/20'
                                        }`}
                                        placeholder="Enter current password"
                                    />
                                    {errors.currentPassword && (
                                        <p className="mt-1 text-sm text-red-400">{errors.currentPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        New Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.newPassword ? 'border-red-500' : 'border-white/20'
                                        }`}
                                        placeholder="Enter new password"
                                    />
                                    {errors.newPassword && (
                                        <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Confirm New Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.confirmPassword ? 'border-red-500' : 'border-white/20'
                                        }`}
                                        placeholder="Confirm new password"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="glass-card p-6">
                            <h3 className="text-xl font-bold text-white mb-6">Preferences</h3>
                            <div className="space-y-4">
                                <p className="text-white/70">
                                    Preferences management coming soon. You'll be able to customize your notification settings,
                                    language preferences, and other account settings here.
                                </p>
                                {/* Add preferences form elements here when ready */}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;