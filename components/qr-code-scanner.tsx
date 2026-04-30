"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";

interface QRCodeScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRCodeScanner({
  onScanSuccess,
  onScanError,
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  }, [stream]);

  // Continuously scan video frames for QR codes
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      stopCamera();
      onScanSuccess(code.data);
      toast({
        title: "QR Code Scanned",
        description: "QR code detected successfully.",
      });
      return;
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }, [onScanSuccess, stopCamera, toast]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsScanning(true);
    } catch (err) {
      console.error("Camera error:", err);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      onScanError?.("Unable to access camera");
    }
  };

  // Start scanning frames once video is playing
  useEffect(() => {
    if (isScanning) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isScanning, scanFrame]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      URL.revokeObjectURL(url);

      if (code) {
        onScanSuccess(code.data);
        toast({
          title: "QR Code Detected",
          description: "QR code read from image successfully.",
        });
      } else {
        toast({
          title: "No QR Code Found",
          description: "Could not detect a QR code in the uploaded image.",
          variant: "destructive",
        });
        onScanError?.("No QR code found in image");
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast({
        title: "Invalid Image",
        description: "Could not read the uploaded file.",
        variant: "destructive",
      });
    };
    img.src = url;

    // Reset input so the same file can be re-uploaded
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={startCamera} className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Start Camera
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full max-w-md mx-auto rounded-lg"
              autoPlay
              playsInline
              muted
            />
            {/* Hidden canvas used for frame analysis */}
            <canvas ref={canvasRef} className="hidden" />
            {/* Targeting overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg opacity-70" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-400">
            Point the camera at a QR code — it will be detected automatically
          </p>
          <div className="flex justify-center">
            <Button
              onClick={stopCamera}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Stop Camera
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
