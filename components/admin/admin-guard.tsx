"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ROUTES } from "@/config/routes";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.current);

  useEffect(() => {
    if (!user) {
      router.replace(ROUTES.ADMIN.LOGIN); // not authenticated -> login
      return;
    }
    // role may live in user.role or user.user_metadata.role
    const role = user.role;
    if (role !== "admin") {
      router.replace(ROUTES.DASHBOARD.ROOT); // not admin -> dashboard
    }
  }, [user, router]);

  if (!user) return null;

  const role = user.role;
  if (role !== "admin") return null;

  return <>{children}</>;
}
