"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Lock, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseName?: string;
}

export function UpgradeDialog({ isOpen, onClose, courseName }: UpgradeDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 px-6 py-8 text-center">
            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 size-24 rounded-full bg-white/10" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="size-4 text-white" />
            </button>

            {/* Icon */}
            <div className="relative mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Crown className="size-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-1">
              Nâng cấp Premium
            </h2>
            <p className="text-sm text-white/80">
              Mở khóa toàn bộ khóa học
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                Khóa học này chỉ dành cho thành viên Premium.{" "}
                <span className="font-semibold text-slate-900">
                  Vui lòng nâng cấp tài khoản
                </span>{" "}
                để bắt đầu học tập.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              {[
                "Truy cập tất cả khóa học",
                "Học không giới hạn",
                "Nội dung mới cập nhật hàng tuần",
                "Hỗ trợ ưu tiên",
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100">
                    <Sparkles className="size-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Link href="/upgrade" className="block">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25">
                  <Crown className="size-4 mr-2" />
                  Nâng cấp Premium ngay
                </Button>
              </Link>
              <button
                onClick={onClose}
                className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors py-2"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
