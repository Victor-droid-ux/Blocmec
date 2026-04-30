"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  XCircle,
  CheckCircle,
  Clock,
  Shield,
  Scan,
  Package,
  RefreshCw,
} from "lucide-react";

interface VerificationData {
  verified: boolean;
  message: string;
  data?: {
    tokenId: string;
    productName: string;
    productType: string;
    scanCount: number;
    scanLimit: number;
    expiresAt: string | null;
    createdAt: string;
    metadata: any;
    issuer: string | null;
    status?: string;
  };
}

export default function VerifyPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  const [result, setResult] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "Verification failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenId) verify();
  }, [tokenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-white">Verifying product...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Verification Failed
            </h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <Button onClick={verify} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) return null;

  const { verified, message, data } = result;

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-purple-400" />
                <div>
                  <CardTitle className="text-white">
                    Product Verification
                  </CardTitle>
                  <p className="text-slate-400 text-sm font-mono">{tokenId}</p>
                </div>
              </div>
              <Badge
                className={
                  verified
                    ? "bg-green-600/20 text-green-400 border-green-600/30"
                    : "bg-red-600/20 text-red-400 border-red-600/30"
                }
              >
                {verified ? "Verified" : "Not Verified"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Result */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            {verified ? (
              <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-4" />
            ) : (
              <XCircle className="h-20 w-20 text-red-400 mx-auto mb-4" />
            )}
            <h2
              className={`text-2xl font-bold mb-2 ${
                verified ? "text-green-400" : "text-red-400"
              }`}
            >
              {verified ? "Product Verified" : "Verification Failed"}
            </h2>
            <p className="text-slate-300">{message}</p>
          </CardContent>
        </Card>

        {/* Product Details */}
        {data && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-400" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Product Name</p>
                  <p className="text-white font-medium">
                    {data.productName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Product Type</p>
                  <p className="text-white font-medium capitalize">
                    {data.productType ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Issuer</p>
                  <p className="text-white font-medium">
                    {data.issuer ?? "Blockmec"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Created</p>
                  <p className="text-white font-medium">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <Scan className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs">Scan Count</p>
                  <p className="text-white font-bold">{data.scanCount}</p>
                </div>
                <div>
                  <Shield className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs">Scan Limit</p>
                  <p className="text-white font-bold">
                    {data.scanLimit === 0 ? "Unlimited" : data.scanLimit}
                  </p>
                </div>
                <div>
                  <Clock className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs">Expires</p>
                  <p className="text-white font-bold">
                    {data.expiresAt
                      ? new Date(data.expiresAt).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Additional metadata */}
              {data.metadata && Object.keys(data.metadata).length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-slate-400 text-sm mb-3">
                    Additional Information
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(data.metadata)
                      .filter(
                        ([k, v]) =>
                          v && !["index", "total", "productImage"].includes(k),
                      )
                      .map(([key, value]) => (
                        <div key={key}>
                          <p className="text-slate-400 text-xs capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-white text-sm">{String(value)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button
            variant="outline"
            onClick={verify}
            className="text-slate-400 border-slate-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Verify Again
          </Button>
        </div>
      </div>
    </div>
  );
}
