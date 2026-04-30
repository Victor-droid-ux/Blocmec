"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ROUTES } from "@/config/routes";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.current);
  const loading = useSelector((state: RootState) => state.user.loading);

  useEffect(() => {
    // Only redirect after auth has finished loading
    if (!loading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [user, loading, router]);

  // Show nothing while auth is resolving
  if (loading || !user) return null;

  return <>{children}</>;
}
