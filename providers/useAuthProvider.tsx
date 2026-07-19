"use client";

import React, { createContext, useEffect, useMemo, useState } from "react";
import { post } from "@/lib/apiClient";
import { useAppDispatch } from "@/store/hook";
import { setAuthLoading, setUser, logout } from "@/store/user/user.reducer";
import { API_ENDPOINTS } from "@/config/endpoints";
import { User } from "@/types/store/user";
import { MeResponse, SignInResponse, SignUpResponse } from "@/types/api/api";

export type AuthContextValue = {
  user?: User | null;
  loading: boolean;
  error?: string | null;
  signIn: (
    email: string,
    password: string,
    opts?: { endpoint?: string },
  ) => Promise<User>;
  signUp: (
    name: string,
    email: string,
    password: string,
    opts?: { companyName?: string; next?: string },
  ) => Promise<SignUpResponse>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export { AuthContext };

type Props = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // initial fetch: try to get current session
  useEffect(() => {
    let mounted = true;
    (async () => {
      dispatch(setAuthLoading(true));
      setLoading(true);
      try {
        const res = await post<MeResponse>(
          API_ENDPOINTS.AUTH.ME,
          {},
          { timeoutMs: 5000 },
        );
        if (!mounted) return;
        if (res.ok) {
          if (res.data?.user) {
            dispatch(setUser(res.data.user as User));
          } else {
            dispatch(setUser(null));
          }
        }
      } catch {
        if (!mounted) return;
        dispatch(setUser(null));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const signIn = async (
    email: string,
    password: string,
    opts?: { endpoint?: string },
  ): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = opts?.endpoint ?? API_ENDPOINTS.AUTH.SIGN_IN;
      const res = await post<SignInResponse>(
        endpoint,
        { email, password },
        { timeoutMs: 15_000 },
      );
      if (!res.ok) {
        const msg =
          typeof res.error === "string"
            ? res.error
            : ((res.error as any)?.message ?? `Sign-in failed (${res.status})`);
        setError(msg);
        throw new Error(msg);
      }
      const u = res.data?.user ?? null;
      if (!u) {
        const msg = "Sign-in succeeded but server returned no user";
        setError(msg);
        throw new Error(msg);
      }
      dispatch(setUser(u as User));
      return u as User;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await post(
        API_ENDPOINTS.AUTH.SIGN_OUT,
        {},
        { timeoutMs: 8000 },
      );
      if (!res.ok) {
        const msg =
          typeof res.error === "string"
            ? res.error
            : ((res.error as any)?.message ??
              `Sign-out failed (${res.status})`);
        setError(msg);
        throw new Error(msg);
      }
      dispatch(logout());
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    opts?: { companyName?: string; next?: string },
  ): Promise<SignUpResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await post<SignUpResponse>(
        API_ENDPOINTS.AUTH.SIGN_UP,
        {
          name,
          email,
          password,
          confirmPassword: password,
          companyName: opts?.companyName,
          next: opts?.next,
        },
        { timeoutMs: 15_000 },
      );

      if (!res.ok) {
        const msg =
          typeof res.error === "string"
            ? res.error
            : ((res.error as any)?.message ?? `Sign-up failed (${res.status})`);
        setError(msg);
        throw new Error(msg);
      }

      const payload = res.data;
      if (!payload) {
        const msg = "Sign-up succeeded but no response payload was returned";
        setError(msg);
        throw new Error(msg);
      }

      if (payload.signedIn && payload.user) {
        dispatch(setUser(payload.user as User));
      }

      return payload;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async (): Promise<void> => {
    dispatch(setAuthLoading(true));
    try {
      const res = await post<MeResponse>(
        API_ENDPOINTS.AUTH.ME,
        {},
        { timeoutMs: 5000 },
      );
      if (res.ok) {
        if (res.data?.user) {
          dispatch(setUser(res.data.user as User));
        } else {
          dispatch(setUser(null));
        }
        return;
      }
      dispatch(setAuthLoading(false));
    } catch {
      dispatch(setAuthLoading(false));
    }
  };

  const value = useMemo(
    () => ({
      loading,
      error,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
