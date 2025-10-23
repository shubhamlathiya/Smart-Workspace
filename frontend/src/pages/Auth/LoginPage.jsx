import React, {useState, useEffect} from 'react';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useForm} from 'react-hook-form';
import {Eye, EyeOff, Mail, Lock, User} from 'lucide-react';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {loginUser} from '../../features/auth/authSlice.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';

const LoginPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const {loading, isAuthenticated} = useAppSelector(state => state.auth);

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, {replace: true});
        }
    }, [isAuthenticated, navigate, location]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await dispatch(loginUser(data)).unwrap();
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, {replace: true});
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
                <LoadingSpinner size="large" text="Logging in..."/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="relative z-10 w-full max-w-md"
            >
                {/* Login form */}
                <div>
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            transition={{delay: 0.2, type: 'spring', stiffness: 200}}
                            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <User className="w-8 h-8 text-white"/>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-white/70">Sign in to your Smart Workspace account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email field */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70"/>
                                <input
                                    type="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^\S+@\S+$/i,
                                            message: 'Invalid email address',
                                        },
                                    })}
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                                    placeholder="Enter your email"
                                />
                            </div>
                            {errors.email && (
                                <motion.p
                                    initial={{opacity: 0, y: -10}}
                                    animate={{opacity: 1, y: 0}}
                                    className="mt-1 text-sm text-red-300"
                                >
                                    {errors.email.message}
                                </motion.p>
                            )}
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70"/>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters',
                                        },
                                    })}
                                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                </button>
                            </div>
                            {errors.password && (
                                <motion.p
                                    initial={{opacity: 0, y: -10}}
                                    animate={{opacity: 1, y: 0}}
                                    className="mt-1 text-sm text-red-300"
                                >
                                    {errors.password.message}
                                </motion.p>
                            )}
                        </div>

                        {/* Submit button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <LoadingSpinner size="small" color="white"/>
                                    <span className="ml-2">Signing in...</span>
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <p className="text-white/70">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-white font-semibold hover:text-white/80 transition-colors"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
