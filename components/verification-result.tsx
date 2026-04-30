"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  QrCode,
  Clock,
  AlertTriangle,
  Calendar,
  Factory,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VerifyProductPopup } from "@/components/verify-product-popup";

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
  expiryDate?: number;
  maxScans?: number;
  currentScans?: number;
  manufactureDate?: number;
  batchNumber?: string;
  manufacturer?: string;
  origin?: string;
  category?: string;
  weight?: string;
  ingredients?: string[];
}

interface VerificationResultProps {
  data: VerificationData | null;
  className?: string;
}

type VerificationStatus =
  | "unverified"
  | "verified"
  | "expired"
  | "scan_limit_exceeded";

export default function VerificationResult({
  data,
  className,
}: VerificationResultProps) {
  const [copied, setCopied] = useState(false);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("unverified");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Hash copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatHash = (hash: string) => {
    if (!hash) return "N/A";
    if (hash.length > 12) {
      return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
    }
    return hash;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewOnBlockchain = () => {
    if (data?.transactionId && data.transactionId !== "N/A") {
      window.open(`https://etherscan.io/tx/${data.transactionId}`, "_blank");
    } else {
      toast({
        title: "No Transaction",
        description: "No blockchain transaction available to view",
        variant: "destructive",
      });
    }
  };
  const handleVerifyNow = async () => {
    if (!data) return;
    setIsVerifying(true);

    try {
      const res = await fetch("/api/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: data.hash }),
      });

      const result = await res.json();

      if (!result.verified) {
        if (result.data?.status === "expired") {
          setVerificationStatus("expired");
          toast({
            title: "Product Expired",
            description: "This product has expired.",
            variant: "destructive",
          });
        } else {
          setVerificationStatus("scan_limit_exceeded");
          toast({
            title: "Not Verified",
            description: result.message,
            variant: "destructive",
          });
        }
      } else {
        setVerificationStatus("verified");
        toast({
          title: "Product Verified!",
          description: "This product is authentic and valid.",
        });
      }
    } catch (err) {
      toast({
        title: "Verification Error",
        description: "Failed to verify. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return {
          className: "bg-green-600/20 text-green-400 border-green-600/50",
          icon: <CheckCircle className="h-5 w-5 mr-2" />,
          text: "Verified product",
        };
      case "expired":
        return {
          className: "bg-orange-600/20 text-orange-400 border-orange-600/50",
          icon: <Clock className="h-5 w-5 mr-2" />,
          text: "Product expired",
        };
      case "scan_limit_exceeded":
        return {
          className: "bg-red-600/20 text-red-400 border-red-600/50",
          icon: <AlertTriangle className="h-5 w-5 mr-2" />,
          text: "Scan limit exceeded",
        };
      default:
        return {
          className: "bg-gray-600/20 text-gray-400 border-gray-600/50",
          icon: null,
          text: "",
        };
    }
  };

  const getVerifyButtonText = () => {
    switch (verificationStatus) {
      case "verified":
        return "Verify Again";
      case "expired":
        return "Check Status";
      case "scan_limit_exceeded":
        return "Check Status";
      default:
        return "Verify Now";
    }
  };

  // Handle null or undefined data
  if (!data) {
    return (
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-slate-400 text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No Verification Data
            </h2>
            <p className="text-slate-300">
              No verification results available to display.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provide default values for all properties with realistic product data
  const safeData = {
    verified: data.verified ?? false,
    productName: data.productName || "Coca-Cola Classic",
    transactionId: data.transactionId || "0x7a8b9c1d2e3f4g5h",
    blockConfirmations: data.blockConfirmations || 1247,
    scanCount: data.scanCount || 89,
    userProducts: data.userProducts || 2847,
    hash: data.hash || "blockmec-cc-2024-001",
    productImage: data.productImage || "/images/coca-cola-bottle-new.jpg",
    timestamp: data.timestamp || Date.now(),
    message: data.message || "No message available",
    type: data.type || "beverage",
    expiryDate: data.expiryDate || Date.now() + 180 * 24 * 60 * 60 * 1000, // 6 months from now
    maxScans: data.maxScans || 100,
    currentScans: data.currentScans || 23,
    manufactureDate:
      data.manufactureDate || Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    batchNumber: data.batchNumber || "CC2024-B001-LOT789",
    manufacturer: data.manufacturer || "The Coca-Cola Company",
    origin: data.origin || "Atlanta, Georgia, USA",
    category: data.category || "Carbonated Soft Drink",
    weight: data.weight || "330ml / 11.2 fl oz",
    ingredients: data.ingredients || [
      "Carbonated Water",
      "High Fructose Corn Syrup",
      "Caramel Color",
      "Phosphoric Acid",
      "Natural Flavors",
      "Caffeine",
    ],
  };

  const badgeConfig = getVerificationBadge();

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-4", className)}>
      {/* Main Product Card */}
      <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
        <CardContent className="p-8">
          {/* Product Name */}
          <h1 className="text-5xl font-bold text-white mb-6">
            {safeData.productName}
          </h1>

          {/* Dynamic Verification Badge */}
          <div className="mb-8">
            <Badge
              className={cn(
                "px-4 py-2 text-base font-medium rounded-full border-2 transition-all duration-300",
                badgeConfig.className,
              )}
            >
              {badgeConfig.icon}
              {badgeConfig.text}
            </Badge>
          </div>

          {/* Hash Information */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 text-slate-400">
              <span className="text-lg">Hash :</span>
              <code className="text-slate-300 font-mono text-lg">
                {formatHash(safeData.hash)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(safeData.hash)}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  copied
                    ? "text-green-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-700",
                )}
                disabled={!safeData.hash || safeData.hash === "N/A"}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product Image Container */}
          <div className="bg-white rounded-3xl p-8 flex items-center justify-center mb-8">
            <img
              src="/images/coca-cola-bottle-new.jpg"
              alt={safeData.productName}
              className="max-h-96 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "/placeholder.svg?height=400&width=300&text=Product+Image";
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleVerifyNow}
              disabled={isVerifying}
              className={cn(
                "flex-1 py-3 text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105",
                verificationStatus === "verified"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : verificationStatus === "expired"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : verificationStatus === "scan_limit_exceeded"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white",
              )}
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5 mr-2" />
                  {getVerifyButtonText()}
                </>
              )}
            </Button>

            <Button
              onClick={handleViewOnBlockchain}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent py-3 text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              View on Blockchain
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Information Cards - Replacing the metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manufacturing Information */}
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Factory className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-white font-semibold">Manufacturing Info</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Manufacturer:</span>
                <span className="text-white font-medium">
                  {safeData.manufacturer}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batch Number:</span>
                <span className="text-white font-medium">
                  {safeData.batchNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Origin:</span>
                <span className="text-white font-medium">
                  {safeData.origin}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Manufacture Date:</span>
                <span className="text-white font-medium">
                  {formatDate(safeData.manufactureDate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-white font-semibold">Product Details</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="text-white font-medium">
                  {safeData.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Weight/Volume:</span>
                <span className="text-white font-medium">
                  {safeData.weight}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiry Date:</span>
                <span className="text-white font-medium">
                  {formatDate(safeData.expiryDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scans:</span>
                <span className="text-white font-medium">
                  {safeData.currentScans}/{safeData.maxScans}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Information */}
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <QrCode className="h-5 w-5 text-purple-400 mr-2" />
              <h3 className="text-white font-semibold">Blockchain Data</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-white font-medium font-mono">
                  {safeData.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confirmations:</span>
                <span className="text-white font-medium">
                  {safeData.blockConfirmations.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Scans:</span>
                <span className="text-white font-medium">
                  {safeData.scanCount} times
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network Products:</span>
                <span className="text-white font-medium">
                  {safeData.userProducts.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-orange-400 mr-2" />
              <h3 className="text-white font-semibold">Ingredients</h3>
            </div>
            <div className="space-y-2 text-sm">
              {safeData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">{ingredient}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Status Information */}
      {verificationStatus !== "unverified" && (
        <Card className="bg-slate-700/50 border-slate-600/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-white font-semibold">Verification Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Status:</span>
                <span
                  className={cn(
                    "ml-2 font-medium",
                    verificationStatus === "verified"
                      ? "text-green-400"
                      : verificationStatus === "expired"
                        ? "text-orange-400"
                        : "text-red-400",
                  )}
                >
                  {verificationStatus === "verified"
                    ? "Authentic"
                    : verificationStatus === "expired"
                      ? "Expired"
                      : "Scan Limit Exceeded"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Verified On:</span>
                <span className="text-white ml-2">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verify Product Popup */}
      <VerifyProductPopup
        isOpen={showVerifyPopup}
        onClose={() => setShowVerifyPopup(false)}
      />
    </div>
  );
}
