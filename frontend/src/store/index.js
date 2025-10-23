import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {combineReducers} from '@reduxjs/toolkit';
import authSlice from "../features/auth/authSlice.jsx";
import workspaceSlice from "../features/workspace/workspaceSlice.jsx";
import projectSlice from "../features/project/projectSlice.jsx";
import taskSlice from "../features/task/taskSlice.jsx";
import uiSlice from "../features/ui/uiSlice.jsx";
import uploadSlice from "../features/upload/uploadSlice.jsx";


// Persist configuration
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'], // Only persist auth state
};

const rootReducer = combineReducers({
    auth: authSlice,
    workspace: workspaceSlice,
    project: projectSlice,
    task: taskSlice,
    ui: uiSlice,
    upload: uploadSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Custom middleware for logging and error handling
const loggerMiddleware = (store) => (next) => (action) => {
    const startTime = performance.now();
    const result = next(action);
    const endTime = performance.now();

    if (process.env.NODE_ENV === 'development') {
        console.log(`Action ${action.type} dispatched in ${(endTime - startTime).toFixed(2)}ms`);
        console.log('New state:', store.getState());
    }

    return result;
};

// Error handling middleware
const errorMiddleware = (store) => (next) => (action) => {
    try {
        return next(action);
    } catch (error) {
        console.error('Redux Error:', error);

        // Dispatch error action to UI slice
        store.dispatch({
            type: 'ui/setError',
            payload: {
                message: error.message || 'An unexpected error occurred',
                timestamp: Date.now(),
            },
        });

        return action;
    }
};

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }).concat(loggerMiddleware, errorMiddleware),
    devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
