/**
 * EmptyState — shown when notebook is empty
 * Premium design with illustration and enhanced visual appeal
 */

import { useRouter } from "next/navigation";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center py-20">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-b from-teal-100/30 to-transparent" />
        <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-gradient-to-t from-amber-100/20 to-transparent" />
        <div className="absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-gradient-to-t from-emerald-100/20 to-transparent" />
      </div>

      {/* Icon container */}
      <div className="relative mb-8">
        {/* Glow effect */}
        <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-teal-200/40 to-emerald-200/40 blur-2xl" />
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-xl shadow-teal-500/30">
          <BookOpen className="size-10 text-white" />
        </div>
        {/* Floating sparkles */}
        <div className="absolute -right-2 -top-2 animate-float">
          <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 shadow-lg shadow-amber-200/50">
            <Sparkles className="size-4 text-amber-500" />
          </div>
        </div>
        <div className="absolute -left-1 -bottom-1 animate-float" style={{ animationDelay: '1s' }}>
          <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-200/50">
            <Sparkles className="size-3 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="mb-8 space-y-3 text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Chưa có từ vựng nào
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
          Hãy bắt đầu lưu từ vựng từ các bài học để ôn tập và ghi nhớ từ vựng một cách hiệu quả nhé!
        </p>
      </div>

      {/* CTA Button */}
      <Button
        onClick={() =>
          router.push("/courses" as Parameters<typeof router.push>[0])
        }
        className="group relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40 hover:from-teal-600 hover:to-emerald-600"
      >
        <span className="relative z-10 flex items-center gap-2">
          Khám phá bài học
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </Button>
    </div>
  );
}
