"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, Lock } from "lucide-react";

export interface CourseCardProps {
  id: string;
  title: string;
  description: string | null;
  level: string;
  thumbnailUrl: string | null;
  totalModules: number;
  totalLessons: number;
  isEnrolled: boolean;
  isPremium: boolean;
  onEnroll?: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
}

export function CourseCard({
  id,
  title,
  description,
  level,
  thumbnailUrl,
  totalModules,
  totalLessons,
  isEnrolled,
  isPremium,
  onEnroll,
  onContinue,
}: CourseCardProps) {
  const handleAction = (e: React.MouseEvent) => {
    if (isEnrolled && onContinue) {
      e.preventDefault();
      onContinue(id);
    } else if (!isEnrolled && onEnroll) {
      e.preventDefault();
      onEnroll(id);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/8">
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-violet-100 to-purple-100 flex items-center justify-center">
            <span className="text-6xl font-bold text-indigo-200/80">
              {title.charAt(0)}
            </span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Level badge */}
        <span className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-indigo-600 shadow-sm">
          {level}
        </span>

        {/* Locked overlay for non-premium */}
        {!isPremium && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Lock className="size-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/90">
                Chỉ dành cho Premium
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Course info */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors line-clamp-1">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <BookOpen className="size-3.5" />
            {totalModules} chương
          </span>
          <span className="text-slate-200">·</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="size-3.5" />
            {totalLessons} bài
          </span>
        </div>

        {/* Action button */}
        <div className="mt-4">
          {isEnrolled ? (
            <button
              onClick={handleAction}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              Vào học ngay
              <ArrowRight className="size-4" />
            </button>
          ) : isPremium ? (
            <button
              onClick={handleAction}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              Đăng ký học
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleAction}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <Lock className="size-4" />
              Đăng ký học
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
