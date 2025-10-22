import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Async thunks for project operations
export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(`/projects?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch projects';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const createProject = createAsyncThunk(
  'project/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/projects', projectData);
      toast.success('Project created successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'project/fetchProjectById',
  async (projectId, { rejectWithValue }) => {
    try {
      console.log(projectId);
      const response = await axios.get(`/projects/${projectId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch project';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ projectId, updateData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/projects/${projectId}`, updateData);
      toast.success('Project updated successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update project';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      await axios.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully');
      return projectId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete project';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const addProjectMember = createAsyncThunk(
  'project/addProjectMember',
  async ({ projectId, memberData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/projects/${projectId}/members`, memberData);
      toast.success('Member added successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeProjectMember = createAsyncThunk(
  'project/removeProjectMember',
  async ({ projectId, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/projects/${projectId}/members/${userId}`);
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
  projects: [],
  currentProject: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastFetch: null,
  filters: {
    workspace: null,
    status: null,
    priority: null,
  },
};

// Project slice
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },
    
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    
    updateProjectInList: (state, action) => {
      const updatedProject = action.payload;
      const index = state.projects.findIndex(p => p._id === updatedProject._id);
      if (index !== -1) {
        state.projects[index] = updatedProject;
      }
    },
    
    removeProjectFromList: (state, action) => {
      const projectId = action.payload;
      state.projects = state.projects.filter(p => p._id !== projectId);
    },
    
    addProjectToList: (state, action) => {
      state.projects.unshift(action.payload);
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = {
        workspace: null,
        status: null,
        priority: null,
      };
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create project
      .addCase(createProject.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isCreating = false;
        state.projects.unshift(action.payload);
        state.error = null;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      
      // Fetch project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
        state.error = null;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedProject = action.payload;
        
        // Update in projects list
        const index = state.projects.findIndex(p => p._id === updatedProject._id);
        if (index !== -1) {
          state.projects[index] = updatedProject;
        }
        
        // Update current project if it's the same
        if (state.currentProject && state.currentProject._id === updatedProject._id) {
          state.currentProject = updatedProject;
        }
        
        state.error = null;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedProjectId = action.payload;
        
        // Remove from projects list
        state.projects = state.projects.filter(p => p._id !== deletedProjectId);
        
        // Clear current project if it was deleted
        if (state.currentProject && state.currentProject._id === deletedProjectId) {
          state.currentProject = null;
        }
        
        state.error = null;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })
      
      // Add project member
      .addCase(addProjectMember.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(addProjectMember.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedProject = action.payload;
        
        // Update in projects list
        const index = state.projects.findIndex(p => p._id === updatedProject._id);
        if (index !== -1) {
          state.projects[index] = updatedProject;
        }
        
        // Update current project if it's the same
        if (state.currentProject && state.currentProject._id === updatedProject._id) {
          state.currentProject = updatedProject;
        }
        
        state.error = null;
      })
      .addCase(addProjectMember.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      
      // Remove project member
      .addCase(removeProjectMember.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedProject = action.payload;
        
        // Update in projects list
        const index = state.projects.findIndex(p => p._id === updatedProject._id);
        if (index !== -1) {
          state.projects[index] = updatedProject;
        }
        
        // Update current project if it's the same
        if (state.currentProject && state.currentProject._id === updatedProject._id) {
          state.currentProject = updatedProject;
        }
        
        state.error = null;
      })
      .addCase(removeProjectMember.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      });
  },
});

// Action creators
export const {
  clearError,
  setCurrentProject,
  clearCurrentProject,
  updateProjectInList,
  removeProjectFromList,
  addProjectToList,
  setFilters,
  clearFilters,
  setLoading,
} = projectSlice.actions;

// Selectors
export const selectProjects = (state) => state.project.projects;
export const selectCurrentProject = (state) => state.project.currentProject;
export const selectProjectLoading = (state) => state.project.isLoading;
export const selectProjectCreating = (state) => state.project.isCreating;
export const selectProjectUpdating = (state) => state.project.isUpdating;
export const selectProjectDeleting = (state) => state.project.isDeleting;
export const selectProjectError = (state) => state.project.error;
export const selectProjectFilters = (state) => state.project.filters;
export const selectLastProjectFetch = (state) => state.project.lastFetch;

// Complex selectors
export const selectProjectById = (projectId) => (state) => 
  state.project.projects.find(p => p._id === projectId);

export const selectProjectsByWorkspace = (workspaceId) => (state) => 
  state.project.projects.filter(p => p.workspace._id === workspaceId);

export const selectUserProjects = (state) => {
  const { auth } = state;
  if (!auth.user) return [];
  
  return state.project.projects.filter(project => 
    project.createdBy._id === auth.user._id || 
    project.assignedMembers.some(member => member.user._id === auth.user._id)
  );
};

export const selectOwnedProjects = (state) => {
  const { auth } = state;
  if (!auth.user) return [];
  
  return state.project.projects.filter(project => 
    project.createdBy._id === auth.user._id
  );
};

export const selectAssignedProjects = (state) => {
  const { auth } = state;
  if (!auth.user) return [];
  
  return state.project.projects.filter(project => 
    project.createdBy._id !== auth.user._id && 
    project.assignedMembers.some(member => member.user._id === auth.user._id)
  );
};

export const selectProjectMembers = (projectId) => (state) => {
  const project = state.project.projects.find(p => p._id === projectId);
  return project ? project.assignedMembers : [];
};

export const selectUserRoleInProject = (projectId) => (state) => {
  const { auth } = state;
  if (!auth.user) return null;
  
  const project = state.project.projects.find(p => p._id === projectId);
  if (!project) return null;
  
  if (project.createdBy._id === auth.user._id) return 'creator';
  
  const member = project.assignedMembers.find(member => member.user._id === auth.user._id);
  return member ? member.role : null;
};

export const selectProjectTasks = (projectId) => (state) => {
  const project = state.project.projects.find(p => p._id === projectId);
  return project ? project.tasks || [] : [];
};

export const selectProjectStats = (state) => {
  const projects = state.project.projects;
  const { auth } = state;
  
  if (!auth.user) return { total: 0, owned: 0, assigned: 0, completed: 0 };
  
  const owned = projects.filter(p => p.createdBy._id === auth.user._id).length;
  const assigned = projects.filter(p => 
    p.createdBy._id !== auth.user._id && 
    p.assignedMembers.some(member => member.user._id === auth.user._id)
  ).length;
  const completed = projects.filter(p => p.status === 'completed').length;
  
  return {
    total: projects.length,
    owned,
    assigned,
    completed,
  };
};

export const selectFilteredProjects = (state) => {
  const { projects, filters } = state.project;
  
  return projects.filter(project => {
    if (filters.workspace && project.workspace._id !== filters.workspace) {
      return false;
    }
    if (filters.status && project.status !== filters.status) {
      return false;
    }
    if (filters.priority && project.priority !== filters.priority) {
      return false;
    }
    return true;
  });
};

export default projectSlice.reducer;
