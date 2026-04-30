"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
} from "lucide-react";
import { ROUTES } from "@/config/routes";

export default function BLCPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 minutes in seconds
  const [walletAvailable, setWalletAvailable] = useState<boolean | null>(null);

  // Get amount and credits from URL parameters
  const amount = searchParams.get("amount") || "1000";
  const credits = searchParams.get("credits") || "1000";

  // BLC wallet address from environment variable
  const walletAddress =
    process.env.NEXT_PUBLIC_BLC_CRYPTO_WALLET_ADDRESS ||
    "BLM7F5EB5bB5cF88cfcEe9613368636f458800e62CB";

  const checkWalletAvailability = useCallback(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== "undefined") {
      // Check if ethereum object exists (MetaMask or other wallet)
      const hasWallet = !!(window as any).ethereum;
      setWalletAvailable(hasWallet);

      // If no wallet is available, log a message instead of an error
      if (!hasWallet) {
        console.log(
          "No cryptocurrency wallet detected. Using fallback payment method.",
        );
      }
    } else {
      setWalletAvailable(false);
    }
  }, []);

  // Add this useEffect after the authentication useEffect
  useEffect(() => {
    checkWalletAvailability();
  }, [checkWalletAvailability]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Format countdown time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Wallet address has been copied to your clipboard.",
    });
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/user/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: parseInt(credits) }),
      });
      if (!res.ok) throw new Error("Failed to add credits");
      toast({
        title: "Payment successful",
        description: `${credits} API credits have been added to your account.`,
      });
      router.push(ROUTES.DASHBOARD.DEVELOPER);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add credits. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    toast({
      title: "Payment cancelled",
      description: "Your BLC payment has been cancelled.",
    });
    router.push(ROUTES.DASHBOARD.DEVELOPER);
  };

  if (isLoading) {
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
        <h2 className="text-2xl font-bold">BLC Payment Gateway</h2>
        <p className="text-gray-400 mt-1">
          Complete your purchase of API credits using BLOCKMEC tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-[#231c35] border-[#2a2139] text-white">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription className="text-gray-400">
                Send BLC tokens to the address below to complete your purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-[#1a1625] rounded-lg flex flex-col items-center justify-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <QrCode className="h-48 w-48 text-black" />
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Scan QR code or send manually to:
                </p>
                <div className="relative w-full">
                  <Input
                    value={walletAddress}
                    readOnly
                    className="pr-10 bg-[#2a2139] border-0 text-white focus-visible:ring-purple-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(walletAddress)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy address</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount to Send</Label>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#2a2139] p-3 rounded-md font-medium text-lg flex-1 text-center">
                      {Number.parseFloat(amount).toFixed(2)} BLC
                    </div>
                    <div className="bg-[#2a2139] p-3 rounded-md text-gray-400 text-sm flex items-center justify-center">
                      ≈ ${(Number.parseFloat(amount) * 20).toFixed(2)} USD
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Credits to Receive</Label>
                  <div className="bg-[#2a2139] p-3 rounded-md font-medium text-lg text-center">
                    {Number.parseInt(credits).toLocaleString()} Credits
                  </div>
                </div>
              </div>

              <div className="bg-[#2a2139] p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Payment Expires In:</h3>
                  <div className="text-xl font-bold text-yellow-400">
                    {formatTime(countdown)}
                  </div>
                </div>
                <div className="w-full bg-[#1a1625] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full"
                    style={{ width: `${(countdown / 900) * 100}%` }}
                  ></div>
                </div>
              </div>
              {!walletAvailable && (
                <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-md">
                  <p className="text-yellow-400 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    No cryptocurrency wallet detected. For a real transaction,
                    you would need to install MetaMask or another compatible
                    wallet. For this demo, you can proceed without a wallet.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="w-full flex flex-col md:flex-row gap-4">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "I've Sent the BLC"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-[#2a2139] bg-transparent"
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  Cancel Payment
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                For demonstration purposes, you can click "I've Sent the BLC"
                without actually sending any tokens.
              </p>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="bg-[#231c35] border-[#2a2139] text-white sticky top-20">
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">1. Send BLC Tokens</h3>
                <p className="text-sm text-gray-400">
                  Send exactly {Number.parseFloat(amount).toFixed(2)} BLC to the
                  wallet address shown. You can scan the QR code or copy the
                  address.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">2. Confirm Transaction</h3>
                <p className="text-sm text-gray-400">
                  After sending, click the "I've Sent the BLC" button to confirm
                  your payment.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">3. Receive Credits</h3>
                <p className="text-sm text-gray-400">
                  Once your payment is confirmed,{" "}
                  {Number.parseInt(credits).toLocaleString()} API credits will
                  be added to your account.
                </p>
              </div>

              <div className="bg-[#1a1625] p-4 rounded-md mt-4">
                <h3 className="font-medium mb-2">Need Help?</h3>
                <p className="text-sm text-gray-400 mb-4">
                  If you encounter any issues with your payment, please contact
                  our support team.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white bg-transparent"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
