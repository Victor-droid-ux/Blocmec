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
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import type { FlutterWaveResponse } from "flutterwave-react-v3/dist/types";
import { useAppSelector } from "@/store/hook";
import { getUser } from "@/store/user/user.reducer";

const PLAN_LABELS: Record<string, string> = {
  business: "Business",
  conglomerate: "Conglomerate",
  "conglomerate-pro": "Conglomerate Pro",
};

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

  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: `blockmec_sub_${plan}_${Date.now()}`,
    amount: Number.parseFloat(amount),
    currency: currency.toUpperCase(),
    payment_options: "card,ussd,banktransfer",
    customer: {
      email,
      phone_number: phone,
      name: name ?? "",
    },
    customizations: {
      title: `BLOCKMEC ${PLAN_LABELS[plan] ?? plan} Plan`,
      description: `Subscribe to the ${PLAN_LABELS[plan] ?? plan} plan — ${Number(credits).toLocaleString()} credits/month`,
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/images/blockmec-logo.png`,
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  const handleSubmit = async (e: React.FormEvent) => {
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

    handleFlutterPayment({
      callback: async (response: FlutterWaveResponse) => {
        closePaymentModal();

        if (response.status === "successful") {
          try {
            const res = await fetch("/api/user/subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan,
                currency: currency.toUpperCase(),
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
              }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
              throw new Error(data?.error ?? "Failed to activate subscription");
            }

            toast({
              title: "Subscription activated!",
              description: `You are now on the ${PLAN_LABELS[plan] ?? plan} plan. ${Number(data.credits_added).toLocaleString()} credits added.`,
            });
            router.push(ROUTES.DASHBOARD.DEVELOPER);
          } catch (error) {
            console.error("Subscription activation error:", error);
            toast({
              title: "Activation failed",
              description:
                error instanceof Error
                  ? error.message
                  : "Payment received but subscription was not activated. Contact support.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Payment failed",
            description:
              "Flutterwave payment was not successful. Please try again.",
            variant: "destructive",
          });
        }

        setIsProcessing(false);
      },
      onClose: () => {
        toast({
          title: "Payment cancelled",
          description: "Your subscription payment has been cancelled.",
        });
        setIsProcessing(false);
      },
    });
  };

  const currencySymbol = currency.toUpperCase() === "NGN" ? "₦" : "$";
  const formattedAmount =
    currency.toUpperCase() === "NGN"
      ? Number(amount).toLocaleString()
      : Number(amount).toFixed(2);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1a1625]">
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
        <p className="text-gray-400 mt-1">
          Unlock webhooks, API keys, and {Number(credits).toLocaleString()}{" "}
          credits/month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-[#231c35] border-[#2a2139] text-white">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription className="text-gray-400">
                Enter your details to subscribe via Flutterwave
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
                      className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
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
                      className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
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
                      className="bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="bg-[#1a1625] p-4 rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Plan:</span>
                    <span className="font-medium">
                      {PLAN_LABELS[plan] ?? plan}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Credits included:</span>
                    <span>{Number(credits).toLocaleString()} / month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Billing cycle:</span>
                    <span>Monthly</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2a2139]">
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
                        {formattedAmount} with Flutterwave
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-[#2a2139] bg-transparent"
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
          <Card className="bg-[#231c35] border-[#2a2139] text-white sticky top-20">
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
              <div className="mt-4 p-3 bg-[#1a1625] rounded-md text-gray-400 text-xs">
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
