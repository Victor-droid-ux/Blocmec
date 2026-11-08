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
  const resultId = useMemo(() => searchParams?.get("id"), [searchParams]);

  useEffect(() => {
    let mounted = true;

    const fetchVerificationData = async () => {
      try {
        if (!resultId) {
          if (mounted) {
            setVerificationData(null);
            setIsLoading(false);
          }
          return;
        }

        // Fetch verification result from backend - never trust client-side URL params
        const response = await fetch(`/api/verify-qr/result?id=${encodeURIComponent(resultId)}`);
        
        if (!response.ok) {
          if (mounted) {
            setError("Unable to retrieve verification results");
            setIsLoading(false);
          }
          return;
        }

        const data = await response.json();
        
        if (mounted) {
          const result: VerificationData = {
            verified: data.verified === true,
            productName: data.productName || "Unknown Product",
            transactionId: data.transactionId || data.id || "N/A",
            blockConfirmations: data.blockConfirmations ?? 0,
            scanCount: data.scanCount ?? 0,
            userProducts: data.userProducts ?? 0,
            hash: data.hash || "",
            productImage: data.productImage,
            timestamp: data.timestamp || Date.now(),
            message: data.message || "Verification complete",
            type: data.type || "standard",
          };
          setVerificationData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to load verification data");
          setIsLoading(false);
        }
      }
    };

    fetchVerificationData();

    return () => {
      mounted = false;
    };
  }, [resultId]);

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
