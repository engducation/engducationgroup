"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  MessageSquareQuote,
  Send,
  Star,
  StarHalf,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/features/admin/api/admin-api";
import { useAdminReviews } from "@/features/admin/hooks/use-admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${
            index < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
  accent: string;
  sub?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white">
        <CardContent className="p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
            {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
          </div>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} shadow-lg shadow-current/20`}
          >
            <Icon className="size-4.5 text-white" />
          </div>
        </div>
      </CardContent>
      <div className={`h-0.5 w-full bg-gradient-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Card>
  );
}

export default function AdminReviewsPage() {
  const { data, isLoading, error, refetch } = useAdminReviews();
  const reviews = (data ?? []) as any[];
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleCount = reviews.filter((r) => r.status === "VISIBLE").length;
  const hiddenCount = reviews.length - visibleCount;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / reviews.length).toFixed(1)
      : "0.0";

  const handleReply = async (reviewId: string) => {
    const reply = draftReplies[reviewId]?.trim();
    if (!reply) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    try {
      await adminApi.replyReview(reviewId, { reply });
      toast.success("Đã gửi phản hồi");
      setDraftReplies((curr) => ({ ...curr, [reviewId]: "" }));
      setExpandedId(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể phản hồi đánh giá");
    }
  };

  const toggleVisibility = async (reviewId: string, currentStatus: string) => {
    try {
      await adminApi.updateReviewStatus(reviewId, {
        status: currentStatus === "VISIBLE" ? "HIDDEN" : "VISIBLE",
      });
      toast.success(
        currentStatus === "VISIBLE" ? "Đã ẩn đánh giá" : "Đã hiện đánh giá",
      );
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái",
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Đánh giá học viên
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Theo dõi, phản hồi và kiểm soát trạng thái hiển thị của đánh giá.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng đánh giá"
          value={reviews.length}
          icon={Star}
          accent="from-indigo-500 to-violet-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Điểm trung bình"
          value={`${avgRating}`}
          icon={TrendingUp}
          accent="from-amber-500 to-orange-600"
          sub="/ 5.0"
          isLoading={isLoading}
        />
        <StatCard
          label="Đang hiển thị"
          value={visibleCount}
          icon={Eye}
          accent="from-emerald-500 to-teal-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Đã ẩn"
          value={hiddenCount}
          icon={EyeOff}
          accent="from-slate-500 to-slate-600"
          isLoading={isLoading}
        />
      </div>

      {/* Error state */}
      {error ? (
        <Card className="border-red-200/60 bg-red-50/50">
          <CardContent className="flex items-center gap-3 p-4">
            <p className="text-sm text-red-600">{String(error)}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Reviews list */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <MessageSquareQuote className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Danh sách đánh giá</CardTitle>
              <CardDescription className="text-xs">
                {reviews.length > 0
                  ? `${reviews.length} đánh giá`
                  : "Chưa có đánh giá nào"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="border-t">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-5 space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <Star className="size-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Chưa có đánh giá nào</p>
              <p className="mt-1 text-xs text-slate-400">
                Đánh giá từ học viên sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map((review: any) => {
                const isExpanded = expandedId === review.id;
                const hasReply = !!review.adminReply;

                return (
                  <div key={review.id} className="px-6 py-5">
                    {/* Review header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar placeholder */}
                        <div className="size-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {(review.user?.name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950 truncate">
                              {review.user?.name ?? review.userId}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {review.course?.title ?? review.courseId}
                            </Badge>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                review.status === "VISIBLE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {review.status === "VISIBLE" ? (
                                <>
                                  <Eye className="size-2.5" /> Hiện
                                </>
                              ) : (
                                <>
                                  <EyeOff className="size-2.5" /> Ẩn
                                </>
                              )}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3">
                            <StarRow rating={Number(review.rating ?? 0)} />
                            <span className="text-xs text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs rounded-lg"
                          onClick={() =>
                            toggleVisibility(review.id, review.status)
                          }
                        >
                          {review.status === "VISIBLE" ? (
                            <>
                              <EyeOff className="size-3" />
                              Ẩn
                            </>
                          ) : (
                            <>
                              <Eye className="size-3" />
                              Hiện
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 pl-[2.75rem]">
                      {review.comment || (
                        <span className="italic text-slate-400">Không có bình luận.</span>
                      )}
                    </p>

                    {/* Admin reply */}
                    {hasReply ? (
                      <div className="mt-4 ml-[2.75rem] rounded-xl bg-indigo-50/70 border border-indigo-100 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex size-5 items-center justify-center rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                            A
                          </div>
                          <p className="text-xs font-semibold text-indigo-700">Phản hồi từ Admin</p>
                          <span className="text-[10px] text-indigo-400">
                            {new Date(review.updatedAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700">
                          {review.adminReply}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 ml-[2.75rem]">
                        {!isExpanded ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs rounded-lg"
                            onClick={() => setExpandedId(review.id)}
                          >
                            <Send className="size-3" />
                            Phản hồi
                          </Button>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50/50">
                            <Textarea
                              placeholder="Nhập nội dung phản hồi cho học viên..."
                              value={draftReplies[review.id] ?? ""}
                              onChange={(e) =>
                                setDraftReplies((curr) => ({
                                  ...curr,
                                  [review.id]: e.target.value,
                                }))
                              }
                              className="min-h-24 resize-none text-sm rounded-xl"
                            />
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs rounded-lg"
                                onClick={() => setExpandedId(null)}
                              >
                                Hủy
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => handleReply(review.id)}
                              >
                                <Send className="size-3" />
                                Gửi phản hồi
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
