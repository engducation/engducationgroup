/**
 * LoadingSkeleton — shown while notebook is loading
 * Premium animated skeleton with shimmer effects
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm",
            "animate-pulse-soft"
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-100/60 to-transparent animate-shimmer" />

          <div className="relative space-y-4">
            {/* Header row */}
            <div className="flex items-center gap-3">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>

            {/* Meaning */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Footer */}
            <Skeleton className="h-px w-full rounded-full bg-slate-100" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
