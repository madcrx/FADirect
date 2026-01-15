import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, MessagesState } from '@types/index';

const initialState: MessagesState = {
  messages: {},
  isLoading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages: (
      state,
      action: PayloadAction<{ arrangementId: string; messages: Message[] }>,
    ) => {
      state.messages[action.payload.arrangementId] = action.payload.messages;
      state.isLoading = false;
      state.error = null;
    },
    addMessage: (state, action: PayloadAction<{ arrangementId: string; message: Message }>) => {
      const { arrangementId, message } = action.payload;
      if (!state.messages[arrangementId]) {
        state.messages[arrangementId] = [];
      }
      state.messages[arrangementId].push(message);
    },
    updateMessage: (state, action: PayloadAction<{ arrangementId: string; message: Message }>) => {
      const { arrangementId, message } = action.payload;
      const messages = state.messages[arrangementId];
      if (messages) {
        const index = messages.findIndex(m => m.id === message.id);
        if (index !== -1) {
          messages[index] = message;
        }
      }
    },
    markAsDelivered: (
      state,
      action: PayloadAction<{ arrangementId: string; messageId: string }>,
    ) => {
      const { arrangementId, messageId } = action.payload;
      const messages = state.messages[arrangementId];
      if (messages) {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          message.deliveredAt = new Date();
        }
      }
    },
    markAsRead: (state, action: PayloadAction<{ arrangementId: string; messageId: string }>) => {
      const { arrangementId, messageId } = action.payload;
      const messages = state.messages[arrangementId];
      if (messages) {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          message.readAt = new Date();
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setMessages,
  addMessage,
  updateMessage,
  markAsDelivered,
  markAsRead,
  setLoading,
  setError,
} = messagesSlice.actions;
export default messagesSlice.reducer;
