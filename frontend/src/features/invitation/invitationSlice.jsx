// features/invitation/invitationSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {toast} from "react-hot-toast";

export const verifyInvitation = createAsyncThunk(
    'invitation/verifyInvitation',
    async (token, { rejectWithValue }) => {
        try {
            console.log('verifyInvitation', token);
            const response = await axios.get(`/invitations/verify?token=${token}`);
            console.log(response.data);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to verify invitation';
            return rejectWithValue(message);
        }
    }
);

export const acceptInvitation = createAsyncThunk(
    'invitation/acceptInvitation',
    async (token, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/invitations/accept', { token });
            toast.success('Invitation accepted successfully!');
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to accept invitation';
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

const invitationSlice = createSlice({
    name: 'invitation',
    initialState: {
        isLoading: false,
        error: null,
        currentInvitation: null,
        verificationLoading: false
    },
    reducers: {
        clearInvitation: (state) => {
            state.currentInvitation = null;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Verify Invitation
            .addCase(verifyInvitation.pending, (state) => {
                state.verificationLoading = true;
                state.error = null;
            })
            .addCase(verifyInvitation.fulfilled, (state, action) => {
                state.verificationLoading = false;
                state.currentInvitation = action.payload.data;
                state.error = null;
            })
            .addCase(verifyInvitation.rejected, (state, action) => {
                state.verificationLoading = false;
                state.error = action.payload;
                state.currentInvitation = null;
            })
            // Accept Invitation
            .addCase(acceptInvitation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(acceptInvitation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentInvitation = action.payload.data;
                state.error = null;
            })
            .addCase(acceptInvitation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const { clearInvitation, clearError } = invitationSlice.actions;
export default invitationSlice.reducer;