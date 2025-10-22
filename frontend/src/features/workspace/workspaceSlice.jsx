import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Async thunks for workspace operations
export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/workspaces');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch workspaces';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (workspaceData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/workspaces', workspaceData);
      toast.success('Workspace created successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create workspace';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchWorkspaceById = createAsyncThunk(
  'workspace/fetchWorkspaceById',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/workspaces/${workspaceId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch workspace';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateWorkspace = createAsyncThunk(
  'workspace/updateWorkspace',
  async ({ workspaceId, updateData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/workspaces/${workspaceId}`, updateData);
      toast.success('Workspace updated successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update workspace';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteWorkspace = createAsyncThunk(
  'workspace/deleteWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      await axios.delete(`/workspaces/${workspaceId}`);
      toast.success('Workspace deleted successfully');
      return workspaceId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete workspace';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const inviteMember = createAsyncThunk(
  'workspace/inviteMember',
  async ({ workspaceId, memberData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/workspaces/${workspaceId}/members`, memberData);
      toast.success('Member invited successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to invite member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeMember = createAsyncThunk(
  'workspace/removeMember',
  async ({ workspaceId, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/workspaces/${workspaceId}/members/${userId}`);
      toast.success('Member removed successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastFetch: null,
};

// Workspace slice
const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },
    
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
    },
    
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
    },
    
    updateWorkspaceInList: (state, action) => {
      const updatedWorkspace = action.payload;
      const index = state.workspaces.findIndex(ws => ws._id === updatedWorkspace._id);
      if (index !== -1) {
        state.workspaces[index] = updatedWorkspace;
      }
    },
    
    removeWorkspaceFromList: (state, action) => {
      const workspaceId = action.payload;
      state.workspaces = state.workspaces.filter(ws => ws._id !== workspaceId);
    },
    
    addWorkspaceToList: (state, action) => {
      state.workspaces.unshift(action.payload);
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch workspaces
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces = action.payload;
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create workspace
      .addCase(createWorkspace.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.isCreating = false;
        state.workspaces.unshift(action.payload);
        state.error = null;
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      
      // Fetch workspace by ID
      .addCase(fetchWorkspaceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWorkspace = action.payload;
        state.error = null;
      })
      .addCase(fetchWorkspaceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update workspace
      .addCase(updateWorkspace.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedWorkspace = action.payload;
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(ws => ws._id === updatedWorkspace._id);
        if (index !== -1) {
          state.workspaces[index] = updatedWorkspace;
        }
        
        // Update current workspace if it's the same
        if (state.currentWorkspace && state.currentWorkspace._id === updatedWorkspace._id) {
          state.currentWorkspace = updatedWorkspace;
        }
        
        state.error = null;
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      
      // Delete workspace
      .addCase(deleteWorkspace.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedWorkspaceId = action.payload;
        
        // Remove from workspaces list
        state.workspaces = state.workspaces.filter(ws => ws._id !== deletedWorkspaceId);
        
        // Clear current workspace if it was deleted
        if (state.currentWorkspace && state.currentWorkspace._id === deletedWorkspaceId) {
          state.currentWorkspace = null;
        }
        
        state.error = null;
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })
      
      // Invite member
      .addCase(inviteMember.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(inviteMember.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedWorkspace = action.payload;
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(ws => ws._id === updatedWorkspace._id);
        if (index !== -1) {
          state.workspaces[index] = updatedWorkspace;
        }
        
        // Update current workspace if it's the same
        if (state.currentWorkspace && state.currentWorkspace._id === updatedWorkspace._id) {
          state.currentWorkspace = updatedWorkspace;
        }
        
        state.error = null;
      })
      .addCase(inviteMember.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      
      // Remove member
      .addCase(removeMember.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedWorkspace = action.payload;
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(ws => ws._id === updatedWorkspace._id);
        if (index !== -1) {
          state.workspaces[index] = updatedWorkspace;
        }
        
        // Update current workspace if it's the same
        if (state.currentWorkspace && state.currentWorkspace._id === updatedWorkspace._id) {
          state.currentWorkspace = updatedWorkspace;
        }
        
        state.error = null;
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      });
  },
});

// Action creators
export const {
  clearError,
  setCurrentWorkspace,
  clearCurrentWorkspace,
  updateWorkspaceInList,
  removeWorkspaceFromList,
  addWorkspaceToList,
  setLoading,
} = workspaceSlice.actions;

// Selectors
export const selectWorkspaces = (state) => state.workspace.workspaces;
export const selectCurrentWorkspace = (state) => state.workspace.currentWorkspace;
export const selectWorkspaceLoading = (state) => state.workspace.isLoading;
export const selectWorkspaceCreating = (state) => state.workspace.isCreating;
export const selectWorkspaceUpdating = (state) => state.workspace.isUpdating;
export const selectWorkspaceDeleting = (state) => state.workspace.isDeleting;
export const selectWorkspaceError = (state) => state.workspace.error;
export const selectLastWorkspaceFetch = (state) => state.workspace.lastFetch;

// Complex selectors
export const selectWorkspaceById = (workspaceId) => (state) => 
  state.workspace.workspaces.find(ws => ws._id === workspaceId);

export const selectUserWorkspaces = (state) => {
  const { auth } = state;
  if (!auth.user) return [];
  
  return state.workspace.workspaces.filter(workspace => 
    workspace.owner._id === auth.user._id || 
    workspace.members.some(member => member.user._id === auth.user._id)
  );
};

export const selectOwnedWorkspaces = (state) => {
  const { auth } = state;
  if (!auth.user) return [];
  
  return state.workspace.workspaces.filter(workspace => 
    workspace.owner._id === auth.user._id
  );
};

export const selectMemberWorkspaces = (state) => {
  const { auth } = state;
  if (!auth.user) return [];
  
  return state.workspace.workspaces.filter(workspace => 
    workspace.owner._id !== auth.user._id && 
    workspace.members.some(member => member.user._id === auth.user._id)
  );
};

export const selectWorkspaceMembers = (workspaceId) => (state) => {
  const workspace = state.workspace.workspaces.find(ws => ws._id === workspaceId);
  return workspace ? workspace.members : [];
};

export const selectUserRoleInWorkspace = (workspaceId) => (state) => {
  const { auth } = state;
  if (!auth.user) return null;
  
  const workspace = state.workspace.workspaces.find(ws => ws._id === workspaceId);
  if (!workspace) return null;
  
  if (workspace.owner._id === auth.user._id) return 'owner';
  
  const member = workspace.members.find(member => member.user._id === auth.user._id);
  return member ? member.role : null;
};

export const selectWorkspaceStats = (state) => {
  const workspaces = state.workspace.workspaces;
  const { auth } = state;
  
  if (!auth.user) return { total: 0, owned: 0, member: 0 };
  
  const owned = workspaces.filter(ws => ws.owner._id === auth.user._id).length;
  const member = workspaces.filter(ws => 
    ws.owner._id !== auth.user._id && 
    ws.members.some(member => member.user._id === auth.user._id)
  ).length;
  
  return {
    total: workspaces.length,
    owned,
    member,
  };
};

export default workspaceSlice.reducer;
