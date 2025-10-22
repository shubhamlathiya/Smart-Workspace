import React from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  User,
  LogOut,
  Settings,
  Shield
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleTheme, openModal } from '../../features/ui/uiSlice.jsx';
import { logoutUser } from '../../features/auth/authSlice.jsx';
import { usePermissions } from '../Auth/RoleBasedAccess.jsx';
import PermissionGuard from '../Auth/PermissionGuard.jsx';

const Header = ({ onSidebarToggle }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { theme, unreadCount } = useAppSelector(state => state.ui);
  const { hasRole, hasPermission } = usePermissions();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleProfileClick = () => {
    dispatch(openModal('editProfile'));
  };

  const handleAdminPanel = () => {
    // Navigate to admin panel
    console.log('Navigate to admin panel');
  };

  return (
    <motion.header 
      className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          
          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold text-white">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-white/70 text-sm">
              Here's what's happening in your workspace today.
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-white" />
            ) : (
              <Sun className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <motion.span 
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>
          </div>

          {/* User menu */}
          <div className="relative">
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-white/70 text-sm capitalize">{user?.role}</p>
              </div>
              
              <div className="relative group">
                <button
                  onClick={handleProfileClick}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <span className="text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 top-12 w-48 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 w-full text-left"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    
                    {/* Admin Panel - Only for admins */}
                    <PermissionGuard permission="manage_users">
                      <button
                        onClick={handleAdminPanel}
                        className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 w-full text-left"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </button>
                    </PermissionGuard>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
