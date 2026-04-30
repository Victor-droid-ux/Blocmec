"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeDataUrl } from "@/lib/qr-generator";

interface QRPreviewProps {
  productName: string;
  productType: string;
  batchNumber?: string;
  description?: string;
  additionalFields?: Record<string, string | null>;
  productImage?: string | null;
}

export default function QRPreview({
  productName,
  productType,
  batchNumber,
  description,
  additionalFields,
  productImage,
}: QRPreviewProps) {
  const { toast } = useToast();
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string>("");

  useEffect(() => {
    const generateQRPreview = async () => {
      if (!productName || !productType) {
        setQrImage(null);
        return;
      }

      setIsGenerating(true);

      try {
        // Create product data object
        const productData = {
          productName,
          productType,
          batchNumber: batchNumber || "DEMO-BATCH",
          description: description || "No description provided",
          timestamp: Date.now(),
          additionalFields: additionalFields || {},
          productImage: productImage || null,
        };

        // Create verification URL
        const encodedData = encodeURIComponent(JSON.stringify(productData));
        const verUrl = `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/verification-results?data=${encodedData}&verified=true&message=Successfully verified product`;
        setVerificationUrl(verUrl);

        // Generate QR code containing the verification URL
        const qrImageDataUrl = await generateQRCodeDataUrl(verUrl, {
          width: 300,
          margin: 2,
        });

        setQrImage(qrImageDataUrl);
      } catch (error) {
        console.error("Error generating QR preview:", error);
        toast({
          title: "Error",
          description: "Failed to generate QR code preview",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRPreview();
  }, [
    productName,
    productType,
    batchNumber,
    description,
    additionalFields,
    productImage,
    toast,
  ]);

  const handleDownloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `qr-${productName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded",
      description: "QR code has been downloaded",
    });
  };

  const handleCopyUrl = () => {
    if (!verificationUrl) return;

    navigator.clipboard.writeText(verificationUrl).then(() => {
      toast({
        title: "Copied",
        description: "Verification URL copied to clipboard",
      });
    });
  };

  if (!productName || !productType) {
    return (
      <Card className='bg-[#1a1625] border-[#3d2d52]'>
        <CardHeader>
          <CardTitle className='text-white'>QR Code Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-40 bg-[#0f0a15] rounded-lg border-2 border-dashed border-[#3d2d52]'>
            <p className='text-gray-400'>Fill in product details to see QR preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-[#1a1625] border-[#3d2d52]'>
      <CardHeader>
        <CardTitle className='text-white'>QR Code Preview</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isGenerating ? (
          <div className='flex items-center justify-center h-40'>
            <Loader2 className='h-8 w-8 animate-spin text-purple-500' />
          </div>
        ) : qrImage ? (
          <>
            <div className='flex justify-center p-4 bg-white rounded-lg'>
              <img
                src={qrImage || "/placeholder.svg"}
                alt='QR Code Preview'
                className='w-64 h-64'
              />
            </div>

            <div className='space-y-2'>
              <p className='text-sm text-gray-400'>
                When scanned, this QR code will link to:
              </p>
              <div className='p-3 bg-[#0f0a15] rounded border border-[#3d2d52] text-xs text-gray-300 break-all'>
                {verificationUrl}
              </div>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={handleDownloadQR}
                className='flex-1 bg-purple-600 hover:bg-purple-700 text-white'
              >
                <Download className='h-4 w-4 mr-2' />
                Download QR
              </Button>
              <Button
                onClick={handleCopyUrl}
                variant='outline'
                className='flex-1 bg-[#0f0a15] border-[#3d2d52] text-white hover:bg-[#231c35]'
              >
                <Copy className='h-4 w-4 mr-2' />
                Copy URL
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
