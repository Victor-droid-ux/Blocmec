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

export default function PaystackPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { current: user, loading: authLoading } = useAppSelector(getUser);

  const [isProcessing, setIsProcessing] = useState(false);

  const amount = searchParams.get("amount") || "10.00";
  const credits = searchParams.get("credits") || "1000";
  const currency = searchParams.get("currency") || "USD";

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
      ref: `blockmec_tx_${Date.now()}`,
      metadata: {
        name,
        phone,
        credits,
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
          const res = await fetch("/api/user/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              credits: parseInt(credits, 10),
              reference,
              currency,
              amount: Number.parseFloat(amount),
            }),
          });

          if (!res.ok) throw new Error("Failed to add credits");

          toast({
            title: "Payment successful",
            description: `${credits} API credits have been added to your account.`,
          });
          router.push(ROUTES.DASHBOARD.DEVELOPER);
        } catch (error) {
          console.error("Credit update error:", error);
          toast({
            title: "Credit update failed",
            description:
              "Payment was received but credits could not be added. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      onClose: () => {
        toast({
          title: "Payment cancelled",
          description: "Your Paystack payment has been cancelled.",
        });
        setIsProcessing(false);
      },
    });

    handler.openIframe();
  };

  const handleCancel = () => {
    toast({
      title: "Payment cancelled",
      description: "Your Paystack payment has been cancelled.",
    });
    router.push(ROUTES.DASHBOARD.DEVELOPER);
  };

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
          Paystack Payment Gateway ({currency.toUpperCase()})
        </h2>
        <p className="text-slate-500 dark:text-gray-400 mt-1">
          Complete your purchase of API credits using Paystack
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-white border-slate-200 text-slate-900 dark:bg-[#231c35] dark:border-[#2a2139] dark:text-white">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription className="text-slate-500 dark:text-gray-400">
                Enter your details to proceed with Paystack payment
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

                <div className="bg-slate-50 dark:bg-[#1a1625] p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500 dark:text-gray-400">Subtotal:</span>
                    <span>
                      {currency === "NGN" ? "N" : "$"}
                      {Number.parseFloat(amount).toFixed(
                        currency === "NGN" ? 0 : 2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500 dark:text-gray-400">Processing Fee:</span>
                    <span>{currency === "NGN" ? "N" : "$"}0.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-[#2a2139]">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold">
                      {currency === "NGN" ? "N" : "$"}
                      {Number.parseFloat(amount).toFixed(
                        currency === "NGN" ? 0 : 2,
                      )}
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
                        Pay {currency === "NGN" ? "N" : "$"}
                        {Number.parseFloat(amount).toFixed(
                          currency === "NGN" ? 0 : 2,
                        )}{" "}
                        with Paystack
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="dashboard-outline-btn flex-1"
                    onClick={handleCancel}
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
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#1a1625] p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 dark:text-gray-400">API Credits:</span>
                  <span>{Number.parseInt(credits, 10).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 dark:text-gray-400">Price per Credit:</span>
                  <span>
                    $
                    {(
                      Number.parseFloat(amount) / Number.parseInt(credits, 10)
                    ).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-[#2a2139]">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">
                    ${Number.parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">What You'll Get</h3>
                <ul className="space-y-1 text-sm text-slate-500 dark:text-gray-400">
                  <li>
                    • {Number.parseInt(credits, 10).toLocaleString()} API
                    credits
                  </li>
                  <li>• Instant credit activation</li>
                  <li>• Access to all verification endpoints</li>
                  <li>• Secure payment processing</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-[#1a1625] rounded-md text-slate-500 dark:text-gray-400 text-xs">
                Payments are processed securely by Paystack.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
