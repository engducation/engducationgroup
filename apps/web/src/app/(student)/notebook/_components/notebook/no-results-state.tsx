/**
 * NoResultsState — shown when filters return no results
 * Premium design with enhanced visual feedback
 */

import { Search, X, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NoResultsStateProps {
  hasActiveFilter: boolean;
  searchQuery: string;
  onClear: () => void;
}

export function NoResultsState({
  hasActiveFilter,
  searchQuery,
  onClear,
}: NoResultsStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-16">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-slate-100/30" />
      </div>

      {/* Icon */}
      <div className="relative mb-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner">
          <Search className="size-7 text-slate-400" />
        </div>
        {/* Decorative ring */}
        <div className="absolute inset-0 -z-10 scale-110 rounded-full border border-dashed border-slate-200" />
      </div>

      {/* Content */}
      <div className="mb-6 space-y-2 text-center">
        <h3 className="text-lg font-bold text-slate-700">Không tìm thấy từ vựng</h3>
        {hasActiveFilter ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-slate-500">
              Không có kết quả nào khớp với bộ lọc hiện tại
              {searchQuery && (
                <>
                  {" "}cho từ khóa{" "}
                  <span className="inline-flex items-center gap-1 font-semibold text-teal-600">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc khác</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </p>
        )}
      </div>

      {/* Action */}
      {hasActiveFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="gap-2 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Filter className="size-4" />
          Xóa bộ lọc
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
