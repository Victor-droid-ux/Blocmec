"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, QrCode, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "@/config/endpoints";

export default function QRCodeGenerator() {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [scanLimit, setScanLimit] = useState(100);
  const [enableBlockchain, setEnableBlockchain] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateQR = async () => {
    if (!productName.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINTS.QR.GENERATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productType,
          batchNumber,
          scanLimit,
          enableBlockchain,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!result?.qrImage) return;

    const link = document.createElement("a");
    link.href = result.qrImage;
    link.download = `qr-${productName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='product-name'>Product Name</Label>
            <Input
              id='product-name'
              placeholder='Enter product name'
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor='product-type'>Product Type</Label>
            <Input
              id='product-type'
              placeholder='e.g., Beverage, Electronics'
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor='batch-number'>Batch Number</Label>
            <Input
              id='batch-number'
              placeholder='Enter batch number'
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
          </div>

          <div className='flex items-center space-x-2'>
            <Switch
              id='blockchain'
              checked={enableBlockchain}
              onCheckedChange={setEnableBlockchain}
            />
            <Label htmlFor='blockchain'>Enable Blockchain Verification</Label>
          </div>

          {enableBlockchain && (
            <div>
              <Label htmlFor='scan-limit'>Scan Limit</Label>
              <Input
                id='scan-limit'
                type='number'
                value={scanLimit}
                onChange={(e) => setScanLimit(Number(e.target.value))}
                min='1'
                max='10000'
              />
            </div>
          )}

          <Button
            onClick={generateQR}
            disabled={!productName.trim() || isGenerating}
            className='w-full'
          >
            {isGenerating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Generating...
              </>
            ) : (
              <>
                <QrCode className='mr-2 h-4 w-4' />
                Generate QR Code
              </>
            )}
          </Button>
        </div>

        <div>
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <QrCode className='h-5 w-5' />
                  Generated QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {result.qrImage && (
                  <div className='flex justify-center'>
                    <img
                      src={result.qrImage || "/placeholder.svg"}
                      alt='Generated QR Code'
                      className='w-48 h-48 border rounded'
                    />
                  </div>
                )}

                {result.blockchainEnabled && (
                  <div className='space-y-2 text-sm'>
                    <p>
                      <strong>Token ID:</strong> {result.tokenId}
                    </p>
                    <p>
                      <strong>Verify URL:</strong>
                      <a
                        href={result.verifyUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 hover:underline ml-1'
                      >
                        {result.verifyUrl}
                      </a>
                    </p>
                    <p>
                      <strong>Scan Limit:</strong> {result.scanLimit}
                    </p>
                  </div>
                )}

                <Button onClick={downloadQR} variant='outline' className='w-full'>
                  <Download className='mr-2 h-4 w-4' />
                  Download QR Code
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className='h-full'>
              <CardContent className='flex items-center justify-center h-full min-h-[400px]'>
                <div className='text-center text-gray-500'>
                  <QrCode className='h-16 w-16 mx-auto mb-4 opacity-50' />
                  <p>Generate a QR code to see preview</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
