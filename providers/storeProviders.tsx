"use client";

import React, { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";

import { makeStore, AppStore } from "../store/store";

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const storeRef = useRef<AppStore>(null);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  const persistor = persistStore(storeRef.current);

  return (
    <Provider store={storeRef.current}>
      <PersistGate persistor={persistor}>{children}</PersistGate>
    </Provider>
  );
};
