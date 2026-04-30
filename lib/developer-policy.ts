// lib/developer-policy.ts

export type PlanPolicy = {
  maxApiKeys: number;
  maxWebhooks: number;
  requestsPerMinute: number;
};

const DEFAULT_POLICY: PlanPolicy = {
  maxApiKeys: 1,
  maxWebhooks: 1,
  requestsPerMinute: 30,
};

const PLAN_POLICIES: Record<string, PlanPolicy> = {
  free: { maxApiKeys: 0, maxWebhooks: 0, requestsPerMinute: 10 },
  business: { maxApiKeys: 10, maxWebhooks: 20, requestsPerMinute: 180 },
  conglomerate: { maxApiKeys: 25, maxWebhooks: 50, requestsPerMinute: 300 },
  "conglomerate-pro": {
    maxApiKeys: 75,
    maxWebhooks: 150,
    requestsPerMinute: 900,
  },
  enterprise: { maxApiKeys: 500, maxWebhooks: 1000, requestsPerMinute: 3000 },
};

export function getPlanPolicy(plan: string | null | undefined): PlanPolicy {
  if (!plan) return DEFAULT_POLICY;
  const normalized = String(plan).trim().toLowerCase().replace(/\s+/g, "-");
  return PLAN_POLICIES[normalized] ?? DEFAULT_POLICY;
}

export function hasAnyPermission(
  permissions: unknown,
  names: string[],
): boolean {
  if (!permissions || typeof permissions !== "object") return false;
  const bag = permissions as Record<string, unknown>;
  return names.some((name) => Boolean(bag[name]));
}

export function withScopedPermissionDefaults(permissions?: unknown) {
  const current =
    permissions && typeof permissions === "object"
      ? (permissions as Record<string, unknown>)
      : {};

  const read = Boolean(current.read ?? current["qr:read"] ?? true);
  const write = Boolean(current.write ?? current["qr:generate"] ?? true);
  const verify = Boolean(current.verify ?? current["qr:read"] ?? true);

  return {
    read,
    write,
    verify,
    admin: Boolean(current.admin ?? false),
    "qr:read": Boolean(current["qr:read"] ?? read),
    "qr:generate": Boolean(current["qr:generate"] ?? write),
    "webhook:manage": Boolean(current["webhook:manage"] ?? write),
  };
}
