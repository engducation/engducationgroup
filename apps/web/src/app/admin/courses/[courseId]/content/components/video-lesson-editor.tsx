"use client";

import { useState } from "react";
import { Upload, X, Play, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface VideoContent {
  title: string;
  description: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  durationSeconds: string;
  resourceNotes: string;
}

interface VideoLessonEditorProps {
  content: VideoContent;
  onContentChange: (content: VideoContent) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  onUpload?: (file: File) => void;
}

export function VideoLessonEditor({
  content,
  onContentChange,
  isUploading = false,
  uploadProgress = 0,
  onUpload,
}: VideoLessonEditorProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0] && onUpload) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        onUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpload) {
      onUpload(e.target.files[0]);
    }
  };

  const hasVideo = content.cloudinaryUrl || content.cloudinaryPublicId;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column: Form Input */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Cấu hình Video</h3>
              <p className="text-xs text-slate-500">Tải lên hoặc nhập URL video từ Cloudinary</p>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? "border-violet-400 bg-violet-50"
                : hasVideo
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-slate-200 bg-slate-50/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-violet-100">
                  <Loader2 className="size-6 text-violet-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Đang tải lên...</p>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-slate-500">{uploadProgress}% hoàn thành</p>
                </div>
              </div>
            ) : hasVideo ? (
              <div className="space-y-3">
                <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-emerald-700">Video đã được tải lên</p>
                <p className="text-xs text-slate-500 break-all">{content.cloudinaryPublicId || content.cloudinaryUrl}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onContentChange({ ...content, cloudinaryPublicId: "", cloudinaryUrl: "" })}
                  className="mt-2"
                >
                  <X className="size-3.5 mr-1.5" />
                  Xóa video
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-violet-100">
                  <Upload className="size-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Kéo và thả video vào đây
                  </p>
                  <p className="text-xs text-slate-500 mt-1">hoặc</p>
                </div>
                <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 hover:border-slate-300">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  Chọn tệp video
                </label>
                <p className="text-xs text-slate-400">Hỗ trợ MP4, MOV, AVI (tối đa 500MB)</p>
              </div>
            )}
          </div>

          {/* Cloudinary URLs */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="video-title" className="text-xs font-semibold text-slate-700">
                Tiêu đề video <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Input
                id="video-title"
                placeholder="VD: Bài giảng — Câu điều kiện loại 1"
                value={content.title}
                onChange={(e) => onContentChange({ ...content, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cloudinary-public-id" className="text-xs font-semibold text-slate-700">
                  Cloudinary Public ID <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </Label>
                <Input
                  id="cloudinary-public-id"
                  placeholder="folder/video-name"
                  value={content.cloudinaryPublicId}
                  onChange={(e) => onContentChange({ ...content, cloudinaryPublicId: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-xs font-semibold text-slate-700">
                  Thời lượng (giây) <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="600"
                  value={content.durationSeconds}
                  onChange={(e) => onContentChange({ ...content, durationSeconds: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="video-url" className="text-xs font-semibold text-slate-700">
                Cloudinary URL <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Input
                id="video-url"
                placeholder="https://res.cloudinary.com/..."
                value={content.cloudinaryUrl}
                onChange={(e) => onContentChange({ ...content, cloudinaryUrl: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="video-description" className="text-xs font-semibold text-slate-700">
                Mô tả video <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Textarea
                id="video-description"
                placeholder="Mô tả nội dung video..."
                className="resize-none min-h-24"
                value={content.description}
                onChange={(e) => onContentChange({ ...content, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resource-notes" className="text-xs font-semibold text-slate-700">
                Tài nguyên / Ghi chú <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Textarea
                id="resource-notes"
                placeholder="Link tài liệu, transcript, hoặc ghi chú bổ sung..."
                className="resize-none min-h-20"
                value={content.resourceNotes}
                onChange={(e) => onContentChange({ ...content, resourceNotes: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Video Preview */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Xem trước video</h3>
            {content.durationSeconds && (
              <span className="text-xs text-slate-400">
                {Math.floor(parseInt(content.durationSeconds) / 60)}:{String(parseInt(content.durationSeconds) % 60).padStart(2, "0")} phút
              </span>
            )}
          </div>

          {hasVideo ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video
                src={content.cloudinaryUrl}
                controls
                className="h-full w-full object-contain"
                poster={content.cloudinaryPublicId ? `https://res.cloudinary.com/demo/video/upload/${content.cloudinaryPublicId}.jpg` : undefined}
              />
            </div>
          ) : (
            <div className="aspect-video w-full flex flex-col items-center justify-center rounded-xl bg-slate-900 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-slate-800 text-slate-500 mb-4">
                <Play className="size-8" />
              </div>
              <p className="text-sm text-slate-500">Video sẽ hiển thị ở đây</p>
              <p className="text-xs text-slate-600 mt-1">Sau khi tải lên thành công</p>
            </div>
          )}
        </div>

        {/* Video Info */}
        {hasVideo && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Thông tin video</h4>
            <div className="grid gap-2 text-xs">
              {content.cloudinaryPublicId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Public ID:</span>
                  <span className="font-mono text-slate-700 truncate max-w-[200px]">{content.cloudinaryPublicId}</span>
                </div>
              )}
              {content.cloudinaryUrl && (
                <div className="flex justify-between">
                  <span className="text-slate-500">URL:</span>
                  <span className="text-slate-700 truncate max-w-[200px]">{content.cloudinaryUrl}</span>
                </div>
              )}
              {content.durationSeconds && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời lượng:</span>
                  <span className="text-slate-700">{content.durationSeconds} giây</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
