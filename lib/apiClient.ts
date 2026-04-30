// lib/apiClient.ts
export type ApiResult<T = any> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string | Record<string, any>;
};

type RequestOpts = {
  timeoutMs?: number;
  skipJson?: boolean;
  asFormData?: boolean;
  prepareHeaders?: (headers: Headers) => void | Promise<void>;
  signal?: AbortSignal;
};

const DEFAULT_TIMEOUT = 15_000;

async function safeJsonParse(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function buildHeaders(init?: HeadersInit, asFormData?: boolean) {
  const headers = new Headers(init);
  if (!asFormData && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return headers;
}

function getCookie(name: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[2]) : undefined;
}

export async function request<T = any>(
  input: RequestInfo,
  init: RequestInit = {},
  opts: RequestOpts = {},
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT;

  // forward external abort signals if present
  const external = init.signal ?? opts.signal;
  if (external) {
    if (external.aborted) controller.abort();
    else {
      const onAbort = () => controller.abort();
      external.addEventListener("abort", onAbort, { once: true });
      controller.signal.addEventListener(
        "abort",
        () => external.removeEventListener("abort", onAbort),
        { once: true },
      );
    }
  }

  const headers = buildHeaders(init.headers, !!opts.asFormData);
  if (opts.prepareHeaders) await opts.prepareHeaders(headers);

  // try {
  //   if (typeof window !== "undefined") {
  //     const method = (init.method ?? "GET").toUpperCase();
  //     if (method !== "GET" && method !== "HEAD" && !headers.has("x-csrf-token")) {
  //       const csrf = getCookie("csrf-token");
  //       if (csrf) headers.set("x-csrf-token", csrf);
  //     }
  //   }
  // } catch {
  //   // silent fail — cookie reading should never block the request
  // }

  let body = init.body;
  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !opts.asFormData
  ) {
    body = JSON.stringify(body);
  }

  const finalInit: RequestInit = {
    ...init,
    body,
    headers,
    credentials: "same-origin", // CRITICAL for Supabase refresh cookies
    signal: controller.signal,
  };

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(input, finalInit);
    clearTimeout(timer);

    if (opts.skipJson) return { ok: res.ok, status: res.status };

    const parsed = await safeJsonParse(res);
    if (!res.ok) {
      const err = parsed?.error || parsed?.message || parsed || `HTTP ${res.status}`;
      return {
        ok: false,
        status: res.status,
        error: typeof err === "string" ? err : parsed,
      };
    }
    return { ok: true, status: res.status, data: parsed as T };
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError")
      return { ok: false, status: 0, error: "Request aborted or timed out" };
    return { ok: false, status: 0, error: err?.message ?? String(err) };
  }
}

/* Helpers */
export const get = <T = any>(
  url: string,
  opts?: RequestOpts & { params?: Record<string, any> },
) => {
  if (opts?.params) {
    const u = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost",
    );
    Object.entries(opts.params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      u.searchParams.set(k, String(v));
    });
    url = u.toString();
  }
  return request<T>(url, { method: "GET" }, opts);
};

export const post = <T = any>(url: string, body?: any, opts?: RequestOpts) =>
  request<T>(url, { method: "POST", body }, opts);

export const put = <T = any>(url: string, body?: any, opts?: RequestOpts) =>
  request<T>(url, { method: "PUT", body }, opts);

export const del = <T = any>(url: string, body?: any, opts?: RequestOpts) =>
  request<T>(url, { method: "DELETE", body }, opts);

export const upload = <T = any>(url: string, form: FormData, opts?: RequestOpts) =>
  request<T>(url, { method: "POST", body: form }, { ...(opts || {}), asFormData: true });
