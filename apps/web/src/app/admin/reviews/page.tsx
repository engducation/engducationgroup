"use client";

import { useMemo, useState } from "react";
import { MessageSquareQuote, Send, Star } from "lucide-react";
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
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`size-4 ${index < rating ? "fill-current" : "text-slate-300"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { data, isLoading, error, refetch } = useAdminReviews();
const reviews = (data ?? []) as any[];
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});

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
      toast.success("Đã cập nhật trạng thái đánh giá");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật trạng thái đánh giá");
    }
  };

  const visibleCount = reviews.filter((review: any) => review.status === "VISIBLE").length;
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum: number, review: any) => sum + Number(review.rating ?? 0), 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Quản lý đánh giá khóa học</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi review thật, phản hồi trực tiếp và ẩn/hiện review.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tổng review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-slate-950">{reviews.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Review hiển thị</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-slate-950">{visibleCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Điểm trung bình</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-slate-950">{averageRating} / 5</p>
          </CardContent>
        </Card>
      </section>

      {error ? (
        <Card className="border-red-200"><CardContent className="p-6 text-sm text-red-600">{error}</CardContent></Card>
      ) : null}

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="size-5 text-indigo-500" />
            <CardTitle>Danh sách đánh giá</CardTitle>
          </div>
          <CardDescription>Dữ liệu review thật từ khóa học và phản hồi của admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">{review.user?.name ?? review.userId}</p>
                      <Badge variant="outline">{review.course?.title ?? review.courseId}</Badge>
                      <Badge className={review.status === "VISIBLE" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-200 text-slate-700 hover:bg-slate-200"}>
                        {review.status}
                      </Badge>
                    </div>
                    <StarRow rating={Number(review.rating ?? 0)} />
                  </div>
                  <p className="text-sm text-slate-500">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-700">{review.comment || "Không có bình luận"}</p>

                {review.adminReply ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Phản hồi từ admin</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{review.adminReply}</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-slate-300 p-4">
                    <Textarea
                      placeholder="Nhập nội dung phản hồi cho học viên..."
                      value={draftReplies[review.id] ?? ""}
                      onChange={(e) => setDraftReplies((curr) => ({ ...curr, [review.id]: e.target.value }))}
                      className="min-h-28"
                    />
                    <div className="flex justify-end">
                      <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleReply(review.id)}>
                        <Send data-icon="inline-start" />
                        Gửi phản hồi
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => toggleVisibility(review.id, review.status)}>
                    {review.status === "VISIBLE" ? "Ẩn review" : "Hiện review"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
