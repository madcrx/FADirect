import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import arrangementsReducer from './slices/arrangementsSlice';
import messagesReducer from './slices/messagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    arrangements: arrangementsReducer,
    messages: messagesReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser', 'arrangements/setArrangements'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.createdAt', 'arrangements.arrangements'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
