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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Lock, Loader2 } from "lucide-react";
import { ROUTES } from "@/config/routes";

export default function CardPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get amount and credits from URL parameters
  const amount = searchParams.get("amount") || "50.00";
  const credits = searchParams.get("credits") || "1000";

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");

  // Check if user is authenticated
  // useEffect(() => {
  //   const isAuthenticated = localStorage.getItem("isAuthenticated")
  //   if (!isAuthenticated) {
  //     router.push("/")
  //   } else {
  //     setIsLoading(false)
  //   }
  // }, [router])

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted.substring(0, 19)); // Limit to 16 digits + 3 spaces
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (cardNumber.replace(/\s/g, "").length < 16) {
      toast({
        title: "Invalid card number",
        description: "Please enter a valid 16-digit card number.",
        variant: "destructive",
      });
      return;
    }

    if (!cardName) {
      toast({
        title: "Name required",
        description: "Please enter the name on your card.",
        variant: "destructive",
      });
      return;
    }

    if (!expiryMonth || !expiryYear) {
      toast({
        title: "Expiry date required",
        description: "Please select your card's expiry date.",
        variant: "destructive",
      });
      return;
    }

    if (cvv.length < 3) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid CVV code.",
        variant: "destructive",
      });
      return;
    }

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
      description: "Payment processed but failed to add credits. Contact support.",
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};

const handleCancel = () => {
    toast({
      title: "Payment cancelled",
      description: "Your card payment has been cancelled.",
    });
    router.push(ROUTES.DASHBOARD.DEVELOPER);
  };

  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-[#1a1625]'>
        <div className='h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-purple-500'></div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className='mb-6'>
        <Button
          variant='ghost'
          className='mb-4'
          onClick={() => router.push(ROUTES.DASHBOARD.DEVELOPER)}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Developer Dashboard
        </Button>
        <h2 className='text-2xl font-bold'>Card Payment Gateway</h2>
        <p className='text-gray-400 mt-1'>
          Complete your purchase of API credits using your credit or debit card
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='md:col-span-2'>
          <Card className='bg-[#231c35] border-[#2a2139] text-white'>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription className='text-gray-400'>
                Enter your card details to complete your purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='card-number'>Card Number</Label>
                    <div className='relative'>
                      <Input
                        id='card-number'
                        placeholder='1234 5678 9012 3456'
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className='pl-10 bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                        maxLength={19}
                      />
                      <CreditCard className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                      <div className='absolute right-3 top-1/2 -translate-y-1/2 flex gap-1'>
                        <div className='w-8 h-5 bg-gray-700 rounded'></div>
                        <div className='w-8 h-5 bg-gray-700 rounded'></div>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='card-name'>Name on Card</Label>
                    <Input
                      id='card-name'
                      placeholder='John Smith'
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Expiry Date</Label>
                      <div className='flex gap-2'>
                        <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                          <SelectTrigger className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'>
                            <SelectValue placeholder='MM' />
                          </SelectTrigger>
                          <SelectContent className='bg-[#231c35] border-[#2a2139] text-white'>
                            {Array.from({ length: 12 }, (_, i) => {
                              const month = (i + 1).toString().padStart(2, "0");
                              return (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        <Select value={expiryYear} onValueChange={setExpiryYear}>
                          <SelectTrigger className='bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'>
                            <SelectValue placeholder='YY' />
                          </SelectTrigger>
                          <SelectContent className='bg-[#231c35] border-[#2a2139] text-white'>
                            {Array.from({ length: 10 }, (_, i) => {
                              const year = (new Date().getFullYear() + i)
                                .toString()
                                .slice(-2);
                              return (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='cvv'>CVV</Label>
                      <div className='relative'>
                        <Input
                          id='cvv'
                          placeholder='123'
                          value={cvv}
                          onChange={(e) =>
                            setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))
                          }
                          className='pl-10 bg-[#1a1625] border-0 text-white focus-visible:ring-purple-500'
                          maxLength={4}
                        />
                        <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-[#1a1625] p-4 rounded-md'>
                  <div className='flex justify-between mb-2'>
                    <span className='text-gray-400'>Subtotal:</span>
                    <span>${Number.parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between mb-2'>
                    <span className='text-gray-400'>Processing Fee:</span>
                    <span>$0.00</span>
                  </div>
                  <div className='flex justify-between pt-2 border-t border-[#2a2139]'>
                    <span className='font-medium'>Total:</span>
                    <span className='font-bold'>
                      ${Number.parseFloat(amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className='flex flex-col md:flex-row gap-4'>
                  <Button
                    type='submit'
                    className='flex-1 bg-purple-600 hover:bg-purple-700'
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className='mr-2 h-4 w-4' />
                        Pay ${Number.parseFloat(amount).toFixed(2)}
                      </>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-1 border-gray-600 text-gray-300 hover:bg-[#2a2139]'
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
          <Card className='bg-[#231c35] border-[#2a2139] text-white sticky top-20'>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='bg-[#1a1625] p-4 rounded-md'>
                <div className='flex justify-between mb-2'>
                  <span className='text-gray-400'>API Credits:</span>
                  <span>{Number.parseInt(credits).toLocaleString()}</span>
                </div>
                <div className='flex justify-between mb-2'>
                  <span className='text-gray-400'>Price per Credit:</span>
                  <span>
                    ${(Number.parseFloat(amount) / Number.parseInt(credits)).toFixed(4)}
                  </span>
                </div>
                <div className='flex justify-between pt-2 border-t border-[#2a2139]'>
                  <span className='font-medium'>Total Amount:</span>
                  <span className='font-bold'>
                    ${Number.parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className='space-y-2'>
                <h3 className='font-medium'>What You'll Get</h3>
                <ul className='space-y-2 text-sm text-gray-400'>
                  <li className='flex items-start gap-2'>
                    <div className='mt-1 min-w-4'>•</div>
                    <p>
                      {Number.parseInt(credits).toLocaleString()} API credits added to
                      your account
                    </p>
                  </li>
                  <li className='flex items-start gap-2'>
                    <div className='mt-1 min-w-4'>•</div>
                    <p>Immediate access to all API features</p>
                  </li>
                  <li className='flex items-start gap-2'>
                    <div className='mt-1 min-w-4'>•</div>
                    <p>Credits never expire</p>
                  </li>
                </ul>
              </div>

              <div className='flex items-center justify-center gap-2 pt-4'>
                <div className='w-8 h-5 bg-gray-700 rounded'></div>
                <div className='w-8 h-5 bg-gray-700 rounded'></div>
                <div className='w-8 h-5 bg-gray-700 rounded'></div>
                <div className='w-8 h-5 bg-gray-700 rounded'></div>
              </div>
              <p className='text-xs text-gray-400 text-center'>
                All payments are secure and encrypted. We accept all major credit cards.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
