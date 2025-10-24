import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {toast} from 'react-hot-toast';

// Async thunks for task operations
export const fetchTasks = createAsyncThunk(
    'task/fetchTasks',
    async (filters = {}, {rejectWithValue}) => {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });

            const response = await axios.get(`/tasks?${params.toString()}`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to fetch tasks';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const createTask = createAsyncThunk(
    'task/createTask',
    async (taskData, {rejectWithValue}) => {
        try {
            const response = await axios.post('/tasks', taskData);
            toast.success('Task created successfully');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create task';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const fetchTaskById = createAsyncThunk(
    'task/fetchTaskById',
    async (taskId, {rejectWithValue}) => {
        try {
            const response = await axios.get(`/tasks/${taskId}`);
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to fetch task';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const updateTask = createAsyncThunk(
    'task/updateTask',
    async ({taskId, updateData}, {rejectWithValue}) => {
        try {
            const response = await axios.put(`/tasks/${taskId}`, updateData);
            toast.success('Task updated successfully');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update task';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const deleteTask = createAsyncThunk(
    'task/deleteTask',
    async (taskId, {rejectWithValue}) => {
        try {
            await axios.delete(`/tasks/${taskId}`);
            toast.success('Task deleted successfully');
            return taskId;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete task';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const assignTask = createAsyncThunk(
    'task/assignTask',
    async ({taskId, userIds}, {rejectWithValue}) => {
        try {
            console.log(taskId);
            console.log(userIds);
            const response = await axios.post(`/tasks/${taskId}/assign`, {userIds});
            toast.success('Task assigned successfully');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to assign task';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const addTaskComment = createAsyncThunk(
    'task/addTaskComment',
    async ({taskId, content}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`/tasks/${taskId}/comments`, {content});
            toast.success('Comment added successfully');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add comment';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const updateTaskComment = createAsyncThunk(
    'task/updateTaskComment',
    async ({taskId, commentId, content}, {rejectWithValue}) => {
        try {
            const response = await axios.put(`/tasks/${taskId}/comments/${commentId}`, {content});
            toast.success('Comment updated successfully');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update comment';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

export const deleteTaskComment = createAsyncThunk(
    'task/deleteTaskComment',
    async ({taskId, commentId}, {rejectWithValue}) => {
        try {
            const response = await axios.delete(`/tasks/${taskId}/comments/${commentId}`);
            toast.success('Comment deleted successfully');
            return response.data.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete comment';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// Add to your existing taskSlice
export const addSubtask = createAsyncThunk(
    'task/addSubtask',
    async ({ taskId, title }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/tasks/${taskId}/subtasks`, { title });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateSubtask = createAsyncThunk(
    'task/updateSubtask',
    async ({ taskId, subtaskId, updates }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteSubtask = createAsyncThunk(
    'task/deleteSubtask',
    async ({ taskId, subtaskId }, { rejectWithValue }) => {
        try {
            await axios.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
            return { taskId, subtaskId };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const addDependency = createAsyncThunk(
    'task/addDependency',
    async ({ taskId, dependencyTaskId, type }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/tasks/${taskId}/dependencies`, {
                task: dependencyTaskId,
                type
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const removeDependency = createAsyncThunk(
    'task/removeDependency',
    async ({ taskId, dependencyTaskId }, { rejectWithValue }) => {
        try {
            await axios.delete(`/tasks/${taskId}/dependencies/${dependencyTaskId}`);
            return { taskId, dependencyTaskId };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Initial state
const initialState = {
    tasks: [],
    currentTask: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    lastFetch: null,
    filters: {
        project: null,
        workspace: null,
        status: null,
        priority: null,
        assignedTo: null,
    },
    kanbanColumns: {
        todo: [],
        'in-progress': [],
        review: [],
        completed: [],
    },
};

// Task slice
const taskSlice = createSlice({
    name: 'task',
    initialState,
    reducers: {
        // Synchronous actions
        clearError: (state) => {
            state.error = null;
        },

        setCurrentTask: (state, action) => {
            state.currentTask = action.payload;
        },

        clearCurrentTask: (state) => {
            state.currentTask = null;
        },

        updateTaskInList: (state, action) => {
            const updatedTask = action.payload;

            // Update in tasks list
            const index = state.tasks.findIndex(t => t._id === updatedTask._id);
            if (index !== -1) {
                state.tasks[index] = updatedTask;
            }

            // Find and remove the task from its old column
            Object.keys(state.kanbanColumns).forEach(status => {
                state.kanbanColumns[status] = state.kanbanColumns[status].filter(t => t._id !== updatedTask._id);
            });

            // Add the updated task to the correct column
            if (updatedTask.status && state.kanbanColumns[updatedTask.status]) {
                state.kanbanColumns[updatedTask.status].push(updatedTask);
            }

            // Update current task if it matches
            if (state.currentTask && state.currentTask._id === updatedTask._id) {
                state.currentTask = updatedTask;
            }
        },


        removeTaskFromList: (state, action) => {
            const taskId = action.payload;
            state.tasks = state.tasks.filter(t => t._id !== taskId);
        },

        addTaskToList: (state, action) => {
            state.tasks.unshift(action.payload);
        },

        setFilters: (state, action) => {
            state.filters = {...state.filters, ...action.payload};
        },

        clearFilters: (state) => {
            state.filters = {
                project: null,
                workspace: null,
                status: null,
                priority: null,
                assignedTo: null,
            };
        },

        setKanbanColumns: (state, action) => {
            state.kanbanColumns = action.payload;
        },

        updateKanbanColumns: (state, action) => {
            const {source, destination, task} = action.payload;

            // Remove task from source column
            state.kanbanColumns[source] = state.kanbanColumns[source].filter(t => t._id !== task._id);

            // Add task to destination column
            state.kanbanColumns[destination].push(task);
        },

        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch tasks
            .addCase(fetchTasks.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.tasks = action.payload;
                state.lastFetch = Date.now();
                state.error = null;

                // Update kanban columns
                state.kanbanColumns = {
                    todo: action.payload.filter(task => task.status === 'todo'),
                    'in-progress': action.payload.filter(task => task.status === 'in-progress'),
                    review: action.payload.filter(task => task.status === 'review'),
                    completed: action.payload.filter(task => task.status === 'completed'),
                };
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Create task
            .addCase(createTask.pending, (state) => {
                state.isCreating = true;
                state.error = null;
            })
            .addCase(createTask.fulfilled, (state, action) => {
                state.isCreating = false;
                const newTask = action.payload;
                state.tasks.unshift(newTask);

                // Add to appropriate kanban column
                state.kanbanColumns[newTask.status].push(newTask);

                state.error = null;
            })
            .addCase(createTask.rejected, (state, action) => {
                state.isCreating = false;
                state.error = action.payload;
            })

            // Fetch task by ID
            .addCase(fetchTaskById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTaskById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentTask = action.payload;
                state.error = null;
            })
            .addCase(fetchTaskById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Update task
            .addCase(updateTask.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                state.isUpdating = false;
                const updatedTask = action.payload;

                // Update in tasks list
                const index = state.tasks.findIndex(t => t._id === updatedTask._id);
                if (index !== -1) {
                    state.tasks[index] = updatedTask;
                }

                // Update current task if it's the same
                if (state.currentTask && state.currentTask._id === updatedTask._id) {
                    state.currentTask = updatedTask;
                }

                // Update kanban columns if status changed
                const oldTask = state.tasks.find(t => t._id === updatedTask._id);
                if (oldTask && oldTask.status !== updatedTask.status) {
                    // Remove from old column
                    state.kanbanColumns[oldTask.status] = state.kanbanColumns[oldTask.status].filter(t => t._id !== updatedTask._id);
                    // Add to new column
                    state.kanbanColumns[updatedTask.status].push(updatedTask);
                } else {
                    // Update in same column
                    const columnIndex = state.kanbanColumns[updatedTask.status].findIndex(t => t._id === updatedTask._id);
                    if (columnIndex !== -1) {
                        state.kanbanColumns[updatedTask.status][columnIndex] = updatedTask;
                    }
                }

                state.error = null;
            })
            .addCase(updateTask.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload;
            })

            // Delete task
            .addCase(deleteTask.pending, (state) => {
                state.isDeleting = true;
                state.error = null;
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.isDeleting = false;
                const deletedTaskId = action.payload;

                // Remove from tasks list
                state.tasks = state.tasks.filter(t => t._id !== deletedTaskId);

                // Remove from kanban columns
                Object.keys(state.kanbanColumns).forEach(status => {
                    state.kanbanColumns[status] = state.kanbanColumns[status].filter(t => t._id !== deletedTaskId);
                });

                // Clear current task if it was deleted
                if (state.currentTask && state.currentTask._id === deletedTaskId) {
                    state.currentTask = null;
                }

                state.error = null;
            })
            .addCase(deleteTask.rejected, (state, action) => {
                state.isDeleting = false;
                state.error = action.payload;
            })

            // Assign task
            .addCase(assignTask.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(assignTask.fulfilled, (state, action) => {
                state.isUpdating = false;
                const updatedTask = action.payload;

                // Update in tasks list
                const index = state.tasks.findIndex(t => t._id === updatedTask._id);
                if (index !== -1) {
                    state.tasks[index] = updatedTask;
                }

                // Update current task if it's the same
                if (state.currentTask && state.currentTask._id === updatedTask._id) {
                    state.currentTask = updatedTask;
                }

                // Update in kanban columns
                const columnIndex = state.kanbanColumns[updatedTask.status].findIndex(t => t._id === updatedTask._id);
                if (columnIndex !== -1) {
                    state.kanbanColumns[updatedTask.status][columnIndex] = updatedTask;
                }

                state.error = null;
            })
            .addCase(assignTask.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload;
            })

            // Add task comment
            .addCase(addTaskComment.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(addTaskComment.fulfilled, (state, action) => {
                state.isUpdating = false;
                const updatedTask = action.payload;

                // Update in tasks list
                const index = state.tasks.findIndex(t => t._id === updatedTask._id);
                if (index !== -1) {
                    state.tasks[index] = updatedTask;
                }

                // Update current task if it's the same
                if (state.currentTask && state.currentTask._id === updatedTask._id) {
                    state.currentTask = updatedTask;
                }

                // Update in kanban columns
                const columnIndex = state.kanbanColumns[updatedTask.status].findIndex(t => t._id === updatedTask._id);
                if (columnIndex !== -1) {
                    state.kanbanColumns[updatedTask.status][columnIndex] = updatedTask;
                }

                state.error = null;
            })
            .addCase(addTaskComment.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload;
            })

            // Update task comment
            .addCase(updateTaskComment.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(updateTaskComment.fulfilled, (state, action) => {
                state.isUpdating = false;
                const updatedTask = action.payload;

                // Update in tasks list
                const index = state.tasks.findIndex(t => t._id === updatedTask._id);
                if (index !== -1) {
                    state.tasks[index] = updatedTask;
                }

                // Update current task if it's the same
                if (state.currentTask && state.currentTask._id === updatedTask._id) {
                    state.currentTask = updatedTask;
                }

                // Update in kanban columns
                const columnIndex = state.kanbanColumns[updatedTask.status].findIndex(t => t._id === updatedTask._id);
                if (columnIndex !== -1) {
                    state.kanbanColumns[updatedTask.status][columnIndex] = updatedTask;
                }

                state.error = null;
            })
            .addCase(updateTaskComment.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload;
            })

            // Delete task comment
            .addCase(deleteTaskComment.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(deleteTaskComment.fulfilled, (state, action) => {
                state.isUpdating = false;
                const updatedTask = action.payload;

                // Update in tasks list
                const index = state.tasks.findIndex(t => t._id === updatedTask._id);
                if (index !== -1) {
                    state.tasks[index] = updatedTask;
                }

                // Update current task if it's the same
                if (state.currentTask && state.currentTask._id === updatedTask._id) {
                    state.currentTask = updatedTask;
                }

                // Update in kanban columns
                const columnIndex = state.kanbanColumns[updatedTask.status].findIndex(t => t._id === updatedTask._id);
                if (columnIndex !== -1) {
                    state.kanbanColumns[updatedTask.status][columnIndex] = updatedTask;
                }

                state.error = null;
            })
            .addCase(deleteTaskComment.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload;
            });
    },
});

// Action creators
export const {
    clearError,
    setCurrentTask,
    clearCurrentTask,
    updateTaskInList,
    removeTaskFromList,
    addTaskToList,
    setFilters,
    clearFilters,
    setKanbanColumns,
    updateKanbanColumns,
    setLoading,
} = taskSlice.actions;

// Selectors
export const selectTasks = (state) => state.task.tasks;
export const selectCurrentTask = (state) => state.task.currentTask;
export const selectTaskLoading = (state) => state.task.isLoading;
export const selectTaskCreating = (state) => state.task.isCreating;
export const selectTaskUpdating = (state) => state.task.isUpdating;
export const selectTaskDeleting = (state) => state.task.isDeleting;
export const selectTaskError = (state) => state.task.error;
export const selectTaskFilters = (state) => state.task.filters;
export const selectKanbanColumns = (state) => state.task.kanbanColumns;
export const selectLastTaskFetch = (state) => state.task.lastFetch;

// Complex selectors
export const selectTaskById = (taskId) => (state) =>
    state.task.tasks.find(t => t._id === taskId);

export const selectTasksByProject = (projectId) => (state) =>
    state.task.tasks.filter(t => t.project._id === projectId);

export const selectTasksByWorkspace = (workspaceId) => (state) =>
    state.task.tasks.filter(t => t.workspace._id === workspaceId);

export const selectUserTasks = (state) => {
    const {auth} = state;
    if (!auth.user) return [];

    return state.task.tasks.filter(task =>
        task.createdBy._id === auth.user._id ||
        task.assignedTo.some(assignment => assignment.user._id === auth.user._id)
    );
};

export const selectAssignedTasks = (state) => {
    const {auth} = state;
    if (!auth.user) return [];

    return state.task.tasks.filter(task =>
        task.assignedTo.some(assignment => assignment.user._id === auth.user._id)
    );
};

export const selectCreatedTasks = (state) => {
    const {auth} = state;
    if (!auth.user) return [];

    return state.task.tasks.filter(task =>
        task.createdBy._id === auth.user._id
    );
};

export const selectTaskStats = (state) => {
    const tasks = state.task.tasks;
    const {auth} = state;

    if (!auth.user) return {total: 0, assigned: 0, created: 0, completed: 0};

    const assigned = tasks.filter(t =>
        t.assignedTo.some(assignment => assignment.user._id === auth.user._id)
    ).length;
    const created = tasks.filter(t => t.createdBy._id === auth.user._id).length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    return {
        total: tasks.length,
        assigned,
        created,
        completed,
    };
};

export const selectFilteredTasks = (state) => {
    const {tasks, filters} = state.task;

    return tasks.filter(task => {
        if (filters.project && task.project._id !== filters.project) {
            return false;
        }
        if (filters.workspace && task.workspace._id !== filters.workspace) {
            return false;
        }
        if (filters.status && task.status !== filters.status) {
            return false;
        }
        if (filters.priority && task.priority !== filters.priority) {
            return false;
        }
        if (filters.assignedTo && !task.assignedTo.some(assignment => assignment.user._id === filters.assignedTo)) {
            return false;
        }
        return true;
    });
};

export const selectTasksByStatus = (status) => (state) =>
    state.task.tasks.filter(task => task.status === status);

export const selectOverdueTasks = (state) => {
    const now = new Date();
    return state.task.tasks.filter(task =>
        task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
    );
};

export const selectUpcomingTasks = (state) => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return state.task.tasks.filter(task =>
        task.dueDate &&
        new Date(task.dueDate) > now &&
        new Date(task.dueDate) <= nextWeek &&
        task.status !== 'completed'
    );
};

export default taskSlice.reducer;
