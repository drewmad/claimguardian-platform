/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import { X, Camera, RotateCcw } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import { logger } from "@/lib/logger/production-logger";

import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({ onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    try {
      setError(null);
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      logger.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture image");
      setIsCapturing(false);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
        } else {
          setError("Failed to capture image");
        }
        setIsCapturing(false);
      },
      "image/jpeg",
      0.9,
    );
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Camera Capture</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-video bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Capture overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 p-6 bg-gray-800">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCamera}
            disabled={!stream || isCapturing}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Flip Camera
          </Button>

          <Button
            onClick={captureImage}
            disabled={!stream || error !== null || isCapturing}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            <Camera className="h-5 w-5 mr-2" />
            {isCapturing ? "Capturing..." : "Capture"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            Cancel
          </Button>
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
