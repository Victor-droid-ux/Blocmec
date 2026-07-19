"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const user = useSelector((state: RootState) => state.user.current);
  const loading = useSelector((state: RootState) => state.user.loading);
  const refreshAttemptedRef = useRef(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      return;
    }

    if (!refreshAttemptedRef.current) {
      refreshAttemptedRef.current = true;
      void refresh();
      return;
    }
    router.replace(ROUTES.LOGIN);
  }, [user, loading, refresh, router]);

  // Show nothing while auth is resolving
  if (loading || !user) return null;

  return <>{children}</>;
}
