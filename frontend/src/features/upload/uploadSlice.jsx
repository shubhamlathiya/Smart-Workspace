// features/upload/uploadSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// ----------------- Async Thunks -----------------

// Upload a file to a task
export const uploadTaskFile = createAsyncThunk(
    'upload/uploadTaskFile',
    async ({ taskId, file }, { rejectWithValue, dispatch }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`/uploads/task/${taskId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    dispatch(setUploadProgress({ taskId, filename: file.name, progress }));
                },
            });

            toast.success('File uploaded successfully');
            dispatch(clearUploadProgress({ taskId, filename: file.name }));

            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to upload file';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// Delete a file from a task
export const deleteTaskFile = createAsyncThunk(
    'upload/deleteTaskFile',
    async ({ taskId, filename }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`/uploads/task/${taskId}/${filename}`);
            toast.success('File deleted successfully');
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete file';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// Download a file
export const downloadFile = createAsyncThunk(
    'upload/downloadFile',
    async (filename, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/uploads/download/${filename}`, {
                responseType: 'blob',
            });

            // Trigger browser download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('File download started');
            return filename;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to download file';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// ----------------- Slice -----------------
const uploadSlice = createSlice({
    name: 'upload',
    initialState: {
        isLoading: false,
        error: null,
        uploadingFiles: {}, // { taskId: { filename: progress } }
        downloadingFiles: {}, // { filename: isDownloading }
    },
    reducers: {
        clearUploadError: (state) => {
            state.error = null;
        },
        setUploadProgress: (state, action) => {
            const { taskId, filename, progress } = action.payload;
            if (!state.uploadingFiles[taskId]) state.uploadingFiles[taskId] = {};
            state.uploadingFiles[taskId][filename] = progress;
        },
        clearUploadProgress: (state, action) => {
            const { taskId, filename } = action.payload;
            if (state.uploadingFiles[taskId]) delete state.uploadingFiles[taskId][filename];
        },
        setDownloadingFile: (state, action) => {
            const { filename, isDownloading } = action.payload;
            state.downloadingFiles[filename] = isDownloading;
        },
    },
    extraReducers: (builder) => {
        builder
            // Upload
            .addCase(uploadTaskFile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(uploadTaskFile.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(uploadTaskFile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Delete
            .addCase(deleteTaskFile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteTaskFile.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(deleteTaskFile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Download
            .addCase(downloadFile.pending, (state, action) => {
                state.isLoading = true;
                state.error = null;
                state.downloadingFiles[action.meta.arg] = true;
            })
            .addCase(downloadFile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.downloadingFiles[action.payload] = false;
            })
            .addCase(downloadFile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.downloadingFiles[action.meta.arg] = false;
            });
    },
});

export const {
    clearUploadError,
    setUploadProgress,
    clearUploadProgress,
    setDownloadingFile,
} = uploadSlice.actions;

export default uploadSlice.reducer;
