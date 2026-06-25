"use client";

import { useState } from "react";
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  Bug,
  CreditCard,
  Video,
  HelpCircle,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupportTickets, type TicketCategory } from "@/features/learning-content/hooks/use-support-tickets";

const CATEGORIES: Array<{ value: TicketCategory; label: string; icon: typeof Bug; description: string }> = [
  {
    value: "SYSTEM_ERROR",
    label: "Lỗi hệ thống",
    icon: Bug,
    description: "Bug, lỗi kỹ thuật, trang không hoạt động",
  },
  {
    value: "PAYMENT",
    label: "Thanh toán",
    icon: CreditCard,
    description: "Lỗi thanh toán, hoàn tiền, giao dịch",
  },
  {
    value: "VIDEO",
    label: "Video bài giảng",
    icon: Video,
    description: "Video không phát, chất lượng kém, lỗi âm thanh",
  },
  {
    value: "ACCOUNT",
    label: "Tài khoản",
    icon: User,
    description: "Đăng nhập, quên mật khẩu, quyền truy cập",
  },
  {
    value: "QUIZ",
    label: "Bài kiểm tra",
    icon: HelpCircle,
    description: "Lỗi quiz, câu hỏi sai, không nộp được bài",
  },
  {
    value: "OTHER",
    label: "Khác",
    icon: MessageSquare,
    description: "Các vấn đề khác",
  },
];

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
  const { createTicket, isLoading } = useSupportTickets();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TicketCategory | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!category || !title.trim() || !description.trim()) return;

    setError(null);
    const result = await createTicket({
      title: title.trim(),
      category,
      description: description.trim(),
    });

    if (result) {
      setIsSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      setError("Không thể gửi yêu cầu. Vui lòng thử lại.");
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset state
      setTitle("");
      setCategory(null);
      setDescription("");
      setIsSubmitted(false);
      setError(null);
    }
  };

  const isValid = category && title.trim().length >= 5 && description.trim().length >= 10;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Gửi yêu cầu hỗ trợ</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Mô tả chi tiết vấn đề bạn đang gặp phải. Đội ngũ hỗ trợ sẽ liên hệ lại trong thời gian sớm nhất.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="size-8 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-slate-900">Đã gửi yêu cầu!</p>
              <p className="text-sm text-slate-500 text-center">
                Yêu cầu hỗ trợ của bạn đã được tiếp nhận. Chúng tôi sẽ phản hồi sớm nhất có thể.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Loại vấn đề <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <Icon
                        className={`size-5 shrink-0 mt-0.5 ${
                          isSelected ? "text-indigo-600" : "text-slate-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
                          {cat.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {cat.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mô tả ngắn gọn vấn đề của bạn"
                className="h-11"
              />
              <p className="text-xs text-slate-400">
                Tối thiểu 5 ký tự ({title.length}/5)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải, bao gồm:&#10;- Thời điểm xảy ra lỗi&#10;- Các bước để tái hiện lỗi&#10;- Ảnh chụp màn hình (nếu có)"
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-slate-400">
                Tối thiểu 10 ký tự ({description.length}/10)
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi yêu cầu"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
