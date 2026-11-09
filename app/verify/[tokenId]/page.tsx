"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
import { getProductCategory } from "@/lib/product-categories";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenId = params.tokenId as string;
  const [result, setResult] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

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

      if (data.data?.productType) {
        const category = getProductCategory(data.data.productType);
        setShouldRedirect(true);
        setTimeout(() => {
          router.push(`/verification-results/${category.resultSlug}?tokenId=${tokenId}`);
        }, 100);
      }
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenId) verify();
  }, [tokenId]);

  if (loading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center p-4">
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
  const productType = data?.productType || "default";
  const category = getProductCategory(productType);

  return (
    <div className="min-h-screen p-4 py-12" style={{ backgroundColor: category.accentSoft }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/5 backdrop-blur border-white/10 shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg border" style={{ backgroundColor: category.accent + "20", borderColor: category.accent + "40" }}>
                  <Shield className="h-8 w-8" style={{ color: category.accent }} />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl">
                    Product Verification
                  </CardTitle>
                  <p className="text-slate-300 text-sm font-mono mt-1">
                    ID: {tokenId}
                  </p>
                </div>
              </div>
              <Badge
                className={`px-4 py-2 text-base font-semibold ${
                  verified
                    ? "bg-green-600/20 text-green-400 border-green-600/30 border"
                    : "bg-red-600/20 text-red-400 border-red-600/30 border"
                }`}
              >
                {verified ? "✓ Verified" : "✗ Not Verified"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Brand Logo (if available) */}
        {data && data.metadata?.brandLogo && (
          <Card className="bg-white/5 backdrop-blur border-white/10 shadow-2xl">
            <CardContent className="p-8 flex justify-center">
              <img
                src={data.metadata.brandLogo}
                alt="Brand Logo"
                className="max-h-32 w-auto"
              />
            </CardContent>
          </Card>
        )}

        {/* Result */}
        <Card className="bg-white/5 backdrop-blur border-white/10 shadow-2xl">
          <CardContent className="p-12 text-center">
            {verified ? (
              <CheckCircle className="h-24 w-24 text-green-400 mx-auto mb-6 drop-shadow-lg" />
            ) : (
              <XCircle className="h-24 w-24 text-red-400 mx-auto mb-6 drop-shadow-lg" />
            )}
            <h2
              className={`text-3xl font-bold mb-3 ${
                verified ? "text-green-400" : "text-red-400"
              }`}
            >
              {verified ? "Product Verified ✓" : "Verification Failed ✗"}
            </h2>
            <p className="text-slate-200 text-lg">{message}</p>
          </CardContent>
        </Card>

        {/* Product Image (if available) */}
        {data && data.metadata?.productImage && (
          <Card className="bg-white/5 backdrop-blur border-white/10 shadow-2xl">
            <CardContent className="p-8 text-center">
              <img
                src={data.metadata.productImage}
                alt={data.productName}
                className="max-w-xs mx-auto h-auto rounded-lg shadow-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Product Details */}
        {data && (
          <Card className="bg-white/5 backdrop-blur border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-6 w-6 text-purple-400" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
                    Product Name
                  </p>
                  <p className="text-white font-medium text-lg">
                    {data.productName ?? "—"}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
                    Product Type
                  </p>
                  <p className="text-white font-medium text-lg capitalize">
                    {data.productType?.replace("-", " ") ?? "—"}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
                    Issuer
                  </p>
                  <p className="text-white font-medium text-lg">
                    {data.issuer ?? "Blockmec"}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
                    Created
                  </p>
                  <p className="text-white font-medium text-lg">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 p-6 rounded-lg border border-blue-500/20 text-center">
                  <Scan className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">
                    Scan Count
                  </p>
                  <p className="text-white font-bold text-2xl">{data.scanCount}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 p-6 rounded-lg border border-purple-500/20 text-center">
                  <Shield className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">
                    Scan Limit
                  </p>
                  <p className="text-white font-bold text-2xl">
                    {data.scanLimit === 0 ? "∞" : data.scanLimit}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 p-6 rounded-lg border border-emerald-500/20 text-center">
                  <Clock className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">
                    Expires
                  </p>
                  <p className="text-white font-bold text-2xl">
                    {data.expiresAt
                      ? new Date(data.expiresAt).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Additional metadata */}
              {data.metadata && Object.keys(data.metadata).length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <p className="text-slate-300 text-sm font-semibold mb-4 uppercase tracking-widest">
                    Additional Information
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(data.metadata)
                      .filter(
                        ([k, v]) =>
                          v &&
                          ![
                            "index",
                            "total",
                            "productImage",
                            "verification_domain",
                          ].includes(k),
                      )
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-white/5 p-3 rounded border border-white/10"
                        >
                          <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-white text-sm break-words">
                            {String(value)}
                          </p>
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
            className="text-slate-200 border-slate-500 hover:bg-white/10 px-6 py-2 text-base"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Verify Again
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-slate-400 text-sm">
            Powered by{" "}
            <span className="font-semibold text-white">Blockmec</span> • Secure
            Product Verification
          </p>
        </div>
      </div>
    </div>
  );
}
