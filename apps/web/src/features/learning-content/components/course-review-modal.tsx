"use client";

import { useState } from "react";
import {
  Star,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReviews } from "@/features/learning-content/hooks/use-reviews";

interface CourseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
}

export function CourseReviewModal({
  isOpen,
  onClose,
  courseId,
  courseName,
}: CourseReviewModalProps) {
  const { createReview, isLoading } = useReviews();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    const result = await createReview({
      courseId,
      rating,
      comment: comment.trim() || undefined,
    });

    if (result) {
      setIsSubmitted(true);
      // Close modal after showing success
      setTimeout(() => {
        onClose();
        // Reset state
        setRating(0);
        setComment("");
        setIsSubmitted(false);
      }, 1500);
    }
  };

  const handleClose = () => {
    if (!isSubmitted && !isLoading) {
      onClose();
      // Reset state
      setRating(0);
      setComment("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Đánh giá khóa học</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Bạn vừa hoàn thành khóa học "{courseName}". Hãy chia sẻ cảm nhận của bạn để giúp chúng tôi cải thiện chất lượng.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="size-8 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-slate-900">Cảm ơn bạn!</p>
              <p className="text-sm text-slate-500 text-center">
                Đánh giá của bạn đã được gửi thành công.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Mức độ hài lòng của bạn
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`size-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-200"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-500">
                  {rating > 0 ? `${rating}/5` : "Chọn đánh giá"}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Nhận xét (tùy chọn)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về khóa học này..."
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-slate-400">
                Nhận xét của bạn sẽ giúp giáo viên cải thiện khóa học.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={rating === 0 || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi đánh giá"
                )}
              </Button>
            </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}
