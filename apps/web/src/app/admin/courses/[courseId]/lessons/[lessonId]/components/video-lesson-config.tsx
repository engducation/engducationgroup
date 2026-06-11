"use client";

import { X, Play, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CloudinaryUploadWidget } from "@/components/cloudinary/upload-widget";

interface VideoContent {
  title: string;
  description: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  durationSeconds: string;
  resourceNotes: string;
}

interface VideoLessonConfigProps {
  content: VideoContent;
  onContentChange: (content: VideoContent) => void;
  isUploading?: boolean;
  onUploadStart?: () => void;
  onUploadSuccess?: (publicId: string, url: string, duration?: number) => void;
  onUploadError?: (error: string) => void;
}

export function VideoLessonConfig({
  content,
  onContentChange,
  onUploadStart,
  onUploadSuccess,
  onUploadError,
}: VideoLessonConfigProps) {
  const hasVideo = content.cloudinaryUrl || content.cloudinaryPublicId;

  const handleUploadSuccess = (result: { publicId: string; url: string; duration?: number }) => {
    onContentChange({
      ...content,
      cloudinaryPublicId: result.publicId,
      cloudinaryUrl: result.url,
      durationSeconds: result.duration ? String(result.duration) : content.durationSeconds,
    });
    onUploadSuccess?.(result.publicId, result.url, result.duration);
  };

  const handleUploadError = (error: string) => {
    onUploadError?.(error);
  };

  const handleUploadStart = () => {
    onUploadStart?.();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column: Form Input */}
      <div className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Cấu hình Video
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải lên hoặc nhập URL video từ Cloudinary
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Upload Zone */}
            <div
              className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                hasVideo
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              {hasVideo ? (
                <div className="space-y-3">
                  <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="size-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-emerald-700">Video đã được tải lên</p>
                  <p className="text-xs text-slate-500 break-all">
                    {content.cloudinaryPublicId || content.cloudinaryUrl}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onContentChange({
                          ...content,
                          cloudinaryPublicId: "",
                          cloudinaryUrl: "",
                          durationSeconds: "",
                        })
                      }
                    >
                      <X className="size-3.5 mr-1.5" />
                      Xóa video
                    </Button>
                    <CloudinaryUploadWidget
                      onSuccess={handleUploadSuccess}
                      onError={handleUploadError}
                      buttonText="Thay đổi"
                      className="text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-violet-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="size-6 text-violet-600"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Tải video lên Cloudinary
                    </p>
                    <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI (tối đa 500MB)</p>
                  </div>
                  <CloudinaryUploadWidget
                    onSuccess={handleUploadSuccess}
                    onError={handleUploadError}
                    buttonText="Chọn tệp video"
                  />
                </div>
              )}
            </div>

            {/* Cloudinary URLs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-title" className="text-xs font-semibold text-slate-600">
                  Tiêu đề video
                </Label>
                <Input
                  id="video-title"
                  placeholder="VD: Bài giảng — Câu điều kiện loại 1"
                  value={content.title}
                  onChange={(e) =>
                    onContentChange({ ...content, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cloudinary-public-id" className="text-xs font-semibold text-slate-600">
                    Cloudinary Public ID
                  </Label>
                  <Input
                    id="cloudinary-public-id"
                    placeholder="folder/video-name"
                    value={content.cloudinaryPublicId}
                    onChange={(e) =>
                      onContentChange({ ...content, cloudinaryPublicId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-xs font-semibold text-slate-600">
                    Thời lượng (giây)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="600"
                    value={content.durationSeconds}
                    onChange={(e) =>
                      onContentChange({ ...content, durationSeconds: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-url" className="text-xs font-semibold text-slate-600">
                  Cloudinary URL
                </Label>
                <Input
                  id="video-url"
                  placeholder="https://res.cloudinary.com/..."
                  value={content.cloudinaryUrl}
                  onChange={(e) =>
                    onContentChange({ ...content, cloudinaryUrl: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-description" className="text-xs font-semibold text-slate-600">
                  Mô tả video
                </Label>
                <Textarea
                  id="video-description"
                  placeholder="Mô tả nội dung video..."
                  className="resize-none min-h-24"
                  value={content.description}
                  onChange={(e) =>
                    onContentChange({ ...content, description: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Video Preview */}
      <div className="space-y-6">
        <Card className="border-slate-200 bg-slate-950">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Xem trước video</h3>
              {content.durationSeconds && (
                <span className="text-xs text-slate-400">
                  {Math.floor(parseInt(content.durationSeconds) / 60)}:
                  {String(parseInt(content.durationSeconds) % 60).padStart(2, "0")} phút
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasVideo ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                <video
                  src={content.cloudinaryUrl}
                  controls
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video w-full flex flex-col items-center justify-center rounded-xl bg-slate-900 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-slate-800 text-slate-500 mb-4">
                  <Play className="size-8" />
                </div>
                <p className="text-sm text-slate-500">Chưa có video</p>
                <p className="text-xs text-slate-600 mt-1">Tải video lên và lưu để xem trước</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Info */}
        {hasVideo && (
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Thông tin video
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-xs">
                {content.cloudinaryPublicId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Public ID:</span>
                    <span className="font-mono text-slate-700 truncate max-w-[200px]">
                      {content.cloudinaryPublicId}
                    </span>
                  </div>
                )}
                {content.cloudinaryUrl && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">URL:</span>
                    <span className="text-slate-700 truncate max-w-[200px]">
                      {content.cloudinaryUrl}
                    </span>
                  </div>
                )}
                {content.durationSeconds && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời lượng:</span>
                    <span className="text-slate-700">{content.durationSeconds} giây</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
