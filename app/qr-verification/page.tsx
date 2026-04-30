"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, QrCode, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import QRCodeScanner from "@/components/qr-code-scanner";
import { API_ENDPOINTS } from "@/config/endpoints";

interface VerificationResult {
  success: boolean;
  verified: boolean;
  productName: string;
  message: string;
  data?: any;
}

export default function QRVerificationPage() {
  const [qrData, setQrData] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();

  const handleVerifyQR = async (data?: string) => {
    const verificationData = data || qrData;

    if (!verificationData.trim()) {
      setError("Please enter QR code data or scan a QR code");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(API_ENDPOINTS.QR.VERIFY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrData: verificationData }),
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got: ${text.substring(0, 100)}...`);
      }

      const result = await response.json();

      if (result.success) {
        setResult(result);

        // Navigate to results page with data
        const params = new URLSearchParams({
          data: encodeURIComponent(
            JSON.stringify({
              productName: result.productName,
              id: result.data?.id || "demo-" + Date.now(),
              timestamp: Date.now(),
              type: "verification",
            }),
          ),
          verified: result.verified.toString(),
          message: result.message,
        });

        router.push(`/verification-results?${params.toString()}`);
      } else {
        setError(result.message || "Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScanSuccess = (data: string) => {
    setQrData(data);
    setShowScanner(false);
    handleVerifyQR(data);
  };

  const handleScanError = (error: string) => {
    setError(`Scanner error: ${error}`);
    setShowScanner(false);
  };

  return (
    <div className='min-h-screen bg-slate-900 p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-white mb-4'>QR Code Verification</h1>
          <p className='text-slate-300 text-lg'>
            Verify product authenticity using blockchain technology
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Manual Input */}
          <Card className='bg-slate-800/50 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center'>
                <QrCode className='h-5 w-5 mr-2' />
                Manual Verification
              </CardTitle>
              <CardDescription className='text-slate-400'>
                Enter QR code data manually for verification
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='qr-data' className='text-white'>
                  QR Code Data
                </Label>
                <Input
                  id='qr-data'
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder='Enter QR code data...'
                  className='bg-slate-700 border-slate-600 text-white'
                />
              </div>

              <Button
                onClick={() => handleVerifyQR()}
                disabled={isVerifying || !qrData.trim()}
                className='w-full'
              >
                {isVerifying ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Verify Product
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* QR Scanner */}
          <Card className='bg-slate-800/50 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center'>
                <QrCode className='h-5 w-5 mr-2' />
                QR Code Scanner
              </CardTitle>
              <CardDescription className='text-slate-400'>
                Use your camera to scan QR codes directly
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {!showScanner ? (
                <Button
                  onClick={() => setShowScanner(true)}
                  variant='outline'
                  className='w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                >
                  <QrCode className='h-4 w-4 mr-2' />
                  Start Camera Scanner
                </Button>
              ) : (
                <div className='space-y-4'>
                  <QRCodeScanner
                    onScanSuccess={handleScanSuccess}
                    onScanError={handleScanError}
                  />
                  <Button
                    onClick={() => setShowScanner(false)}
                    variant='outline'
                    className='w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                  >
                    Stop Scanner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className='mt-6 bg-red-950/20 border-red-800'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription className='text-red-300'>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <Alert className='mt-6 bg-green-950/20 border-green-800'>
            <CheckCircle className='h-4 w-4' />
            <AlertDescription className='text-green-300'>
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Demo Instructions */}
        <Card className='mt-8 bg-slate-800/30 border-slate-700'>
          <CardHeader>
            <CardTitle className='text-white text-lg'>Demo Instructions</CardTitle>
          </CardHeader>
          <CardContent className='text-slate-300'>
            <p className='mb-2'>Try these demo QR codes:</p>
            <ul className='list-disc list-inside space-y-1 text-sm'>
              <li>
                <code className='bg-slate-700 px-2 py-1 rounded'>
                  {"blockmec-demo-coca-cola"}
                </code>{" "}
                - Valid product
              </li>
              <li>
                <code className='bg-slate-700 px-2 py-1 rounded'>
                  {"blockmec-demo-invalid"}
                </code>{" "}
                - Invalid product
              </li>
              <li>
                <code className='bg-slate-700 px-2 py-1 rounded'>{"any-text"}</code> -
                Test with any text
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
