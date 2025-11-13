"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, CameraOff } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
  className?: string;
}

export function QRScanner({ onScan, onError, onClose, className }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanCompleteRef = useRef(false);

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    scanCompleteRef.current = false;

    const startScanning = async () => {
      try {
        const elementId = "qr-reader";
        scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: "environment" }, // Use back camera on mobile
          config,
          (decodedText) => {
            if (!scanCompleteRef.current) {
              scanCompleteRef.current = true;
              onScan(decodedText);
              stopScanning();
            }
          },
          (errorMessage) => {
            // Ignore scanning errors, they're frequent during scanning
            // Only log actual errors that aren't "not found" errors
          }
        );

        setIsScanning(true);
        setError(null);
      } catch (err: any) {
        const errorMsg = err.message || err.toString() || "Failed to start camera";
        setError(errorMsg);
        setIsScanning(false);
        if (onError) {
          onError(errorMsg);
        }
      }
    };

    const stopScanning = async () => {
      if (scanner) {
        try {
          await scanner.stop();
          await scanner.clear();
        } catch (err) {
          // Ignore errors when stopping
        }
        scanner = null;
        scannerRef.current = null;
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
  }, [onScan, onError]);

  const handleClose = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        // Ignore errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    scanCompleteRef.current = false;
    onClose();
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 xs:p-4", className)}>
      <div className="relative bg-background rounded-lg p-4 xs:p-6 max-w-md w-full mx-auto max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 xs:mb-4">
          <h3 className="text-base xs:text-lg font-semibold">Scan QR Code</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 xs:h-9 xs:w-9 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 xs:space-y-4">
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full aspect-square rounded-lg overflow-hidden bg-black"
          />

          {error && (
            <div className="p-2.5 xs:p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs xs:text-sm text-red-800 dark:text-red-200">{error}</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Please ensure camera permissions are granted and try again.
              </p>
            </div>
          )}

          {isScanning && !error && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-xs xs:text-sm text-muted-foreground">
                <Camera className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-pulse" />
                <span>Position QR code within the frame</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 text-sm xs:text-base"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Close Scanner</span>
              <span className="xs:hidden">Close</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

