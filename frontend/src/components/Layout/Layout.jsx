import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleSidebar, setSidebarOpen } from '../../features/ui/uiSlice.jsx';

// Components
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const Layout = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, sidebarCollapsed, isMobile } = useAppSelector(state => state.ui);

  const handleSidebarToggle = () => {
    if (isMobile) {
      dispatch(setSidebarOpen(!sidebarOpen));
    } else {
      dispatch(toggleSidebar());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />

      {/* Main content area */}
      <div className={`transition-all duration-300 ${
        sidebarOpen && !isMobile 
          ? sidebarCollapsed 
            ? 'ml-16' 
            : 'ml-64'
          : isMobile && sidebarOpen
            ? 'ml-64'
            : 'ml-0'
      }`}>
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />

        {/* Page content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}
    </div>
  );
};

export default Layout;
