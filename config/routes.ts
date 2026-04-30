import { UserRole } from "@/prisma/generated/enums";

// src/config/routes.ts
export const ROUTES = {
  LOGIN: "/",
  DASHBOARD: {
    ROOT: "/dashboard",
    ANALYTICS: "/dashboard/analytics",
    BATCH_FILES: "/dashboard/batch-files",
    BUILLING: "/dashboard/billing",
    CREATE_FILE: "/dashboard/create-file",
    DEVELOPER: "/dashboard/developer",
    PRODUCTS: "/dashboard/products",
    PROFILE: "/dashboard/profile",
    SETTINGS: "/dashboard/settings",
    USERS: "/dashboard/users",
  },
  ADMIN: {
    ROOT: "/admin-panel",
    ANALYST: "/admin-panel/analyst",
    HEALTH: "/admin-panel/health",
    LOGIN: "/admin-login",
    LOGS: "/admin-panel/logs",
    USERS: "/admin-panel/users",
    SETTINGS: "/admin-panel/settings",
  },
} as const;

export function getRouteForRole(role?: UserRole) {
  if (!role) return ROUTES.LOGIN;

  switch (role) {
    case UserRole.admin:
      return ROUTES.ADMIN.ROOT;
    case UserRole.user:
      return ROUTES.DASHBOARD.ROOT;
    default:
      return ROUTES.DASHBOARD.ROOT;
  }
}
