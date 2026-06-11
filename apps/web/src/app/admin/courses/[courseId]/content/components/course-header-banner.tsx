"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Sparkles, Archive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

interface CourseHeaderBannerProps {
  courseId: string;
  courseTitle?: string;
  courseStatus?: StatusValue;
  onEditCourse: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onAddModule: () => void;
}

export function CourseHeaderBanner({
  courseId,
  courseTitle,
  courseStatus,
  onEditCourse,
  onPublish,
  onUnpublish,
  onAddModule,
}: CourseHeaderBannerProps) {
  const isPublished = courseStatus === "PUBLISHED";

  return (
    <header className="w-full rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50/50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Back link + Title */}
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600 w-fit"
          >
            <ArrowLeft className="size-4" />
            Quay lại danh sách khóa học
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {courseTitle || "Course content workspace"}
            </h1>
            {courseStatus && (
              <Badge
                variant="outline"
                className={
                  isPublished
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }
              >
                {isPublished ? "Published" : "Draft"}
              </Badge>
            )}
          </div>

          <p className="text-sm text-slate-600 max-w-2xl">
            Quản trị nội dung theo từng chương: text, video, quiz, writing và vocabulary.
            Nhấn &ldquo;Xuất bản Khóa học&rdquo; để công khai toàn bộ nội dung.
          </p>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={onAddModule}
            className="gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Thêm chương học
          </Button>

          <Button
            variant="outline"
            onClick={onEditCourse}
            className="gap-2"
          >
            <Pencil className="size-4" />
            Chỉnh sửa thông tin
          </Button>

          {isPublished ? (
            <Button
              variant="outline"
              onClick={onUnpublish}
              className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
            >
              <Archive className="size-4" />
              Hủy xuất bản
            </Button>
          ) : (
            <Button
              onClick={onPublish}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Sparkles className="size-4" />
              Xuất bản Khóa học
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
