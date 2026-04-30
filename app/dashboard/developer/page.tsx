//app/dashboard/developer/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Key,
  RefreshCw,
  Info,
  AlertCircle,
  Code,
  FileCode,
  Coins,
  ShoppingCart,
  Check,
  Loader2,
  Webhook,
  Send,
  Trash2,
  PauseCircle,
  PlayCircle,
  Shield,
} from "lucide-react";
import AuthGuard from "@/components/dashboard/auth-guard";
import { API_ENDPOINTS } from "@/config/endpoints";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  api_credits: number;
  subscription_plan: string;
}

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string | null;
  status: string;
  permissions: any;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
}

interface PricingData {
  methods: {
    [key: string]: {
      name: string;
      currency: string;
      pricePerCredit: number;
      description: string;
    };
  };
  minimumCredits: number;
  bulkDiscounts?: Array<{
    minCredits: number;
    discountPercent: number;
    note: string;
  }>;
}

interface WebhookEndpoint {
  id: string;
  name: string | null;
  endpoint_url: string;
  allowed_domains: string[];
  events: string[];
  status: "active" | "paused" | "disabled";
  timeout_ms: number;
  max_retries: number;
  api_key_id: string | null;
  last_delivery_at?: string | null;
  last_delivery_status?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at?: string;
}

type WebhookEventState = {
  qrBatchCompleted: boolean;
  qrGenerated: boolean;
  qrCodesGenerated: boolean;
  qrVerified: boolean;
};

const WEBHOOK_EVENT_KEYS = {
  qrBatchCompleted: "qr.batch.completed",
  qrGenerated: "qr.generated",
  qrCodesGenerated: "qr.codes.generated",
  qrVerified: "qr.verified",
} as const;

const DEFAULT_WEBHOOK_EVENT_STATE: WebhookEventState = {
  qrBatchCompleted: true,
  qrGenerated: true,
  qrCodesGenerated: true,
  qrVerified: false,
};

const WEBHOOK_EVENT_OPTIONS = [
  {
    key: "qrBatchCompleted",
    label: WEBHOOK_EVENT_KEYS.qrBatchCompleted,
    description: "Summary event when a generation batch completes.",
  },
  {
    key: "qrGenerated",
    label: WEBHOOK_EVENT_KEYS.qrGenerated,
    description: "Event sent when QR codes are generated.",
  },
  {
    key: "qrCodesGenerated",
    label: WEBHOOK_EVENT_KEYS.qrCodesGenerated,
    description: "Chunked payloads containing generated QR data.",
  },
  {
    key: "qrVerified",
    label: WEBHOOK_EVENT_KEYS.qrVerified,
    description: "Event sent when a QR verification succeeds.",
  },
] as const satisfies ReadonlyArray<{
  key: keyof WebhookEventState;
  label: string;
  description: string;
}>;

type WebhookPayloadRecord = {
  id: string;
  event_type: string;
  summary: Record<string, unknown>;
  payload: Record<string, unknown>;
  batch_id: string | null;
  created_at: string;
  expires_at: string | null;
};

function WebhookEventToggleGroup({
  state,
  setState,
  layout = "detailed",
  itemClassName,
}: {
  state: WebhookEventState;
  setState: React.Dispatch<React.SetStateAction<WebhookEventState>>;
  layout?: "detailed" | "compact";
  itemClassName: string;
}) {
  return (
    <div
      className={
        layout === "compact"
          ? "grid grid-cols-1 md:grid-cols-4 gap-3"
          : "space-y-3"
      }
    >
      {WEBHOOK_EVENT_OPTIONS.map((option) => (
        <div
          key={option.key}
          className={`flex items-center justify-between rounded-md px-3 py-2 ${itemClassName}`}
        >
          <div>
            <p className={layout === "compact" ? "text-sm" : "font-medium"}>
              {option.label}
            </p>
            {layout === "detailed" ? (
              <p className="text-xs text-gray-400">{option.description}</p>
            ) : null}
          </div>
          <Switch
            checked={state[option.key]}
            onCheckedChange={(checked) =>
              setState((prev) => ({
                ...prev,
                [option.key]: checked,
              }))
            }
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
      ))}
    </div>
  );
}

function parseDomainsInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\n,]/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function domainsToInput(domains?: string[]) {
  return (domains ?? []).join("\n");
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const directError = record.error;

  if (typeof directError === "string" && directError.trim()) {
    return directError;
  }

  if (directError && typeof directError === "object") {
    const errorRecord = directError as Record<string, unknown>;
    const fieldErrors = errorRecord.fieldErrors;

    if (fieldErrors && typeof fieldErrors === "object") {
      for (const value of Object.values(
        fieldErrors as Record<string, unknown>,
      )) {
        if (Array.isArray(value)) {
          const message = value.find(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          );
          if (message) {
            return message;
          }
        }
      }
    }

    const formErrors = errorRecord.formErrors;
    if (Array.isArray(formErrors)) {
      const message = formErrors.find(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      );
      if (message) {
        return message;
      }
    }
  }

  const message = record.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
}

async function fetchWithRetryOnServiceUnavailable(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 1,
) {
  try {
    const response = await fetch(input, init);

    if (response.status === 503 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return fetchWithRetryOnServiceUnavailable(input, init, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return fetchWithRetryOnServiceUnavailable(input, init, retries - 1);
    }

    throw error;
  }
}

export default function DeveloperPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWebhookSubmitting, setIsWebhookSubmitting] = useState(false);
  const [isWebhookRefreshing, setIsWebhookRefreshing] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("1000");
  const [paymentMethod, setPaymentMethod] = useState("blc");
  const [domainName, setDomainName] = useState("");
  const [scriptGenerated, setScriptGenerated] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [latestWebhookSecret, setLatestWebhookSecret] = useState("");
  const [webhookName, setWebhookName] = useState("Primary webhook");
  const [webhookEndpointUrl, setWebhookEndpointUrl] = useState("");
  const [webhookAllowedDomainsInput, setWebhookAllowedDomainsInput] =
    useState("");
  const [selectedWebhookApiKeyId, setSelectedWebhookApiKeyId] = useState("");
  const [webhookTimeoutMs, setWebhookTimeoutMs] = useState("10000");
  const [webhookMaxRetries, setWebhookMaxRetries] = useState("6");
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventState>(
    DEFAULT_WEBHOOK_EVENT_STATE,
  );
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(
    null,
  );
  const [isEditWebhookSubmitting, setIsEditWebhookSubmitting] = useState(false);
  const [editWebhookName, setEditWebhookName] = useState("");
  const [editWebhookEndpointUrl, setEditWebhookEndpointUrl] = useState("");
  const [editWebhookAllowedDomainsInput, setEditWebhookAllowedDomainsInput] =
    useState("");
  const [editWebhookTimeoutMs, setEditWebhookTimeoutMs] = useState("10000");
  const [editWebhookMaxRetries, setEditWebhookMaxRetries] = useState("6");
  const [editWebhookStatus, setEditWebhookStatus] = useState<
    "active" | "paused" | "disabled"
  >("active");
  const [editWebhookEvents, setEditWebhookEvents] = useState<WebhookEventState>(
    DEFAULT_WEBHOOK_EVENT_STATE,
  );
  const [payloadLookupId, setPayloadLookupId] = useState("");
  const [payloadLookupData, setPayloadLookupData] =
    useState<WebhookPayloadRecord | null>(null);
  const [payloadLookupLoading, setPayloadLookupLoading] = useState(false);

  const [keyExpiry, setKeyExpiry] = useState("90");
  const [keyPermissions, setKeyPermissions] = useState({
    "qr:read": true,
    "qr:generate": true,
    "webhook:manage": true,
    admin: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, keysRes, pricingRes, webhooksRes] =
          await Promise.all([
            fetch(API_ENDPOINTS.USER.PROFILE),
            fetchWithRetryOnServiceUnavailable(API_ENDPOINTS.USER.API_KEYS),
            fetch(API_ENDPOINTS.PRICING.CREDITS),
            fetch(API_ENDPOINTS.USER.WEBHOOKS),
          ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.user);
        }

        if (keysRes.ok) {
          const data = await keysRes.json();
          setApiKeys(data.keys ?? []);
        } else if (keysRes.status === 503) {
          toast({
            title: "API keys temporarily unavailable",
            description:
              "Authentication service is temporarily unavailable. Please try again shortly.",
            variant: "destructive",
          });
        }

        if (pricingRes.ok) {
          const data = await pricingRes.json();
          setPricing(data);
        }

        if (webhooksRes.ok) {
          const data = await webhooksRes.json();
          setWebhooks(data.webhooks ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch developer data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const fetchWebhooks = async () => {
    setIsWebhookRefreshing(true);
    try {
      const res = await fetch(API_ENDPOINTS.USER.WEBHOOKS);
      if (!res.ok) {
        throw new Error("Failed to load webhooks");
      }

      const data = await res.json();
      setWebhooks(data.webhooks ?? []);
    } catch (err) {
      toast({
        title: "Webhook sync failed",
        description: "Could not refresh your webhook list.",
        variant: "destructive",
      });
    } finally {
      setIsWebhookRefreshing(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      const res = await fetchWithRetryOnServiceUnavailable(
        API_ENDPOINTS.USER.API_KEYS,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "My API Key",
            permissions: keyPermissions,
            expiryDays: keyExpiry === "0" ? null : parseInt(keyExpiry),
          }),
        },
      );

      if (res.status === 503) {
        throw new Error("AUTH_SERVICE_UNAVAILABLE");
      }

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Failed to generate key");
      }

      const data = await res.json();
      toast({
        title: "API Key Created",
        description: `Your new key: ${data.key} — copy it now, it won't be shown again.`,
      });
      const keysRes = await fetchWithRetryOnServiceUnavailable(
        API_ENDPOINTS.USER.API_KEYS,
      );
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.keys ?? []);
      }
    } catch (err) {
      const isServiceUnavailable =
        err instanceof Error && err.message === "AUTH_SERVICE_UNAVAILABLE";

      toast({
        title: "Error",
        description: isServiceUnavailable
          ? "Authentication service is temporarily unavailable. Please retry in a moment."
          : err instanceof Error
            ? err.message
            : "Failed to create API key.",
        variant: "destructive",
      });
    }
  };

  const getEventsFromState = (state: WebhookEventState) =>
    (
      Object.entries(WEBHOOK_EVENT_KEYS) as Array<
        [
          keyof WebhookEventState,
          (typeof WEBHOOK_EVENT_KEYS)[keyof typeof WEBHOOK_EVENT_KEYS],
        ]
      >
    )
      .filter(([key]) => state[key])
      .map(([, eventName]) => eventName);

  const getWebhookEventStateFromList = (
    events: string[],
  ): WebhookEventState => {
    const selectedEvents = new Set(events);

    return {
      qrBatchCompleted: selectedEvents.has(WEBHOOK_EVENT_KEYS.qrBatchCompleted),
      qrGenerated: selectedEvents.has(WEBHOOK_EVENT_KEYS.qrGenerated),
      qrCodesGenerated: selectedEvents.has(WEBHOOK_EVENT_KEYS.qrCodesGenerated),
      qrVerified: selectedEvents.has(WEBHOOK_EVENT_KEYS.qrVerified),
    };
  };

  const resetWebhookForm = () => {
    setWebhookName("Primary webhook");
    setWebhookEndpointUrl("");
    setWebhookAllowedDomainsInput("");
    setSelectedWebhookApiKeyId("");
    setWebhookTimeoutMs("10000");
    setWebhookMaxRetries("6");
    setWebhookEvents(DEFAULT_WEBHOOK_EVENT_STATE);
  };

  const buildWebhookRequestPayload = ({
    name,
    endpointUrl,
    allowedDomainsInput,
    events,
    timeoutMs,
    maxRetries,
    status,
    apiKeyId,
  }: {
    name: string;
    endpointUrl: string;
    allowedDomainsInput: string;
    events: string[];
    timeoutMs: string;
    maxRetries: string;
    status?: "active" | "paused" | "disabled";
    apiKeyId?: string;
  }) => ({
    name: name.trim() || undefined,
    endpointUrl: endpointUrl.trim(),
    allowedDomains: parseDomainsInput(allowedDomainsInput),
    events,
    timeoutMs: Number.parseInt(timeoutMs, 10),
    maxRetries: Number.parseInt(maxRetries, 10),
    ...(status ? { status } : {}),
    ...(apiKeyId ? { apiKeyId } : {}),
  });

  const openEditWebhookModal = (webhook: WebhookEndpoint) => {
    setEditingWebhook(webhook);
    setEditWebhookName(webhook.name ?? "");
    setEditWebhookEndpointUrl(webhook.endpoint_url);
    setEditWebhookAllowedDomainsInput(domainsToInput(webhook.allowed_domains));
    setEditWebhookTimeoutMs(String(webhook.timeout_ms));
    setEditWebhookMaxRetries(String(webhook.max_retries));
    setEditWebhookStatus(webhook.status);
    setEditWebhookEvents(getWebhookEventStateFromList(webhook.events));
  };

  const closeEditWebhookModal = () => {
    setEditingWebhook(null);
    setIsEditWebhookSubmitting(false);
  };

  const handleCreateWebhook = async () => {
    const events = getEventsFromState(webhookEvents);
    if (!webhookEndpointUrl.trim()) {
      toast({
        title: "Webhook URL required",
        description: "Enter a valid HTTPS webhook endpoint URL.",
        variant: "destructive",
      });
      return;
    }

    if (events.length === 0) {
      toast({
        title: "Select an event",
        description: "Choose at least one webhook event to subscribe to.",
        variant: "destructive",
      });
      return;
    }

    setIsWebhookSubmitting(true);

    try {
      const res = await fetch(API_ENDPOINTS.USER.WEBHOOKS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildWebhookRequestPayload({
            name: webhookName,
            endpointUrl: webhookEndpointUrl,
            allowedDomainsInput: webhookAllowedDomainsInput,
            events,
            timeoutMs: webhookTimeoutMs,
            maxRetries: webhookMaxRetries,
            apiKeyId: selectedWebhookApiKeyId,
          }),
        ),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to create webhook"));
      }

      setLatestWebhookSecret(
        data?.signingSecret ?? data?.webhook?.signing_secret ?? "",
      );
      toast({
        title: "Webhook created",
        description: "Copy the signing secret now. It is shown only once.",
      });
      resetWebhookForm();
      await fetchWebhooks();
    } catch (err) {
      toast({
        title: "Webhook creation failed",
        description:
          err instanceof Error ? err.message : "Failed to create webhook.",
        variant: "destructive",
      });
    } finally {
      setIsWebhookSubmitting(false);
    }
  };

  const handleToggleWebhookStatus = async (webhook: WebhookEndpoint) => {
    const nextStatus = webhook.status === "active" ? "paused" : "active";

    try {
      const res = await fetch(`${API_ENDPOINTS.USER.WEBHOOKS}/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(data, "Failed to update webhook status"),
        );
      }

      setWebhooks((prev) =>
        prev.map((item) =>
          item.id === webhook.id ? { ...item, status: nextStatus } : item,
        ),
      );
      toast({
        title: nextStatus === "active" ? "Webhook enabled" : "Webhook paused",
        description: `${webhook.name ?? "Webhook"} is now ${nextStatus}.`,
      });
    } catch (err) {
      toast({
        title: "Webhook update failed",
        description:
          err instanceof Error ? err.message : "Failed to update webhook.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (
      !confirm(
        "Delete this webhook? Existing delivery history will be removed.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_ENDPOINTS.USER.WEBHOOKS}/${webhookId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to delete webhook"));
      }

      setWebhooks((prev) => prev.filter((item) => item.id !== webhookId));
      toast({
        title: "Webhook deleted",
        description: "Webhook removed successfully.",
      });
    } catch (err) {
      toast({
        title: "Webhook deletion failed",
        description:
          err instanceof Error ? err.message : "Failed to delete webhook.",
        variant: "destructive",
      });
    }
  };

  const handleSaveWebhookEdits = async () => {
    if (!editingWebhook) return;

    const events = getEventsFromState(editWebhookEvents);
    if (events.length === 0) {
      toast({
        title: "Select an event",
        description: "Choose at least one webhook event to subscribe to.",
        variant: "destructive",
      });
      return;
    }

    setIsEditWebhookSubmitting(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS.USER.WEBHOOKS}/${editingWebhook.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildWebhookRequestPayload({
              name: editWebhookName,
              endpointUrl: editWebhookEndpointUrl,
              allowedDomainsInput: editWebhookAllowedDomainsInput,
              events,
              status: editWebhookStatus,
              timeoutMs: editWebhookTimeoutMs,
              maxRetries: editWebhookMaxRetries,
            }),
          ),
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to update webhook"));
      }

      await fetchWebhooks();
      closeEditWebhookModal();
      toast({
        title: "Webhook updated",
        description: "Webhook configuration saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Webhook update failed",
        description:
          err instanceof Error ? err.message : "Failed to update webhook.",
        variant: "destructive",
      });
    } finally {
      setIsEditWebhookSubmitting(false);
    }
  };

  const handleLookupPayload = async () => {
    const id = payloadLookupId.trim();
    if (!id) {
      toast({
        title: "Payload ID required",
        description: "Enter a payload ID to fetch webhook payload details.",
        variant: "destructive",
      });
      return;
    }

    setPayloadLookupLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.USER.WEBHOOKS}/payloads/${id}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(data, "Failed to fetch payload details"),
        );
      }

      setPayloadLookupData(data.payload ?? null);
      toast({
        title: "Payload loaded",
        description: "Webhook payload details fetched successfully.",
      });
    } catch (err) {
      setPayloadLookupData(null);
      toast({
        title: "Payload lookup failed",
        description:
          err instanceof Error
            ? err.message
            : "Failed to fetch payload details.",
        variant: "destructive",
      });
    } finally {
      setPayloadLookupLoading(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const res = await fetch(
        `${API_ENDPOINTS.USER.WEBHOOKS}/${webhookId}/test`,
        { method: "POST" },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const errorMessage = getApiErrorMessage(
          data,
          "Failed to send test webhook",
        );
        const details = [
          typeof data?.http_status === "number"
            ? `HTTP ${data.http_status}`
            : null,
          typeof data?.delivery_id === "string" && data.delivery_id.trim()
            ? `Delivery ID: ${data.delivery_id}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

        throw new Error(
          details ? `${errorMessage} (${details})` : errorMessage,
        );
      }

      const details = [
        typeof data?.http_status === "number"
          ? `HTTP ${data.http_status}`
          : null,
        typeof data?.delivery_id === "string" && data.delivery_id.trim()
          ? `Delivery ID: ${data.delivery_id}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

      toast({
        title: "Test sent",
        description: details
          ? `A signed test delivery has been sent to the endpoint. ${details}`
          : "A signed test delivery has been sent to the endpoint.",
      });
      await fetchWebhooks();
    } catch (err) {
      toast({
        title: "Test delivery failed",
        description:
          err instanceof Error ? err.message : "Failed to send test webhook.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      const res = await fetchWithRetryOnServiceUnavailable(
        `${API_ENDPOINTS.USER.API_KEYS}?id=${id}`,
        {
          method: "DELETE",
        },
      );

      if (res.status === 503) {
        throw new Error("AUTH_SERVICE_UNAVAILABLE");
      }

      if (!res.ok) throw new Error("Failed to revoke key");
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast({ title: "Key revoked", description: "API key has been revoked." });
    } catch (err) {
      const isServiceUnavailable =
        err instanceof Error && err.message === "AUTH_SERVICE_UNAVAILABLE";

      toast({
        title: "Error",
        description: isServiceUnavailable
          ? "Authentication service is temporarily unavailable. Please retry in a moment."
          : "Failed to revoke key.",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseCredits = () => {
    const cost = calculateCost();
    if (paymentMethod === "blc") {
      router.push(
        `/dashboard/developer/blc-payment?amount=${cost}&credits=${purchaseAmount}`,
      );
    } else if (paymentMethod === "card") {
      router.push(
        `/dashboard/developer/card-payment?amount=${cost}&credits=${purchaseAmount}`,
      );
    } else if (paymentMethod === "flutterwave") {
      router.push(
        `/dashboard/developer/flutterwave-payment?amount=${cost}&credits=${purchaseAmount}`,
      );
    }
  };

  const handleGenerateScript = async () => {
    if (!domainName) {
      toast({
        title: "Domain required",
        description: "Enter your domain first.",
        variant: "destructive",
      });
      return;
    }

    const activeKey = apiKeys.find((k) => k.status === "active");
    if (!activeKey) {
      toast({
        title: "No active API key",
        description: "Create an API key first before generating the script.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.USER.SCRIPT_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeyId: activeKey.id,
          domain: domainName.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate integration script");
      }

      setGeneratedScript(data.scriptTag);
      setScriptGenerated(true);
      toast({
        title: "Script generated",
        description: "A secure, domain-bound script tag is ready to copy.",
      });
    } catch (error) {
      toast({
        title: "Script generation failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to generate the integration script.",
        variant: "destructive",
      });
    }
  };

  const calculateCost = () => {
    const amount = parseInt(purchaseAmount) || 0;
    if (!pricing) return "0";

    const methodKey =
      paymentMethod === "card" || paymentMethod === "flutterwave"
        ? "card"
        : paymentMethod;
    const pricePerCredit = pricing.methods[methodKey]?.pricePerCredit ?? 0.01;
    return (amount * pricePerCredit).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1a1625]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <DashboardShell>
        <DashboardHeader />
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Developer API</h2>
            <p className="text-gray-400 mt-2">
              Integrate BLOCKMEC QR verification into your products and stop
              counterfeits.
            </p>
          </div>

          <Tabs defaultValue="api-credits" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-8">
              <TabsTrigger
                value="api-credits"
                className="data-[state=active]:bg-purple-600"
              >
                <Coins className="h-4 w-4 mr-2" />
                API Credits
              </TabsTrigger>
              <TabsTrigger
                value="api-keys"
                className="data-[state=active]:bg-purple-600"
              >
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger
                value="integration"
                className="data-[state=active]:bg-purple-600"
              >
                <Code className="h-4 w-4 mr-2" />
                Integration
              </TabsTrigger>
              <TabsTrigger
                value="webhooks"
                className="data-[state=active]:bg-purple-600"
              >
                <Webhook className="h-4 w-4 mr-2" />
                Webhooks
              </TabsTrigger>
            </TabsList>

            {/* API Credits Tab */}
            <TabsContent value="api-credits" className="space-y-6">
              <Card className="bg-[#231c35] border-[#2a2139] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-purple-400" />
                    API Credits Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300">
                            Available Credits
                          </span>
                          <span className="text-xl font-bold">
                            {(profile?.api_credits ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#1a1625] rounded-full overflow-hidden">
                          <div
                            className="bg-green-600 h-full rounded-full"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>
                      <div className="bg-[#1a1625] p-4 rounded-md">
                        <p className="text-sm text-gray-400">
                          Subscription Plan
                        </p>
                        <p className="text-lg font-semibold capitalize">
                          {profile?.subscription_plan ?? "free"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#1a1625] p-4 rounded-md space-y-4">
                      <h3 className="text-lg font-medium">Purchase Credits</h3>
                      <div className="space-y-2">
                        <Label>Number of Credits</Label>
                        <Input
                          type="number"
                          value={purchaseAmount}
                          onChange={(e) => setPurchaseAmount(e.target.value)}
                          min="100"
                          className="bg-[#2a2139] border-0 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger className="bg-[#2a2139] border-0 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#231c35] border-[#2a2139] text-white">
                            <SelectItem value="blc">BLC Tokens</SelectItem>
                            <SelectItem value="card">
                              Credit/Debit Card
                            </SelectItem>
                            <SelectItem value="flutterwave">
                              Flutterwave
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Cost:</span>
                        <span className="font-bold text-white">
                          {pricing ? (
                            <>
                              {calculateCost()}{" "}
                              {pricing.methods[
                                paymentMethod === "card" ||
                                paymentMethod === "flutterwave"
                                  ? "card"
                                  : paymentMethod
                              ]?.currency ?? "BLC"}
                            </>
                          ) : (
                            "Loading..."
                          )}
                        </span>
                      </div>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={handlePurchaseCredits}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Credits
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#231c35] border-[#2a2139] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-purple-400" />
                    Subscription Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        name: "Business",
                        price: "$99",
                        credits: "50,000",
                        color: "purple",
                      },
                      {
                        name: "Conglomerate",
                        price: "$299",
                        credits: "200,000",
                        color: "blue",
                      },
                      {
                        name: "Conglomerate Pro",
                        price: "$599",
                        credits: "500,000",
                        color: "orange",
                        popular: true,
                      },
                      {
                        name: "Enterprise",
                        price: "Custom",
                        credits: "Unlimited",
                        color: "gray",
                      },
                    ].map((plan) => (
                      <div
                        key={plan.name}
                        className={`bg-[#1a1625] p-6 rounded-lg border relative ${
                          plan.popular
                            ? "border-orange-500"
                            : "border-[#2a2139]"
                        } ${
                          profile?.subscription_plan ===
                          plan.name.toLowerCase().replace(" ", "-")
                            ? "ring-2 ring-purple-500"
                            : ""
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                              POPULAR
                            </span>
                          </div>
                        )}
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-bold">{plan.name}</h3>
                          <div
                            className={`text-3xl font-bold mt-2 text-${plan.color}-400`}
                          >
                            {plan.price}
                          </div>
                          {plan.price !== "Custom" && (
                            <div className="text-sm text-gray-400">/month</div>
                          )}
                        </div>
                        <div className="text-center text-sm text-gray-300 mb-6">
                          <Check className="h-4 w-4 text-green-500 inline mr-1" />
                          {plan.credits} API credits/month
                        </div>
                        <Button
                          className={`w-full bg-${plan.color}-600 hover:bg-${plan.color}-700`}
                          variant={
                            profile?.subscription_plan ===
                            plan.name.toLowerCase()
                              ? "default"
                              : "outline"
                          }
                        >
                          {profile?.subscription_plan ===
                          plan.name.toLowerCase()
                            ? "Current Plan"
                            : "Upgrade"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6">
              <Card className="bg-[#231c35] border-[#2a2139] text-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>API Keys</CardTitle>
                      <CardDescription className="text-gray-400">
                        Your API keys grant access to BLOCKMEC verification
                        services.
                      </CardDescription>
                    </div>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleGenerateApiKey}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Create New Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Key className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No API keys yet. Create one to get started.</p>
                    </div>
                  ) : (
                    apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="bg-[#1a1625] p-4 rounded-md flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {key.name ?? "Unnamed Key"}
                          </p>
                          <p className="text-sm text-gray-400 font-mono">
                            {key.key_prefix}••••••••
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created{" "}
                            {new Date(key.created_at).toLocaleDateString()}
                            {key.expires_at &&
                              ` · Expires ${new Date(key.expires_at).toLocaleDateString()}`}
                            {key.last_used_at &&
                              ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              key.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {key.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => handleRevokeKey(key.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="border-t border-[#2a2139] pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Key Permissions</h3>
                      {Object.entries(keyPermissions).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <Label className="cursor-pointer">
                            {key === "qr:read"
                              ? "qr:read"
                              : key === "qr:generate"
                                ? "qr:generate"
                                : key === "webhook:manage"
                                  ? "webhook:manage"
                                  : "admin"}
                          </Label>
                          <Switch
                            checked={Boolean(val)}
                            onCheckedChange={(checked) =>
                              setKeyPermissions((prev) => ({
                                ...prev,
                                [key]: checked,
                              }))
                            }
                            className="data-[state=checked]:bg-purple-600"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Key Expiration</h3>
                      <Select value={keyExpiry} onValueChange={setKeyExpiry}>
                        <SelectTrigger className="bg-[#1a1625] border-0 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#231c35] border-[#2a2139] text-white">
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="365">365 days</SelectItem>
                          <SelectItem value="0">Never expires</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integration Tab */}
            <TabsContent value="integration" className="space-y-6">
              <Card className="bg-[#231c35] border-[#2a2139] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-purple-400" />
                    Website Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Website Domain</Label>
                    <Input
                      placeholder="example.com"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      className="bg-[#1a1625] border-0 text-white"
                    />
                  </div>
                  {apiKeys.filter((k) => k.status === "active").length ===
                    0 && (
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      You need an active API key to generate an integration
                      script.
                    </p>
                  )}
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleGenerateScript}
                    disabled={
                      apiKeys.filter((k) => k.status === "active").length === 0
                    }
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Generate Verification Script
                  </Button>
                  {scriptGenerated && (
                    <div className="relative">
                      <Textarea
                        value={generatedScript}
                        readOnly
                        className="bg-[#1a1625] border-0 text-white font-mono text-sm h-24"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7 text-gray-400"
                        onClick={() =>
                          copyToClipboard(generatedScript, "Script")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#231c35] border-[#2a2139] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-purple-400" />
                    API Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#1a1625] p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-4">
                      Example API Usage
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Generate a QR Code
                        </h4>
                        <pre className="bg-[#2a2139] p-3 rounded-md text-xs overflow-x-auto">
                          <code className="text-gray-300">{`fetch('https://api.blockmec.org/v1/qr/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productName: 'Product Name',
    productType: 'electronics',
    quantity: 100
  })
})`}</code>
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Verify a QR Code
                        </h4>
                        <pre className="bg-[#2a2139] p-3 rounded-md text-xs overflow-x-auto">
                          <code className="text-gray-300">{`fetch('https://api.blockmec.org/v1/qr/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tokenId: 'BM-xxx-xxx'
  })
})`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <Card className="bg-[#231c35] border-[#2a2139] text-white">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Webhook className="h-5 w-5 text-purple-400" />
                        Webhook Endpoints
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Send generated QR batches to your backend as signed
                        server-to-server events.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="border-[#2a2139] bg-[#1a1625]"
                      onClick={fetchWebhooks}
                      disabled={isWebhookRefreshing}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${
                          isWebhookRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4 rounded-md bg-[#1a1625] p-4">
                      <h3 className="text-lg font-medium">Create Webhook</h3>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={webhookName}
                          onChange={(e) => setWebhookName(e.target.value)}
                          className="bg-[#2a2139] border-0 text-white"
                          placeholder="Primary webhook"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Endpoint URL (HTTPS only)</Label>
                        <Input
                          value={webhookEndpointUrl}
                          onChange={(e) =>
                            setWebhookEndpointUrl(e.target.value)
                          }
                          className="bg-[#2a2139] border-0 text-white"
                          placeholder="https://example.com/api/blockmec/webhooks"
                        />
                        <p className="text-xs text-gray-400">
                          Webhook endpoints must use https:// and be publicly
                          reachable.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Allowed Domains (Optional)</Label>
                        <Textarea
                          value={webhookAllowedDomainsInput}
                          onChange={(e) =>
                            setWebhookAllowedDomainsInput(e.target.value)
                          }
                          className="bg-[#2a2139] border-0 text-white min-h-[90px]"
                          placeholder={"example.com\napi.example.com"}
                        />
                        <p className="text-xs text-gray-400">
                          One domain per line or comma-separated. If provided,
                          webhook endpoint host must match one of these domains.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Bind to API Key</Label>
                        <Select
                          value={selectedWebhookApiKeyId || "none"}
                          onValueChange={(value) =>
                            setSelectedWebhookApiKeyId(
                              value === "none" ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger className="bg-[#2a2139] border-0 text-white">
                            <SelectValue placeholder="Optional API key binding" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#231c35] border-[#2a2139] text-white">
                            <SelectItem value="none">No key binding</SelectItem>
                            {apiKeys
                              .filter((key) => key.status === "active")
                              .map((key) => (
                                <SelectItem key={key.id} value={key.id}>
                                  {(key.name ?? "Unnamed Key") +
                                    " · " +
                                    key.key_prefix}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Timeout (ms)</Label>
                          <Input
                            type="number"
                            min="1000"
                            max="30000"
                            value={webhookTimeoutMs}
                            onChange={(e) =>
                              setWebhookTimeoutMs(e.target.value)
                            }
                            className="bg-[#2a2139] border-0 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Retries</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={webhookMaxRetries}
                            onChange={(e) =>
                              setWebhookMaxRetries(e.target.value)
                            }
                            className="bg-[#2a2139] border-0 text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label>Events</Label>
                        <WebhookEventToggleGroup
                          state={webhookEvents}
                          setState={setWebhookEvents}
                          itemClassName="bg-[#2a2139]"
                        />
                      </div>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={handleCreateWebhook}
                        disabled={isWebhookSubmitting || apiKeys.length === 0}
                      >
                        {isWebhookSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Webhook
                          </>
                        ) : (
                          <>
                            <Webhook className="mr-2 h-4 w-4" />
                            Create Webhook
                          </>
                        )}
                      </Button>
                      {apiKeys.length === 0 && (
                        <p className="text-sm text-amber-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Create an API key first to bind developer webhook
                          access.
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 rounded-md bg-[#1a1625] p-4">
                      <h3 className="text-lg font-medium">Signing Secret</h3>
                      <p className="text-sm text-gray-400">
                        Use this secret to verify webhook signatures on your
                        server. It is only returned when the webhook is created.
                      </p>
                      <Textarea
                        value={
                          latestWebhookSecret ||
                          "Create a webhook to reveal its signing secret."
                        }
                        readOnly
                        className="bg-[#2a2139] border-0 text-white font-mono text-sm min-h-[140px]"
                      />
                      <Button
                        variant="outline"
                        className="border-[#2a2139] bg-[#2a2139]/30"
                        onClick={() =>
                          latestWebhookSecret &&
                          copyToClipboard(latestWebhookSecret, "Webhook secret")
                        }
                        disabled={!latestWebhookSecret}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Copy Signing Secret
                      </Button>
                      <div className="rounded-md border border-[#2a2139] bg-[#231c35] p-3 text-xs text-gray-300">
                        <p className="font-medium mb-2">
                          Headers sent with each delivery
                        </p>
                        <p>X-Blockmec-Event</p>
                        <p>X-Blockmec-Delivery-Id</p>
                        <p>X-Blockmec-Timestamp</p>
                        <p>X-Blockmec-Signature</p>
                      </div>
                      <div className="rounded-md border border-[#2a2139] bg-[#231c35] p-3 text-xs text-gray-300 space-y-2">
                        <p className="font-medium">Canonical webhook payload</p>
                        <pre className="bg-[#1a1625] p-3 rounded-md overflow-x-auto text-[11px] leading-relaxed">
                          {`{
  "event": "qr.generated",
  "delivery_id": "uuid",
  "occurred_at": "2026-04-03T07:10:20.592Z",
  "user_id": "uuid",
  "batch_id": "uuid",
  "qr_count": 100,
  "payload_ref": "/api/user/webhooks/payloads/<id>",
  "summary": { ... }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-[#1a1625] border-[#2a2139] text-white">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Payload Viewer
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Fetch full payload details using a payload_ref ID.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-col md:flex-row gap-3">
                        <Input
                          value={payloadLookupId}
                          onChange={(e) => setPayloadLookupId(e.target.value)}
                          className="bg-[#2a2139] border-0 text-white"
                          placeholder="Enter payload ID from payload_ref"
                        />
                        <Button
                          variant="outline"
                          className="border-[#2a2139] bg-[#2a2139]/30"
                          onClick={handleLookupPayload}
                          disabled={payloadLookupLoading}
                        >
                          {payloadLookupLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Info className="mr-2 h-4 w-4" />
                          )}
                          Load Payload
                        </Button>
                      </div>
                      <Textarea
                        readOnly
                        value={
                          payloadLookupData
                            ? JSON.stringify(payloadLookupData, null, 2)
                            : "No payload loaded yet."
                        }
                        className="bg-[#2a2139] border-0 text-white font-mono min-h-[170px]"
                      />
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Registered Webhooks
                      </h3>
                      <span className="text-sm text-gray-400">
                        {webhooks.length} configured
                      </span>
                    </div>
                    {webhooks.length === 0 ? (
                      <div className="rounded-md bg-[#1a1625] p-8 text-center text-gray-400">
                        <Webhook className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No webhooks configured yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {webhooks.map((webhook) => (
                          <div
                            key={webhook.id}
                            className="rounded-md bg-[#1a1625] p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <p className="font-medium">
                                  {webhook.name ?? "Unnamed webhook"}
                                </p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    webhook.status === "active"
                                      ? "bg-green-500/20 text-green-400"
                                      : webhook.status === "paused"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {webhook.status}
                                </span>
                                {webhook.last_delivery_status && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                    last: {webhook.last_delivery_status}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-300 break-all">
                                {webhook.endpoint_url}
                              </p>
                              <p className="mt-2 text-xs text-gray-500">
                                Events: {webhook.events.join(", ")} · Timeout:{" "}
                                {webhook.timeout_ms}ms · Retries:{" "}
                                {webhook.max_retries}
                              </p>
                              {webhook.allowed_domains?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Allowed domains:{" "}
                                  {webhook.allowed_domains.join(", ")}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Created{" "}
                                {new Date(webhook.created_at).toLocaleString()}
                                {webhook.last_delivery_at &&
                                  ` · Last delivery ${new Date(webhook.last_delivery_at).toLocaleString()}`}
                              </p>
                              {webhook.last_error && (
                                <p className="text-xs text-red-400 mt-2">
                                  {webhook.last_error}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                className="border-[#2a2139] bg-[#2a2139]/30"
                                onClick={() => openEditWebhookModal(webhook)}
                              >
                                <Code className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="border-[#2a2139] bg-[#2a2139]/30"
                                onClick={() => handleTestWebhook(webhook.id)}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Test
                              </Button>
                              <Button
                                variant="outline"
                                className="border-[#2a2139] bg-[#2a2139]/30"
                                onClick={() =>
                                  handleToggleWebhookStatus(webhook)
                                }
                              >
                                {webhook.status === "active" ? (
                                  <PauseCircle className="mr-2 h-4 w-4" />
                                ) : (
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                )}
                                {webhook.status === "active"
                                  ? "Pause"
                                  : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-900/50 bg-red-950/20 text-red-300 hover:bg-red-950/40"
                                onClick={() => handleDeleteWebhook(webhook.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {editingWebhook && (
                <Card className="bg-[#231c35] border-[#2a2139] text-white">
                  <CardHeader>
                    <CardTitle>Edit Webhook</CardTitle>
                    <CardDescription className="text-gray-400">
                      Update endpoint, events, retry policy, status, and domain
                      constraints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editWebhookName}
                        onChange={(e) => setEditWebhookName(e.target.value)}
                        className="bg-[#1a1625] border-0 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Endpoint URL (HTTPS only)</Label>
                      <Input
                        value={editWebhookEndpointUrl}
                        onChange={(e) =>
                          setEditWebhookEndpointUrl(e.target.value)
                        }
                        className="bg-[#1a1625] border-0 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        Updated webhook endpoints must use https:// and be
                        publicly reachable.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Allowed Domains (Optional)</Label>
                      <Textarea
                        value={editWebhookAllowedDomainsInput}
                        onChange={(e) =>
                          setEditWebhookAllowedDomainsInput(e.target.value)
                        }
                        className="bg-[#1a1625] border-0 text-white min-h-[90px]"
                        placeholder={"example.com\napi.example.com"}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={editWebhookStatus}
                          onValueChange={(value) =>
                            setEditWebhookStatus(
                              value as "active" | "paused" | "disabled",
                            )
                          }
                        >
                          <SelectTrigger className="bg-[#1a1625] border-0 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#231c35] border-[#2a2139] text-white">
                            <SelectItem value="active">active</SelectItem>
                            <SelectItem value="paused">paused</SelectItem>
                            <SelectItem value="disabled">disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timeout (ms)</Label>
                        <Input
                          type="number"
                          min="1000"
                          max="30000"
                          value={editWebhookTimeoutMs}
                          onChange={(e) =>
                            setEditWebhookTimeoutMs(e.target.value)
                          }
                          className="bg-[#1a1625] border-0 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Retries</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={editWebhookMaxRetries}
                          onChange={(e) =>
                            setEditWebhookMaxRetries(e.target.value)
                          }
                          className="bg-[#1a1625] border-0 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label>Events</Label>
                      <WebhookEventToggleGroup
                        state={editWebhookEvents}
                        setState={setEditWebhookEvents}
                        layout="compact"
                        itemClassName="bg-[#1a1625]"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      className="border-[#2a2139] bg-[#1a1625]"
                      onClick={closeEditWebhookModal}
                      disabled={isEditWebhookSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleSaveWebhookEdits}
                      disabled={isEditWebhookSubmitting}
                    >
                      {isEditWebhookSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
