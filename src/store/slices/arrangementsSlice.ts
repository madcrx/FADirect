import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Arrangement, ArrangementsState } from '@types/index';

const initialState: ArrangementsState = {
  arrangements: [],
  currentArrangement: null,
  isLoading: false,
  error: null,
};

const arrangementsSlice = createSlice({
  name: 'arrangements',
  initialState,
  reducers: {
    setArrangements: (state, action: PayloadAction<Arrangement[]>) => {
      state.arrangements = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setCurrentArrangement: (state, action: PayloadAction<Arrangement | null>) => {
      state.currentArrangement = action.payload;
    },
    addArrangement: (state, action: PayloadAction<Arrangement>) => {
      state.arrangements.unshift(action.payload);
    },
    updateArrangement: (state, action: PayloadAction<Arrangement>) => {
      const index = state.arrangements.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.arrangements[index] = action.payload;
      }
      if (state.currentArrangement?.id === action.payload.id) {
        state.currentArrangement = action.payload;
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
  setArrangements,
  setCurrentArrangement,
  addArrangement,
  updateArrangement,
  setLoading,
  setError,
} = arrangementsSlice.actions;
export default arrangementsSlice.reducer;
