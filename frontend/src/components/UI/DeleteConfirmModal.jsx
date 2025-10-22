import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { closeModal } from '../../features/ui/uiSlice.jsx';

const DeleteConfirmModal = () => {
  const dispatch = useAppDispatch();
  const { modals } = useAppSelector(state => state.ui);
  const isOpen = modals.deleteConfirm;

  const handleClose = () => {
    dispatch(closeModal('deleteConfirm'));
  };

  const handleConfirm = () => {
    // Handle delete confirmation
    console.log('Delete confirmed');
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Confirm Delete</h2>
                  <p className="text-white/70 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-white/80 mb-6">
                Are you sure you want to delete this item? This action cannot be undone and will permanently remove all associated data.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 glass-button text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
