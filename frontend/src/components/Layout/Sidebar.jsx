import React from 'react';
import {NavLink, useLocation} from 'react-router-dom';
import {motion} from 'framer-motion';
import {
    Home,
    Users,
    FolderOpen,
    CheckSquare,
    User,
    Settings,
    Menu,
    X,
    Shield
} from 'lucide-react';
import {useAppSelector} from '../../hooks/redux';
import {usePermissions} from '../Auth/RoleBasedAccess.jsx';
import PermissionGuard from '../Auth/PermissionGuard.jsx';

const Sidebar = ({isOpen, isCollapsed, onToggle}) => {
    const location = useLocation();
    const {user} = useAppSelector(state => state.auth);
    const {isMobile} = useAppSelector(state => state.ui);
    const {hasRole, hasPermission} = usePermissions();

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: Home,
            permission: null, // Available to all authenticated users
        },
        {
            name: 'Workspaces',
            href: '/workspaces',
            icon: Users,
            permission: 'create_workspace', // Only members and admins
        },
        {
            name: 'Projects',
            href: '/projects',
            icon: FolderOpen,
            permission: 'create_project', // Only members and admins
        },
        {
            name: 'Tasks',
            href: '/tasks',
            icon: CheckSquare,
            permission: 'view_assigned_tasks', // Available to all authenticated users
        },
        {
            name: 'Profile',
            href: '/profile',
            icon: User,
            permission: null, // Available to all authenticated users
        },
    ];

    // Add admin-only navigation items
    if (hasRole('admin')) {
        navigationItems.push({
            name: 'Admin Panel',
            href: '/admin',
            icon: Shield,
            permission: 'manage_users',
        });
    }

    const sidebarVariants = {
        open: {x: 0},
        closed: {x: '-100%'},
    };

    const sidebarContent = (
        <div className="h-full flex flex-col bg-white/10 backdrop-blur-lg border-r border-white/20">
            {/* Header */}
            <div className="p-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <motion.h1
                            className="text-xl font-bold text-white"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{delay: 0.1}}
                        >
                            Smart Workspace
                        </motion.h1>
                    )}
                    <button
                        onClick={onToggle}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        {isOpen ? <X className="w-5 h-5 text-white"/> : <Menu className="w-5 h-5 text-white"/>}
                    </button>
                </div>
            </div>

            {/* User info */}
            {!isCollapsed && user && (
                <motion.div
                    className="p-4 border-b border-white/20"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.2}}
                >
                    <div className="flex items-center space-x-3">
                        <div
                            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </span>
                        </div>
                        <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-white/70 text-sm capitalize">{user.role}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {navigationItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <PermissionGuard
                                key={item.name}
                                permission={item.permission}
                            >
                                <motion.li
                                    initial={{opacity: 0, x: -20}}
                                    animate={{opacity: 1, x: 0}}
                                    transition={{delay: 0.1 * index}}
                                >
                                    <NavLink
                                        to={item.href}
                                        className={({isActive}) =>
                                            `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-white/20 text-white shadow-lg'
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                            }`
                                        }
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0"/>
                                        {!isCollapsed && (
                                            <span className="font-medium">{item.name}</span>
                                        )}
                                    </NavLink>
                                </motion.li>
                            </PermissionGuard>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            {!isCollapsed && (
                <motion.div
                    className="p-4 border-t border-white/20"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.5}}
                >
                    <button
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors w-full">
                        <Settings className="w-5 h-5"/>
                        <span className="font-medium">Settings</span>
                    </button>
                </motion.div>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <motion.div
                variants={sidebarVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                className="fixed inset-y-0 left-0 z-50 w-64"
            >
                {sidebarContent}
            </motion.div>
        );
    }

    return (
        <motion.div
            className={`fixed inset-y-0 left-0 z-30 ${
                isCollapsed ? 'w-16' : 'w-64'
            }`}
            animate={{width: isCollapsed ? 64 : 256}}
            transition={{duration: 0.3}}
        >
            {sidebarContent}
        </motion.div>
    );
};

export default Sidebar;
