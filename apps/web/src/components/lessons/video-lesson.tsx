"use client";

import { useState } from "react";
import { CheckCircle2, Play, Volume2, Maximize, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoLessonProps {
  lessonId: string;
  title: string;
  description?: string | null;
  cloudinaryUrl: string;
  durationSeconds?: number | null;
  isCompleted: boolean;
  onComplete: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoLesson({
  lessonId,
  title,
  description,
  cloudinaryUrl,
  durationSeconds,
  isCompleted,
  onComplete,
}: VideoLessonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const handleVideoEnded = () => {
    setHasEnded(true);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
        <div className="aspect-video">
          <video
            key={cloudinaryUrl}
            src={cloudinaryUrl}
            controls
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
            playsInline
          />
        </div>

        {/* Duration badge */}
        {durationSeconds && (
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-white font-medium">
            {formatDuration(durationSeconds)}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                <Play className="size-3 mr-1" />
                Video bài giảng
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="size-3" />
                  Đã hoàn thành
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          </div>
        </div>

        {description && (
          <p className="text-slate-600 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Mark as Completed */}
      {!isCompleted && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 text-center">
          {hasEnded ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-indigo-100">
                  <Play className="size-8 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Đã xem video xong?
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Nhấn nút bên dưới để đánh dấu hoàn thành bài học này.
                </p>
              </div>
              <Button
                onClick={onComplete}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <CheckCircle2 className="size-4" />
                Hoàn thành bài học
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Đang xem video
              </h3>
              <p className="text-sm text-slate-500">
                Xem hết video và nhấn "Hoàn thành" để chuyển sang bài tiếp theo.
              </p>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-emerald-900">
            Bạn đã hoàn thành bài học này!
          </h3>
          <p className="text-sm text-emerald-600 mt-1">
            Tiếp tục với bài học tiếp theo để học thêm nhiều kiến thức mới.
          </p>
        </div>
      )}
    </div>
  );
}
