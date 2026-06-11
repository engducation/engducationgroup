"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export interface ImageUploadResult {
  publicId: string;
  url: string;
}

export interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  disabled = false,
}: ImageUploadFieldProps) {
  const widgetRef = useRef<unknown>(null);
  const [isReady, setIsReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      "cloudinary" in window &&
      typeof window.cloudinary?.createUploadWidget === "function"
    ) {
      setIsReady(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="cloudinary"]'
    );
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
    if (
      !isReady ||
      widgetRef.current ||
      typeof window === "undefined" ||
      !window.cloudinary
    ) {
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
          resourceType: "image",
          clientAllowedFormats: ["png", "jpg", "jpeg", "gif", "webp"],
          maxFileSize: 10 * 1024 * 1024,
          cropping: false,
          showAdvancedOptions: false,
          showCompletedButton: true,
          showUploadSteps: false,
        },
        (uploadError: unknown, result: unknown) => {
          if (uploadError) {
            let errorMsg = "Upload thất bại";

            if (typeof uploadError === "object" && uploadError !== null) {
              const errObj = uploadError as Record<string, unknown>;
              if (errObj.message) {
                errorMsg = String(errObj.message);
              } else if (errObj.description) {
                errorMsg = String(errObj.description);
              } else if (errObj.error) {
                errorMsg = String(errObj.error);
              }
            } else if (typeof uploadError === "string") {
              errorMsg = uploadError;
            }

            console.error("Cloudinary upload error:", errorMsg);
            setError(errorMsg);
            setIsUploading(false);
          }

          if (result && typeof result === "object" && "event" in result) {
            const event = (result as { event: string }).event;
            if (event === "success") {
              const info = result as unknown as {
                info: { public_id: string; secure_url: string };
              };
              onChange(info.info.secure_url);
              setIsUploading(false);
            }
          }
        }
      );
    } catch (err) {
      console.error("Failed to create upload widget:", err);
      setError("Không thể tạo Upload Widget");
    }
  }, [isReady, onChange]);

  const handleOpenWidget = useCallback(() => {
    if (!isReady || !widgetRef.current) {
      setError("Widget chưa sẵn sàng");
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      (widgetRef.current as { open: () => void }).open();
    } catch (err) {
      console.error("Failed to open widget:", err);
      setError("Không thể mở Upload Widget");
      setIsUploading(false);
    }
  }, [isReady]);

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  const isLoading = !isReady;
  const hasImage = Boolean(value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-semibold text-slate-600">{label}</label>
      )}

      {hasImage ? (
        <div className="relative group">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="w-full h-32 object-cover"
              onError={() => {
                onChange("");
                toast.error("Không thể tải ảnh. Vui lòng thử lại.");
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs bg-white/90 hover:bg-white shadow-sm"
                  onClick={handleOpenWidget}
                  disabled={disabled || isLoading}
                >
                  <ImagePlus className="size-3 mr-1" />
                  Thay đổi
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs bg-white/90 hover:bg-red-50 text-red-600 hover:text-red-700 shadow-sm"
                  onClick={handleClear}
                  disabled={disabled}
                >
                  <X className="size-3 mr-1" />
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <Button
            type="button"
            variant="outline"
            className="h-20 border-dashed rounded-xl flex flex-col gap-1.5"
            onClick={handleOpenWidget}
            disabled={disabled || isLoading}
          >
            {isLoading || isUploading ? (
              <>
                <Loader2 className="size-5 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">
                  {isLoading ? "Đang tải widget..." : "Đang tải ảnh..."}
                </span>
              </>
            ) : (
              <>
                <Upload className="size-5 text-indigo-500" />
                <span className="text-xs text-slate-500">
                  Tải ảnh lên (PNG, JPG, GIF, WebP)
                </span>
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
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
