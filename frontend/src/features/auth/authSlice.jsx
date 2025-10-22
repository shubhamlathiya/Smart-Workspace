import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// API base URL
const API_URL =  'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// --- HYDRATION AND INITIALIZATION LOGIC ---

// 1. Read tokens from localStorage
const storedToken = localStorage.getItem('token');
const storedRefreshToken = localStorage.getItem('refreshToken');

// 2. Set the Axios header if a token is found in localStorage
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

// Initial state
const initialState = {
  user: null,
  token: storedToken, // Token is initialized from localStorage
  refreshToken: storedRefreshToken, // Refresh token is initialized from localStorage
  isAuthenticated: !!storedToken, // Set isAuthenticated to true if a token exists
  isLoading: false,
  error: null,
  lastLogin: null,
};

// --- ASYNC THUNKS (No changes needed, the implementation is solid) ---

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
      try {
        const response = await axios.post('/auth/register', userData);

        // Store tokens in localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        console.log(response.data.data)
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;

        toast.success('Registration successful!');
        return response.data.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed';
        toast.error(message);
        return rejectWithValue(message);
      }
    }
);

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
      try {
        console.log(`${axios.defaults.baseURL}/auth/login`); // Corrected console log
        const response = await axios.post('/auth/login', credentials);

        // Store tokens in localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);

        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        console.log(response.data.data);
        toast.success('Login successful!');
        return response.data.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Login failed';
        toast.error(message);
        return rejectWithValue(message);
      }
    }
);

export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { getState, rejectWithValue }) => {
      try {
        const { auth } = getState();
        // Ensure we check local storage if Redux state is not yet fully populated (e.g., initial fetch)
        const refreshTokenValue = auth.refreshToken || localStorage.getItem('refreshToken');

        if (!refreshTokenValue) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('/auth/refresh', {
          refreshToken: refreshTokenValue,
        });

        // Update tokens in localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);

        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;

        return response.data.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Token refresh failed';

        // If refresh fails, clear auth state
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete axios.defaults.headers.common['Authorization'];

        toast.error('Session expired. Please login again.');
        return rejectWithValue(message);
      }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { getState, rejectWithValue }) => {
      try {
        const { auth } = getState();

        if (auth.refreshToken) {
          await axios.post('/auth/logout', {
            refreshToken: auth.refreshToken,
          });
        }

        // Clear tokens from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        // Remove authorization header
        delete axios.defaults.headers.common['Authorization'];

        toast.success('Logged out successfully');
        return null;
      } catch (error) {
        const message = error.response?.data?.message || 'Logout failed';
        toast.error(message);
        return rejectWithValue(message);
      }
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
      try {
        const response = await axios.get('/auth/me');
        return response.data.data.user;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to get user data';
        // If token is invalid/expired, rejectWithValue will be handled by the component/interceptor
        return rejectWithValue(message);
      }
    }
);

export const updateUserProfile = createAsyncThunk(
    'auth/updateUserProfile',
    async (userData, { rejectWithValue }) => {
      try {
        const response = await axios.put(`/users/${userData.id}`, userData);
        toast.success('Profile updated successfully');
        return response.data.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Profile update failed';
        toast.error(message);
        return rejectWithValue(message);
      }
    }
);

// --- AUTH SLICE (Minimal changes, mostly for getCurrentUser/hydration synchronization) ---

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },

    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
    },

    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
        // Register user
        .addCase(registerUser.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(registerUser.fulfilled, (state, action) => {
          state.isLoading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
          state.error = null;
        })
        .addCase(registerUser.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
          state.isAuthenticated = false;
        })

        // Login user
        .addCase(loginUser.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
          state.isLoading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
          state.lastLogin = action.payload.user.lastLogin;
          state.error = null;
        })
        .addCase(loginUser.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
          state.isAuthenticated = false;
        })

        // Refresh token
        .addCase(refreshToken.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(refreshToken.fulfilled, (state, action) => {
          state.isLoading = false;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.error = null;
          state.isAuthenticated = true; // Ensure state is true after successful refresh
        })
        .addCase(refreshToken.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
          // Full clear happens in thunk and is reflected here
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
        })

        // Logout user
        .addCase(logoutUser.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(logoutUser.fulfilled, (state) => {
          state.isLoading = false;
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.error = null;
        })
        .addCase(logoutUser.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
          // Still clear the state even if logout request fails
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
        })

        // Get current user (Used on app load to validate token and restore user data)
        .addCase(getCurrentUser.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(getCurrentUser.fulfilled, (state, action) => {
          state.isLoading = false;
          state.user = action.payload;
          state.isAuthenticated = true;
          state.error = null;
        })
        .addCase(getCurrentUser.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
          // CRITICAL: If getCurrentUser fails, it means the token is bad. Force clear all state.
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;

          // Also ensure local storage and headers are clear
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete axios.defaults.headers.common['Authorization'];
        })

        // Update user profile
        .addCase(updateUserProfile.pending, (state) => {
          state.isLoading = true;
        })
        .addCase(updateUserProfile.fulfilled, (state, action) => {
          state.isLoading = false;
          state.user = action.payload;
          state.error = null;
        })
        .addCase(updateUserProfile.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        });
  },
});

// Action creators
export const {
  clearError,
  setCredentials,
  clearCredentials,
  updateUser,
  setLoading,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectLastLogin = (state) => state.auth.lastLogin;

// Complex selectors
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsMember = (state) => state.auth.user?.role === 'member';
export const selectIsGuest = (state) => state.auth.user?.role === 'guest';

export const selectUserPermissions = (state) => {
  const role = state.auth.user?.role;
  return {
    canCreateWorkspace: ['admin', 'member'].includes(role),
    canDeleteWorkspace: role === 'admin',
    canInviteMembers: ['admin', 'member'].includes(role),
    canManageProjects: ['admin', 'member'].includes(role),
    canAssignTasks: ['admin', 'member'].includes(role),
    canViewAllTasks: role === 'admin',
    canDeleteTasks: ['admin', 'member'].includes(role),
  };
};

export default authSlice.reducer;