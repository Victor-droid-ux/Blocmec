"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import VerificationResult from "@/components/verification-result";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface VerificationData {
  verified: boolean;
  productName: string;
  transactionId: string;
  blockConfirmations: number;
  scanCount: number;
  userProducts: number;
  hash: string;
  productImage?: string;
  timestamp: number;
  message: string;
  type?: string;
}

export default function VerificationResultsPage() {
  const searchParams = useSearchParams();
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize search params to prevent infinite re-renders
  const qrData = useMemo(() => searchParams?.get("data"), [searchParams]);
  const verified = useMemo(() => searchParams?.get("verified"), [searchParams]);
  const message = useMemo(() => searchParams?.get("message"), [searchParams]);

  useEffect(() => {
    let mounted = true;

    const processVerificationData = () => {
      try {
        if (qrData) {
          const parsedData = JSON.parse(decodeURIComponent(qrData));
          const result: VerificationData = {
            verified: verified === "true",
            productName:
              parsedData.productName ||
              parsedData.data?.productName ||
              "Unknown Product",
            transactionId: parsedData.transactionId || parsedData.id || "N/A",
            blockConfirmations: 0,
            scanCount: parsedData.data?.scanCount ?? 0,
            userProducts: 0,
            hash: parsedData.tokenId || parsedData.id || parsedData.hash || "",
            productImage: parsedData.productImage ?? undefined,
            timestamp: parsedData.timestamp || Date.now(),
            message: message || parsedData.message || "Verification complete",
            type: parsedData.productType || parsedData.type || "standard",
          };
          if (mounted) {
            setVerificationData(result);
            setIsLoading(false);
          }
        } else {
          if (mounted) {
            setVerificationData(null);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (mounted) {
          setError("Invalid verification data");
          setIsLoading(false);
        }
      }
    };

    processVerificationData();

    return () => {
      mounted = false;
    };
  }, [qrData, verified, message]); // Only depend on memoized values

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <CardContent className="flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-white text-lg">
              Loading verification results...
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-red-950/20 border-red-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Error Loading Results
            </h2>
            <p className="text-red-300 mb-6">{error}</p>
            <Link href="/qr-verification">
              <Button variant="outline" className="w-full bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Verification
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-slate-400 text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No Verification Data
            </h2>
            <p className="text-slate-300 mb-6">
              No verification results found to display.
            </p>
            <Link href="/qr-verification">
              <Button variant="outline" className="w-full bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Start Verification
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/qr-verification">
            <Button
              variant="outline"
              className="mb-4 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Verification
            </Button>
          </Link>
        </div>
        <VerificationResult data={verificationData} />
      </div>
    </div>
  );
}
