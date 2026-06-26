/**
 * SearchFilterBar — search input + sort
 * Premium design with glassmorphism and enhanced visual feedback
 */

import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SORT_OPTIONS, type SortOption } from "./notebook-constants";

interface SearchFilterBarProps {
  searchInput: string;
  sortBy: SortOption;
  hasActiveFilter: boolean;
  selectedCount: number;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onClearFilters: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  searchRef?: React.Ref<HTMLInputElement | null>;
}

export function SearchFilterBar({
  searchInput,
  sortBy,
  hasActiveFilter,
  selectedCount,
  filteredCount,
  totalCount,
  onSearchChange,
  onSortChange,
  onClearFilters,
  onClearSelection,
  onSelectAll,
  searchRef,
}: SearchFilterBarProps) {
  if (totalCount === 0) return null;

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-x-0 -top-4 -bottom-4 -z-10 rounded-2xl bg-gradient-to-r from-teal-100/20 via-transparent to-emerald-100/20" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search — full width on mobile, flexible on desktop */}
        <div className="relative flex-1">
          <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-slate-200/60" />
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="Tìm kiếm từ vựng... (gõ /)"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-0 bg-transparent pl-11 pr-10 shadow-none focus-visible:ring-0 placeholder:text-slate-400"
              aria-label="Tìm kiếm từ vựng"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="shrink-0">
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger
              aria-label="Sắp xếp"
              className="w-full bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm hover:border-teal-300/60 transition-colors sm:w-48"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Filter pills bar — shown when filters are active ──────────────────────

interface FilterPillsBarProps {
  filteredCount: number;
  totalCount: number;
  selectedCount: number;
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export function FilterPillsBar({
  filteredCount,
  totalCount,
  selectedCount,
  hasActiveFilter,
  onClearFilters,
  onClearSelection,
  onSelectAll,
}: FilterPillsBarProps) {
  if (!hasActiveFilter && selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Result count */}
      <span className="text-sm text-slate-500">
        {hasActiveFilter && (
          <>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              {filteredCount}
            </span>
            {" / "}
            <span className="text-slate-400">{totalCount}</span>
          </>
        )}
        {!hasActiveFilter && selectedCount === 0 && (
          <span className="text-slate-600">{totalCount} từ</span>
        )}
      </span>

      {/* Divider */}
      {(hasActiveFilter || selectedCount > 0) && (
        <div className="h-5 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
      )}

      {/* Clear selection */}
      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 px-3 py-1.5 text-xs font-semibold text-teal-600 shadow-sm ring-1 ring-teal-200/50 transition-all duration-200 hover:from-teal-100 hover:to-emerald-100 hover:shadow-md active:scale-95"
        >
          <X className="h-3 w-3" />
          Bỏ chọn ({selectedCount})
        </button>
      )}

      {/* Select all filtered */}
      {hasActiveFilter && filteredCount > 0 && (
        <button
          type="button"
          onClick={onSelectAll}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-200/80 hover:shadow-md active:scale-95"
        >
          Chọn tất cả ({filteredCount})
        </button>
      )}

      {/* Clear all filters */}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-all duration-200 hover:bg-slate-200/80 hover:text-slate-700 hover:shadow-md active:scale-95"
        >
          <X className="h-3 w-3" />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
