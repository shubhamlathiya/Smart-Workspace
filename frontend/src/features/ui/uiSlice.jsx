import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  // Theme
  theme: 'light',
  
  // Sidebar
  sidebarOpen: true,
  sidebarCollapsed: false,
  
  // Modals
  modals: {
    createWorkspace: false,
    createProject: false,
    createTask: false,
    editProfile: false,
    inviteMember: false,
    deleteConfirm: false,
    assignUsers : false,
  },
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // Loading states
  globalLoading: false,
  
  // Errors
  errors: [],
  
  // Success messages
  successMessages: [],
  
  // Active filters
  activeFilters: {
    workspace: null,
    project: null,
    status: null,
    priority: null,
  },
  
  // Search
  searchQuery: '',
  searchResults: [],
  
  // View modes
  viewMode: 'grid', // grid, list, kanban
  
  // Selected items
  selectedItems: [],
  
  // Drag and drop
  dragState: {
    isDragging: false,
    draggedItem: null,
    dragOverItem: null,
  },
  
  // Real-time updates
  realTimeEnabled: true,
  lastActivity: null,
  
  // Mobile
  isMobile: false,
  mobileMenuOpen: false,
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    
    // Sidebar actions
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Modal actions
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: Date.now(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    },
    
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        state.unreadCount -= 1;
      }
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    // Loading actions
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    // Error actions
    addError: (state, action) => {
      const error = {
        id: Date.now(),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.errors.unshift(error);
    },
    
    removeError: (state, action) => {
      const errorId = action.payload;
      state.errors = state.errors.filter(e => e.id !== errorId);
    },
    
    clearAllErrors: (state) => {
      state.errors = [];
    },
    
    // Success message actions
    addSuccessMessage: (state, action) => {
      const message = {
        id: Date.now(),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.successMessages.unshift(message);
    },
    
    removeSuccessMessage: (state, action) => {
      const messageId = action.payload;
      state.successMessages = state.successMessages.filter(m => m.id !== messageId);
    },
    
    clearAllSuccessMessages: (state) => {
      state.successMessages = [];
    },
    
    // Filter actions
    setActiveFilter: (state, action) => {
      const { key, value } = action.payload;
      state.activeFilters[key] = value;
    },
    
    clearActiveFilter: (state, action) => {
      const key = action.payload;
      state.activeFilters[key] = null;
    },
    
    clearAllActiveFilters: (state) => {
      state.activeFilters = {
        workspace: null,
        project: null,
        status: null,
        priority: null,
      };
    },
    
    // Search actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
    },
    
    // View mode actions
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      localStorage.setItem('viewMode', action.payload);
    },
    
    // Selection actions
    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload;
    },
    
    addSelectedItem: (state, action) => {
      const item = action.payload;
      if (!state.selectedItems.find(i => i.id === item.id)) {
        state.selectedItems.push(item);
      }
    },
    
    removeSelectedItem: (state, action) => {
      const itemId = action.payload;
      state.selectedItems = state.selectedItems.filter(i => i.id !== itemId);
    },
    
    clearSelectedItems: (state) => {
      state.selectedItems = [];
    },
    
    // Drag and drop actions
    setDragState: (state, action) => {
      state.dragState = { ...state.dragState, ...action.payload };
    },
    
    startDrag: (state, action) => {
      state.dragState = {
        isDragging: true,
        draggedItem: action.payload,
        dragOverItem: null,
      };
    },
    
    setDragOverItem: (state, action) => {
      state.dragState.dragOverItem = action.payload;
    },
    
    endDrag: (state) => {
      state.dragState = {
        isDragging: false,
        draggedItem: null,
        dragOverItem: null,
      };
    },
    
    // Real-time actions
    setRealTimeEnabled: (state, action) => {
      state.realTimeEnabled = action.payload;
    },
    
    setLastActivity: (state, action) => {
      state.lastActivity = action.payload;
    },
    
    // Mobile actions
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    
    // Reset actions
    resetUI: (state) => {
      return { ...initialState, theme: state.theme };
    },
  },
});

// Action creators
export const {
  // Theme
  setTheme,
  toggleTheme,
  
  // Sidebar
  setSidebarOpen,
  toggleSidebar,
  setSidebarCollapsed,
  toggleSidebarCollapsed,
  
  // Modals
  openModal,
  closeModal,
  closeAllModals,
  
  // Notifications
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearAllNotifications,
  
  // Loading
  setGlobalLoading,
  
  // Errors
  addError,
  removeError,
  clearAllErrors,
  
  // Success messages
  addSuccessMessage,
  removeSuccessMessage,
  clearAllSuccessMessages,
  
  // Filters
  setActiveFilter,
  clearActiveFilter,
  clearAllActiveFilters,
  
  // Search
  setSearchQuery,
  setSearchResults,
  clearSearch,
  
  // View mode
  setViewMode,
  
  // Selection
  setSelectedItems,
  addSelectedItem,
  removeSelectedItem,
  clearSelectedItems,
  
  // Drag and drop
  setDragState,
  startDrag,
  setDragOverItem,
  endDrag,
  
  // Real-time
  setRealTimeEnabled,
  setLastActivity,
  
  // Mobile
  setIsMobile,
  setMobileMenuOpen,
  toggleMobileMenu,
  
  // Reset
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectIsDarkMode = (state) => state.ui.theme === 'dark';

export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;

export const selectModals = (state) => state.ui.modals;
export const selectModalOpen = (modalName) => (state) => state.ui.modals[modalName];

export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadCount = (state) => state.ui.unreadCount;
export const selectUnreadNotifications = (state) => 
  state.ui.notifications.filter(n => !n.read);

export const selectGlobalLoading = (state) => state.ui.globalLoading;

export const selectErrors = (state) => state.ui.errors;
export const selectSuccessMessages = (state) => state.ui.successMessages;

export const selectActiveFilters = (state) => state.ui.activeFilters;
export const selectActiveFilter = (key) => (state) => state.ui.activeFilters[key];

export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectSearchResults = (state) => state.ui.searchResults;

export const selectViewMode = (state) => state.ui.viewMode;

export const selectSelectedItems = (state) => state.ui.selectedItems;
export const selectIsItemSelected = (itemId) => (state) => 
  state.ui.selectedItems.some(item => item.id === itemId);

export const selectDragState = (state) => state.ui.dragState;
export const selectIsDragging = (state) => state.ui.dragState.isDragging;

export const selectRealTimeEnabled = (state) => state.ui.realTimeEnabled;
export const selectLastActivity = (state) => state.ui.lastActivity;

export const selectIsMobile = (state) => state.ui.isMobile;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;

// Complex selectors
export const selectHasActiveFilters = (state) => {
  const filters = state.ui.activeFilters;
  return Object.values(filters).some(value => value !== null);
};

export const selectFilterCount = (state) => {
  const filters = state.ui.activeFilters;
  return Object.values(filters).filter(value => value !== null).length;
};

export const selectNotificationStats = (state) => {
  const notifications = state.ui.notifications;
  const unread = notifications.filter(n => !n.read).length;
  const total = notifications.length;
  
  return { total, unread, read: total - unread };
};

export const selectUIStats = (state) => {
  return {
    notifications: state.ui.notifications.length,
    errors: state.ui.errors.length,
    successMessages: state.ui.successMessages.length,
    selectedItems: state.ui.selectedItems.length,
    activeFilters: Object.values(state.ui.activeFilters).filter(v => v !== null).length,
  };
};

export default uiSlice.reducer;
