"use client";

import { useContext } from "react";
import { AuthContext } from "@/providers/useAuthProvider";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
