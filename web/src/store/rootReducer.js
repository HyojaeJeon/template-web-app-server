/**
 * Root Reducer - Combines all slice reducers
 * State management for the application
 */
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationReducer from './slices/notificationSlice';
import settingsReducer from './slices/settingsSlice';
import chatSettingsReducer from './slices/chatSettingsSlice';
// import chatReducer from './slices/chatSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  notifications: notificationReducer,
  settings: settingsReducer,
  chatSettings: chatSettingsReducer,
  // chat: chatReducer,
});

export default rootReducer;