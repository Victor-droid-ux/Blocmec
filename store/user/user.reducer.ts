import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { User } from "@/types/store/user";

export interface UserState {
  current: User | null;
  loading: boolean;
}

const initialState: UserState = {
  current: null,
  loading: true, // start as true so guards wait for first auth check
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.current = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.current = null;
      state.loading = false;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, logout, setAuthLoading } = userSlice.actions;

export const getUser = (state: RootState) => state.user;

export default userSlice.reducer;
