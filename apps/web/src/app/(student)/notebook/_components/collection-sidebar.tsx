"use client";

/**
 * CollectionSidebar - Simplified
 *
 * Left sidebar with collections and tags only.
 * No status filters, no practice shortcuts.
 */

import { useState } from "react";
import {
  Folder,
  Plus,
  BookMarked,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { VocabularyCollection } from "@/features/vocabulary/hooks/useVocabulary";

export type CollectionFilterId =
  | { kind: "all" }
  | { kind: "collection"; id: string }
  | { kind: "tag"; tag: string };

export function CollectionSidebar({
  collections,
  activeFilter,
  totalCount,
  onSelect,
  onCreateCollection,
  onDeleteCollection,
  tags,
  activeTag,
  onSelectTag,
}: {
  collections: VocabularyCollection[];
  activeFilter: CollectionFilterId;
  totalCount: number;
  onSelect: (filter: CollectionFilterId) => void;
  onCreateCollection: (name: string) => Promise<void>;
  onDeleteCollection?: (collection: VocabularyCollection) => void;
  tags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreateCollection(newName.trim());
      setNewName("");
      setShowNewInput(false);
      toast.success("Đã tạo bộ sưu tập mới");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tạo bộ sưu tập",
      );
    } finally {
      setCreating(false);
    }
  };

  const isAllActive = activeFilter.kind === "all" && !activeTag;

  return (
    <aside className="space-y-6">
      {/* Decorative gradient background */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-20 -z-10 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-b from-teal-200/40 via-transparent to-transparent rounded-3xl" />
        </div>
      </div>

      {/* "All" link */}
      <button
        type="button"
        onClick={() => {
          onSelect({ kind: "all" });
          onSelectTag(null);
        }}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
          isAllActive
            ? "bg-gradient-to-r from-teal-50 to-emerald-50/50 font-semibold text-teal-700 shadow-sm ring-1 ring-teal-200/50"
            : "hover:bg-slate-50/80 text-slate-600",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100/60 transition-all duration-200 group-hover:scale-105 group-hover:bg-slate-200/60">
          <BookMarked className="h-4 w-4 text-teal-600" />
        </span>
        <span className="flex-1 font-semibold">Tất cả từ vựng</span>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-xs tabular-nums transition-colors",
          isAllActive ? "bg-teal-100/60 text-teal-600" : "bg-slate-100/60 text-slate-500"
        )}>
          {totalCount}
        </span>
      </button>

      {/* Collections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Bộ sưu tập
          </span>
          <Badge variant="secondary" className="text-xs font-bold bg-slate-100 text-slate-500">
            {collections.length}
          </Badge>
        </div>

        {/* New collection input */}
        {showNewInput ? (
          <div className="animate-fadeIn rounded-xl border border-teal-200/60 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-3 shadow-sm">
            <div className="mb-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreate();
                  } else if (e.key === "Escape") {
                    setShowNewInput(false);
                    setNewName("");
                  }
                }}
                placeholder="Tên bộ sưu tập..."
                className="h-9 text-sm border-teal-200 focus:border-teal-400 focus:ring-teal-200/50"
                autoFocus
                disabled={creating}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="h-8 flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-xs font-semibold hover:from-teal-600 hover:to-emerald-600 shadow-sm"
              >
                Tạo
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowNewInput(false);
                  setNewName("");
                }}
                className="h-8 flex-1 text-xs font-medium"
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewInput(true)}
            className="group flex w-full items-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200/60 p-2.5 text-sm text-slate-500 transition-all duration-200 hover:border-teal-300/80 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-emerald-50/30 hover:text-teal-600 hover:shadow-sm"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100/60 group-hover:bg-teal-100/60 transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-medium">Tạo bộ sưu tập</span>
          </button>
        )}

        {/* Collection list */}
        {collections.length > 0 ? (
          <div className="space-y-1">
            {collections.map((c) => {
              const active =
                activeFilter.kind === "collection" && activeFilter.id === c.id;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-teal-50 to-emerald-50/50 font-semibold text-teal-700 shadow-sm ring-1 ring-teal-200/50"
                      : "hover:bg-slate-50/80 text-slate-600",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect({ kind: "collection", id: c.id });
                      onSelectTag(null);
                    }}
                    className="flex flex-1 items-center gap-3"
                  >
                    <span
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full transition-all duration-200 group-hover:scale-110",
                        active && "ring-2 ring-white shadow-sm"
                      )}
                      style={{ backgroundColor: c.color ?? "#94a3b8" }}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className={cn(
                      "rounded-full bg-slate-100/80 px-2 py-0.5 text-xs tabular-nums transition-colors",
                      active ? "bg-teal-100/60 text-teal-600" : "text-slate-400"
                    )}>
                      {c._count}
                    </span>
                  </button>
                  {onDeleteCollection && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCollection(c);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      aria-label={`Xóa bộ sưu tập ${c.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200/60 bg-slate-50/30 p-4 text-center">
            <Folder className="mx-auto mb-2 h-6 w-6 text-slate-300" />
            <p className="text-xs text-slate-400">Chưa có bộ sưu tập nào</p>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <div className="px-1 text-xs font-bold uppercase tracking-widest text-slate-400">
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTag(activeTag === t ? null : t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95",
                  activeTag === t
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:shadow-sm",
                )}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border border-slate-200/50">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100/60">
            <BookMarked className="h-4 w-4 text-teal-600" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng cộng</span>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-700">{totalCount}</div>
          <div className="text-sm text-slate-400">từ vựng</div>
        </div>
      </div>
    </aside>
  );
}
