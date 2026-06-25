"use client";

import { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReviews, type Review } from "@/features/learning-content/hooks/use-reviews";

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

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function StudentReviewsPage() {
  const { getUserReviews, isLoading } = useReviews();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const loadReviews = async () => {
      const data = await getUserReviews();
      setReviews(data);
    };
    void loadReviews();
  }, [getUserReviews]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đánh giá của tôi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem lại các đánh giá bạn đã gửi cho khóa học
        </p>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100">
              <MessageSquare className="size-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Lịch sử đánh giá</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Đang tải..."
                  : reviews.length > 0
                  ? `${reviews.length} đánh giá`
                  : "Chưa có đánh giá nào"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <Star className="size-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-600">Chưa có đánh giá nào</p>
              <p className="mt-1 text-sm text-slate-400">
                Hoàn thành khóa học để gửi đánh giá của bạn
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map((review: Review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                      <Star className="size-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {review.course?.title ?? "Khóa học đã xóa"}
                        </p>
                        <StarRow rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          "{review.comment}"
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="size-3" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
