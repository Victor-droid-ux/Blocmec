"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/config/routes";
import { API_ENDPOINTS } from "@/config/endpoints";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CallbackState = "loading" | "success" | "error";

function normalizeCallbackErrorMessage(message: string) {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (
    lower.includes("invalid") ||
    lower.includes("expired") ||
    lower.includes("already used")
  ) {
    return "This verification link is invalid or has expired. Request a new verification email below.";
  }

  return text;
}

function normalizeOtpType(value: string | null) {
  if (!value) return "signup" as const;
  if (value === "signup" || value === "email_change" || value === "recovery") {
    return value;
  }
  return "signup" as const;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState(
    "Finalizing your account verification...",
  );
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const queryError = searchParams.get("error");
  const queryErrorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = normalizeOtpType(searchParams.get("type"));
  const nextParam = searchParams.get("next");

  const safeNext = useMemo(() => {
    if (!nextParam) {
      return ROUTES.DASHBOARD.ROOT;
    }

    const isDashboardPath = /^\/dashboard(?:\/.*)?$/.test(nextParam);
    if (
      isDashboardPath &&
      !nextParam.includes("://") &&
      !nextParam.startsWith("//") &&
      !nextParam.includes("\\")
    ) {
      return nextParam;
    }

    return ROUTES.DASHBOARD.ROOT;
  }, [nextParam]);

  const normalizedErrorText = useMemo(() => {
    const hashParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.replace(/^#/, ""))
        : null;

    const hashError = hashParams?.get("error");
    const hashErrorDescription = hashParams?.get("error_description");

    return (
      queryErrorDescription ||
      hashErrorDescription ||
      queryError ||
      hashError ||
      ""
    );
  }, [queryError, queryErrorDescription]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const remembered = window.localStorage.getItem("pendingVerificationEmail");
    if (remembered) {
      setResendEmail(remembered);
    }
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownLeft]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (normalizedErrorText) {
        if (!mounted) return;
        setState("error");
        setMessage(normalizeCallbackErrorMessage(normalizedErrorText));
        return;
      }

      try {
        const supabase = createClient();

        if (code) {
          const exchangeResponse = await fetch(
            API_ENDPOINTS.AUTH.EXCHANGE_CODE,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ code }),
            },
          );

          const exchangePayload = await exchangeResponse
            .json()
            .catch(() => ({}));

          if (!exchangeResponse.ok) {
            if (!mounted) return;
            setState("error");
            setMessage(
              normalizeCallbackErrorMessage(
                exchangePayload?.error ||
                  "Verification failed. Please try again.",
              ),
            );
            return;
          }
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });

          if (error) {
            if (!mounted) return;
            setState("error");
            setMessage(
              normalizeCallbackErrorMessage(
                error.message ||
                  "Verification failed. Please request a new verification link.",
              ),
            );
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          const syncResponse = await fetch(API_ENDPOINTS.AUTH.SYNC_USER, {
            method: "POST",
            credentials: "same-origin",
          });
          if (!syncResponse.ok) {
            const retryResponse = await fetch(API_ENDPOINTS.AUTH.SYNC_USER, {
              method: "POST",
              credentials: "same-origin",
            });

            if (!retryResponse.ok) {
              setState("error");
              setMessage(
                "Your account was verified, but we could not initialize your session. Please sign in once to continue.",
              );
              return;
            }
          }

          await refresh();

          setState("success");
          setMessage(
            "Your email has been verified. Redirecting to your dashboard...",
          );
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("pendingVerificationEmail");
              window.location.assign(safeNext);
              return;
            }

            router.replace(safeNext);
          }, 1300);
          return;
        }

        setState("error");
        setMessage(
          "We could not confirm your session from this link. It may be expired, already used, or invalid.",
        );
      } catch (error: any) {
        if (!mounted) return;
        setState("error");
        setMessage(
          normalizeCallbackErrorMessage(
            error?.message ||
              "Verification could not be completed right now. Please try signing in.",
          ),
        );
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [
    code,
    tokenHash,
    otpType,
    normalizedErrorText,
    refresh,
    router,
    safeNext,
  ]);

  const handleResendVerification = async () => {
    const normalizedEmail = resendEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setResendFeedback("Enter the email address used for signup.");
      return;
    }

    setIsResending(true);
    setResendFeedback("");
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Unable to resend verification email right now. Please try again.",
        );
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "pendingVerificationEmail",
          normalizedEmail,
        );
      }

      setCooldownLeft(
        typeof payload?.cooldownSeconds === "number"
          ? payload.cooldownSeconds
          : 60,
      );
      setResendFeedback(
        payload?.message ||
          "Verification email sent. Please check your inbox and spam folder.",
      );
    } catch (error: any) {
      setResendFeedback(
        error?.message || "Could not resend verification email.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {state === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            ) : state === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            {state === "loading"
              ? "Verifying your email"
              : state === "success"
                ? "Email verified"
                : "Verification failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm leading-6">{message}</p>

          {state !== "loading" ? (
            <div className="flex gap-3 flex-wrap">
              <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
                <Link href={ROUTES.LOGIN}>Go to Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-700">
                <Link href={ROUTES.SIGNUP}>Create Another Account</Link>
              </Button>
            </div>
          ) : null}

          {state === "error" ? (
            <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <p className="text-sm text-slate-200 font-medium">
                Need another verification link?
              </p>
              <div className="space-y-2">
                <Label htmlFor="resend-email" className="text-slate-300">
                  Account email
                </Label>
                <Input
                  id="resend-email"
                  type="email"
                  value={resendEmail}
                  onChange={(event) => setResendEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleResendVerification}
                disabled={isResending || cooldownLeft > 0}
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : cooldownLeft > 0 ? (
                  `Resend available in ${cooldownLeft}s`
                ) : (
                  "Resend verification email"
                )}
              </Button>
              {resendFeedback ? (
                <p className="text-xs text-slate-300">{resendFeedback}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
