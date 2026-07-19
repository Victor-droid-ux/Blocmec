"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useAppSelector } from "@/store/hook";
import { getUser } from "@/store/user/user.reducer";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => {
        openIframe: () => void;
      };
    };
  }
}

const PLAN_LABELS: Record<string, string> = {
  business: "Business",
  conglomerate: "Conglomerate",
  "conglomerate-pro": "Conglomerate Pro",
};

function getPaystackReference(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const data = response as Record<string, unknown>;
  const candidates = [
    data.reference,
    data.trxref,
    data.trans,
    data.transaction,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export default function SubscriptionPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { current: user, loading: authLoading } = useAppSelector(getUser);

  const [isProcessing, setIsProcessing] = useState(false);

  const plan = searchParams.get("plan") || "business";
  const amount = searchParams.get("amount") || "5000";
  const currency = searchParams.get("currency") || "NGN";
  const credits = searchParams.get("credits") || "5000";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }
    setEmail(user.email ?? "");
    setName(user.name ?? "");
    const phoneValue = (user as { phone?: string }).phone;
    setPhone(phoneValue ?? "");
  }, [user, authLoading, router]);

  useEffect(() => {
    const scriptSelector = 'script[src="https://js.paystack.co/v1/inline.js"]';
    if (document.querySelector(scriptSelector)) return;

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const paystack = window.PaystackPop;
    if (!paystack) {
      toast({
        title: "Payment unavailable",
        description: "Unable to initialize Paystack. Please refresh and retry.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    const handler = paystack.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(Number.parseFloat(amount) * 100),
      currency: currency.toUpperCase(),
      ref: `blockmec_sub_${plan}_${Date.now()}`,
      metadata: {
        name,
        phone,
      },
      callback: async (response: unknown) => {
        const reference = getPaystackReference(response);
        if (!reference) {
          toast({
            title: "Payment verification failed",
            description: "Missing transaction reference from Paystack.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        try {
          const res = await fetch("/api/user/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan,
              currency,
              reference,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(
              errData?.error ?? "Failed to activate subscription",
            );
          }

          toast({
            title: "Payment successful",
            description: `Your ${PLAN_LABELS[plan] ?? plan} subscription is now active.`,
          });
          router.push(ROUTES.DASHBOARD.DEVELOPER);
        } catch (error) {
          toast({
            title: "Subscription activation failed",
            description:
              error instanceof Error
                ? error.message
                : "Payment was received but subscription could not be activated.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      onClose: () => {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
          variant: "destructive",
        });
        setIsProcessing(false);
      },
    });

    handler.openIframe();
  };

  const currencySymbol = currency.toUpperCase() === "NGN" ? "₦" : "$";
  const formattedAmount =
    currency.toUpperCase() === "NGN"
      ? Number(amount).toLocaleString()
      : Number(amount).toFixed(2);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#1a1625]">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(ROUTES.DASHBOARD.DEVELOPER)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Developer Dashboard
        </Button>
        <h2 className="text-2xl font-bold">
          Subscribe — {PLAN_LABELS[plan] ?? plan} Plan
        </h2>
        <p className="text-slate-500 dark:text-gray-400 mt-1">
          Unlock webhooks, API keys, and {Number(credits).toLocaleString()}{" "}
          credits/month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-white border-slate-200 text-slate-900 dark:bg-[#231c35] dark:border-[#2a2139] dark:text-white">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription className="text-slate-500 dark:text-gray-400">
                Enter your details to subscribe via Paystack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#1a1625] dark:border-0 dark:text-white focus-visible:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#1a1625] dark:border-0 dark:text-white focus-visible:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Phone number (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#1a1625] dark:border-0 dark:text-white focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#1a1625] p-4 rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-400">Plan:</span>
                    <span className="font-medium">
                      {PLAN_LABELS[plan] ?? plan}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-400">Credits included:</span>
                    <span>{Number(credits).toLocaleString()} / month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-400">Billing cycle:</span>
                    <span>Monthly</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-[#2a2139]">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      {currencySymbol}
                      {formattedAmount} / month
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Pay {currencySymbol}
                        {formattedAmount} with Paystack
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="dashboard-outline-btn flex-1"
                    onClick={() => router.push(ROUTES.DASHBOARD.DEVELOPER)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-white border-slate-200 text-slate-900 dark:bg-[#231c35] dark:border-[#2a2139] dark:text-white sticky top-20">
            <CardHeader>
              <CardTitle>What you get</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span>
                  {Number(credits).toLocaleString()} API credits / month
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span>Create & manage webhooks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span>Multiple API keys</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span>Priority support</span>
              </div>
              <div className="mt-4 p-3 bg-slate-50 dark:bg-[#1a1625] rounded-md text-slate-500 dark:text-gray-400 text-xs">
                Subscription activates immediately after payment. Credits are
                added to your account automatically.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
