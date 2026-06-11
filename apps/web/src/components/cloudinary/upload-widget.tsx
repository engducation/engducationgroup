"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UploadWidgetResult {
  publicId: string;
  url: string;
  duration?: number;
}

export interface CloudinaryUploadWidgetProps {
  onSuccess: (result: UploadWidgetResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  buttonText?: string;
}

export function CloudinaryUploadWidget({
  onSuccess,
  onError,
  disabled = false,
  className = "",
  buttonText = "Tải video lên",
}: CloudinaryUploadWidgetProps) {
  const widgetRef = useRef<unknown>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("cloudinary" in window && typeof window.cloudinary?.createUploadWidget === "function") {
      setIsReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="cloudinary"]');
    if (existingScript) {
      const checkReady = setInterval(() => {
        if (typeof window.cloudinary?.createUploadWidget === "function") {
          setIsReady(true);
          clearInterval(checkReady);
        }
      }, 100);
      return () => clearInterval(checkReady);
    }

    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    document.body.appendChild(script);

    const checkReady = setInterval(() => {
      if (typeof window.cloudinary?.createUploadWidget === "function") {
        setIsReady(true);
        clearInterval(checkReady);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkReady);
      setError("Không thể tải Cloudinary Upload Widget");
    }, 15000);

    script.onerror = () => {
      clearInterval(checkReady);
      clearTimeout(timeout);
      setError("Không thể tải script Cloudinary");
    };

    return () => {
      clearInterval(checkReady);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!isReady || widgetRef.current || typeof window === "undefined" || !window.cloudinary) {
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

    if (!cloudName) {
      setError("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME chưa được cấu hình");
      return;
    }

    try {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset: uploadPreset || undefined,
          sources: ["local", "camera", "url"],
          multiple: false,
          resourceType: "video",
          clientAllowedFormats: ["video"],
          maxFileSize: 500 * 1024 * 1024,
          cropping: false,
          showAdvancedOptions: false,
          showCompletedButton: true,
          showUploadSteps: true,
        },
        (error: unknown, result: unknown) => {
          if (error) {
            let errorMsg = "Upload thất bại";

            if (typeof error === "object" && error !== null) {
              const errObj = error as Record<string, unknown>;
              // Try to extract meaningful error message
              if (errObj.message) {
                errorMsg = String(errObj.message);
              } else if (errObj.description) {
                errorMsg = String(errObj.description);
              } else if (errObj.error) {
                errorMsg = String(errObj.error);
              } else {
                // Log full error for debugging
                console.error("Cloudinary upload error details:", JSON.stringify(error, null, 2));
                errorMsg = `Upload thất bại: ${JSON.stringify(error)}`;
              }
            } else if (typeof error === "string") {
              errorMsg = error;
            }

            console.error("Cloudinary upload error:", errorMsg);
            onError?.(errorMsg);
            setError(errorMsg);
          }

          if (result && typeof result === "object" && "event" in result) {
            const event = (result as { event: string }).event;
            if (event === "success") {
              const info = result as unknown as { info: { public_id: string; secure_url: string; duration?: number } };
              onSuccess({
                publicId: info.info.public_id,
                url: info.info.secure_url,
                duration: info.info.duration ? Math.round(info.info.duration) : undefined,
              });
            }
          }
        }
      );
    } catch (err) {
      console.error("Failed to create upload widget:", err);
      setError("Không thể tạo Upload Widget");
    }
  }, [isReady, onSuccess, onError]);

  const handleClick = useCallback(() => {
    if (!isReady || !widgetRef.current) {
      setError("Widget chưa sẵn sàng");
      return;
    }
    try {
      (widgetRef.current as { open: () => void }).open();
      setError(null);
    } catch (err) {
      console.error("Failed to open widget:", err);
      setError("Không thể mở Upload Widget");
    }
  }, [isReady]);

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-500 text-sm ${className}`}>
        <AlertCircle className="size-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <Button type="button" variant="outline" disabled={disabled || !isReady} onClick={handleClick} className={className}>
      {!isReady ? (
        <>
          <Loader2 className="size-4 mr-2 animate-spin" />
          Đang tải...
        </>
      ) : (
        <>
          <Upload className="size-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: unknown) => void
      ) => unknown;
    };
  }
}
