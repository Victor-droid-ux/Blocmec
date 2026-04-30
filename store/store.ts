import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import autoMergeLevel2 from "redux-persist/es/stateReconciler/autoMergeLevel2";
import createWebStorage from "redux-persist/es/storage/createWebStorage";

import userReducer from "./user/user.reducer";

const createNoopStorage = () => ({
  getItem() {
    return Promise.resolve(null);
  },
  setItem() {
    return Promise.resolve();
  },
  removeItem() {
    return Promise.resolve();
  },
});

const isClient = typeof window !== "undefined";

const customStorage = isClient ? createWebStorage("local") : createNoopStorage();

const rootReducer = combineReducers({
  user: userReducer,
});

const persistConfig = {
  key: "root",
  storage: customStorage,
  whitelist: ["user"],
  stateReconciler: autoMergeLevel2,
};

const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(
  persistConfig,
  rootReducer,
);

export const makeStore = () => {
  return configureStore({
    devTools: process.env.NODE_ENV !== "production",
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
