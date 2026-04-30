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

export default function FlutterwavePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Real auth from Redux store
  const { current: user, loading: authLoading } = useAppSelector(getUser);

  const [isProcessing, setIsProcessing] = useState(false);

  // Get amount and credits from URL parameters
  const amount = searchParams.get("amount") || "10.00";
  const credits = searchParams.get("credits") || "1000";

  // User details — populated from Redux store
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
    setPhone(phoneValue ?? ""); // phone is not in the User type yet
  }, [user, authLoading, router]);

  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: `blockmec_tx_${Date.now()}`,
    amount: Number.parseFloat(amount),
    currency: "USD",
    payment_options: "card,ussd,banktransfer",
    customer: {
      email,
      phone_number: phone,
      name: name ?? "",
    },
    customizations: {
      title: "BLOCKMEC API Credits",
      description: `Purchase ${credits} API credits`,
      // Uses the logo already present in /public/images/
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
            const res = await fetch("/api/user/credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                credits: parseInt(credits),
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
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
          description: "Your Flutterwave payment has been cancelled.",
        });
        setIsProcessing(false);
      },
    });
  };

  const handleCancel = () => {
    toast({
      title: "Payment cancelled",
      description: "Your Flutterwave payment has been cancelled.",
    });
    router.push(ROUTES.DASHBOARD.DEVELOPER);
  };

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
        <h2 className="text-2xl font-bold">Flutterwave Payment Gateway</h2>
        <p className="text-gray-400 mt-1">
          Complete your purchase of API credits using Flutterwave
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-[#231c35] border-[#2a2139] text-white">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription className="text-gray-400">
                Enter your details to proceed with Flutterwave payment
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

                <div className="bg-[#1a1625] p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Subtotal:</span>
                    <span>${Number.parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Processing Fee:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2a2139]">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold">
                      ${Number.parseFloat(amount).toFixed(2)}
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
                        Pay ${Number.parseFloat(amount).toFixed(2)} with
                        Flutterwave
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-[#2a2139] bg-transparent"
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
          <Card className="bg-[#231c35] border-[#2a2139] text-white sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#1a1625] p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">API Credits:</span>
                  <span>{Number.parseInt(credits).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Price per Credit:</span>
                  <span>
                    $
                    {(
                      Number.parseFloat(amount) / Number.parseInt(credits)
                    ).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#2a2139]">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">
                    ${Number.parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">What You'll Get</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 min-w-4">•</div>
                    <p>
                      {Number.parseInt(credits).toLocaleString()} API credits
                      added to your account
                    </p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 min-w-4">•</div>
                    <p>Immediate access to all API features</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 min-w-4">•</div>
                    <p>Credits never expire</p>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Payments are processed securely by Flutterwave.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
