"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Camera, Upload, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface VerifyProductPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerifyProductPopup({
  isOpen,
  onClose,
}: VerifyProductPopupProps) {
  const [qrInput, setQrInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleVerify = async (input?: string) => {
    const tokenOrData = input ?? qrInput;
    if (!tokenOrData.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a token or QR data.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: tokenOrData, qrData: tokenOrData }),
      });

      const data = await res.json();

      if (data.verified) {
        router.push(`/verify/${data.data?.tokenId ?? tokenOrData}`);
        onClose();
        toast({
          title: "Verified!",
          description: "Product verified successfully.",
        });
      } else {
        toast({
          title: "Not Verified",
          description: data.message ?? "Could not verify this product.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Verification failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scan className="h-6 w-6 text-blue-400" />
            Verify Product
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger
              value="manual"
              className="data-[state=active]:bg-slate-700"
            >
              Manual
            </TabsTrigger>
            <TabsTrigger
              value="camera"
              className="data-[state=active]:bg-slate-700"
            >
              Camera
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-slate-700"
            >
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-input">Enter Token ID or QR Data</Label>
              <Input
                id="qr-input"
                placeholder="e.g. BM-1234567890-ABCDEF"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <Button
              onClick={() => handleVerify()}
              disabled={isVerifying || !qrInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Verify Product
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <div className="text-center py-8">
              <Camera className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Camera scanning</p>
              <p className="text-sm text-slate-500">
                Coming in a future update
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="text-center py-8">
              <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Upload QR code image</p>
              <p className="text-sm text-slate-500">
                Coming in a future update
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
