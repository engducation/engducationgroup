/**
 * ShortcutHelpModal — shows keyboard shortcuts
 * Premium design with enhanced visual styling
 */

import { Keyboard, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  const rows: { keys: string[]; desc: string }[] = [
    { keys: ["/"], desc: "Focus thanh tìm kiếm" },
    { keys: ["Esc"], desc: "Bỏ chọn / đóng modal" },
    { keys: ["J / ↓"], desc: "Chọn từ kế tiếp" },
    { keys: ["K / ↑"], desc: "Chọn từ trước" },
    { keys: ["X"], desc: "Toggle chọn từ hiện tại" },
    { keys: ["Shift + X"], desc: "Chọn tất cả từ đã lọc" },
    { keys: ["D"], desc: "Xóa từ đang chọn" },
    { keys: ["M"], desc: "Toggle mastered từ đang chọn" },
    { keys: ["?"], desc: "Mở/trợ giúp phím tắt" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30">
              <Keyboard className="size-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Phím tắt
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3.5 text-teal-500" />
              Các phím tắt giúp bạn thao tác nhanh hơn trong Sổ từ vựng
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5">
          {rows.map(({ keys, desc }, index) => (
            <div
              key={keys.join("+")}
              className="flex items-center gap-4 rounded-lg bg-slate-50/50 p-2.5 transition-colors hover:bg-slate-100/50"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex gap-1.5">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex h-7 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold font-mono text-slate-700 shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
