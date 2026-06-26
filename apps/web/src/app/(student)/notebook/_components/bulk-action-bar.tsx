"use client";

/**
 * BulkActionBar - Simplified
 *
 * Floating bar that appears when the user has selected ≥ 1 word.
 * Only shows: Add to collection, Delete, Clear
 */

import { useState } from "react";
import { Folder, Trash2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { VocabularyCollection } from "@/features/vocabulary/hooks/useVocabulary";

export function BulkActionBar({
  count,
  collections,
  onClear,
  onRemove,
  onAddToCollection,
}: {
  count: number;
  collections: VocabularyCollection[];
  onClear: () => void;
  onRemove: () => Promise<{ success: boolean; error?: string }>;
  onAddToCollection: (
    collectionId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [busy, setBusy] = useState(false);
  const [collOpen, setCollOpen] = useState(false);

  if (count === 0) return null;

  const run = async (
    fn: () => Promise<{ success: boolean; error?: string }>,
  ) => {
    setBusy(true);
    try {
      const r = await fn();
      if (!r.success) toast.error(r.error ?? "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-auto fixed bottom-8 left-1/2 z-30 -translate-x-1/2 animate-slideUp">
      <div className="group relative">
        <div className="absolute inset-0 -z-10 scale-110 rounded-2xl bg-gradient-to-r from-teal-400/20 via-emerald-400/20 to-teal-400/20 opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-80" />

        <div className="relative flex items-center gap-1 rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl px-2 py-2 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/50 transition-shadow duration-300 hover:shadow-2xl hover:shadow-slate-900/15">
          {/* Count badge */}
          <div className="relative flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-500 px-3.5 text-white shadow-lg shadow-teal-500/25">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-bold tabular-nums">{count}</span>
            <span className="text-xs font-medium opacity-90">đã chọn</span>
          </div>

          <div className="mx-1 h-6 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

          {/* Add to collection - popover */}
          <Popover open={collOpen} onOpenChange={setCollOpen}>
            <PopoverTrigger>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !busy && setCollOpen((o) => !o)}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:shadow-sm active:scale-95",
                  busy && "opacity-50 cursor-not-allowed",
                )}
              >
                <Folder className="h-4 w-4" />
                <span>Bộ sưu tập</span>
              </div>
            </PopoverTrigger>
            <PopoverContent align="center" sideOffset={12} className="w-64 p-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Folder className="h-4 w-4" />
                <span>Thêm vào bộ sưu tập</span>
              </div>
              {collections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
                  <Folder className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  <p className="text-xs text-slate-400">Chưa có bộ sưu tập nào</p>
                </div>
              ) : (
                <div className="max-h-52 space-y-1 overflow-y-auto">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const r = await onAddToCollection(c.id);
                          if (r.success) {
                            toast.success(`Đã thêm vào "${c.name}"`);
                            setCollOpen(false);
                          } else {
                            toast.error(r.error ?? "Lỗi");
                          }
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100/50 active:scale-[0.98]"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: c.color ?? "#94a3b8" }}
                      />
                      <span className="flex-1 truncate font-medium">{c.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-slate-500">
                        {c._count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Delete */}
          <button
            type="button"
            onClick={() => run(onRemove)}
            disabled={busy}
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Xóa</span>
          </button>

          <div className="mx-1 h-6 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

          {/* Clear */}
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 active:scale-95 disabled:opacity-50"
            title="Bỏ chọn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
