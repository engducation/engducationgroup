"use client";

/**
 * Student Notebook Client - Sổ từ vựng cá nhân
 *
 * Features:
 * - CollectionSidebar: collections, tags
 * - VocabularyCard: collapsible details (tags, notes, collections), status badges
 * - Search + Sort
 * - Keyboard shortcuts: / Esc ? D
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useVocabulary } from "@/features/vocabulary/hooks/useVocabulary";
import type {
  UserNotebookEntry,
  VocabularyCollection,
} from "@/features/vocabulary/hooks/useVocabulary";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CollectionSidebar, type CollectionFilterId } from "./_components/collection-sidebar";
import { BulkActionBar } from "./_components/bulk-action-bar";

// Notebook components
import { VocabularyCard } from "./_components/notebook/vocabulary-card";
import {
  SearchFilterBar,
  FilterPillsBar,
} from "./_components/notebook/search-filter-bar";
import { ShortcutHelpModal } from "./_components/notebook/shortcut-help-modal";
import { EmptyState } from "./_components/notebook/empty-state";
import { NoResultsState } from "./_components/notebook/no-results-state";
import { LoadingSkeleton } from "./_components/notebook/loading-skeleton";
import { useDebouncedValue } from "./_components/notebook/notebook-utils";
import { type SortOption } from "./_components/notebook/notebook-constants";

// ─── Main Component ─────────────────────────────────────────────────────────

export default function NotebookClient() {
  const vocab = useVocabulary();
  const {
    notebook,
    collections,
    dueCount,
    loadNotebook,
    loadCollections,
    loadTags,
    bulkRemove,
    bulkAddToCollection,
    updateTags,
    updateNote,
    createCollection,
    addToCollection,
    removeFromCollection,
    deleteCollection,
    error,
  } = vocab;

  // ── Local state ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<UserNotebookEntry | null>(null);
  const [pendingDeleteCollection, setPendingDeleteCollection] = useState<VocabularyCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilterId>({
    kind: "all",
  });
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadNotebook(), loadCollections(), loadTags()]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadNotebook, loadCollections, loadTags]);

  // Surface remote errors as toasts
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur?.();
        }
        return;
      }

      switch (e.key) {
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "Escape":
          if (showShortcuts) {
            setShowShortcuts(false);
          } else if (selectedIds.size > 0) {
            setSelectedIds(new Set());
          }
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts((v) => !v);
          break;
        case "d":
        case "D":
          if (selectedIds.size > 0) {
            e.preventDefault();
            const first = notebook.find(
              (entry) => entry.vocabulary.id === selectedIds.values().next().value,
            );
            if (first) setPendingDelete(first);
          }
          break;
      }
    },
    [selectedIds, showShortcuts, notebook],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Filtered + Sorted list ─────────────────────────────────────────────
  const filteredNotebook = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    let result = notebook;

    // ── Collection filter ──
    if (collectionFilter.kind === "collection") {
      const collectionId = collectionFilter.id;
      result = result.filter((e) => {
        const entryCollections = (e.collections ?? []) as string[];
        return entryCollections.includes(collectionId);
      });
    }

    // ── Tag filter ──
    if (activeTag) {
      result = result.filter((e) => (e.tags ?? []).includes(activeTag));
    }

    // ── Search ──
    if (query) {
      result = result.filter(
        (entry) =>
          entry.vocabulary.word.toLowerCase().includes(query) ||
          entry.vocabulary.meaning.toLowerCase().includes(query),
      );
    }

    return result;
  }, [notebook, debouncedSearch, collectionFilter, activeTag]);

  const sortedNotebook = useMemo(() => {
    const arr = [...filteredNotebook];
    switch (sortBy) {
      case "recent":
        return arr.sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
        );
      case "oldest":
        return arr.sort(
          (a, b) =>
            new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime(),
        );
      case "alpha":
        return arr.sort((a, b) =>
          a.vocabulary.word.localeCompare(b.vocabulary.word),
        );
      case "due":
        return arr.sort((a, b) => {
          const ad = a.review?.dueAt
            ? new Date(a.review.dueAt).getTime()
            : Infinity;
          const bd = b.review?.dueAt
            ? new Date(b.review.dueAt).getTime()
            : Infinity;
          return ad - bd;
        });
      case "mastered-last":
        return arr.sort((a, b) => {
          const at = a.masteredAt ? new Date(a.masteredAt).getTime() : 0;
          const bt = b.masteredAt ? new Date(b.masteredAt).getTime() : 0;
          return at - bt;
        });
      case "level": {
        const order = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };
        return arr.sort((a, b) => {
          const av = a.vocabulary.level
            ? (order as Record<string, number>)[a.vocabulary.level] ?? 9
            : 9;
          const bv = b.vocabulary.level
            ? (order as Record<string, number>)[b.vocabulary.level] ?? 9
            : 9;
          return av - bv;
        });
      }
      default:
        return arr;
    }
  }, [filteredNotebook, sortBy]);

  // ── All tags from notebook ────────────────────────────────────────────
  const usedTags = useMemo(() => {
    const set = new Set<string>();
    for (const entry of notebook) {
      for (const t of entry.tags ?? []) {
        set.add(t);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notebook]);

  const hasActiveFilter =
    debouncedSearch.trim().length > 0 ||
    collectionFilter.kind !== "all" ||
    activeTag !== null;

  // ── Handlers ──────────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearchInput("");
    setCollectionFilter({ kind: "all" });
    setActiveTag(null);
  }, []);

  const toggleSelection = useCallback((vocabId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(vocabId)) next.delete(vocabId);
      else next.add(vocabId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (select: boolean) => {
      if (select) {
        setSelectedIds(
          new Set(sortedNotebook.map((e) => e.vocabulary.id)),
        );
      } else {
        setSelectedIds(new Set());
      }
    },
    [sortedNotebook],
  );

  const requestDelete = useCallback((entry: UserNotebookEntry) => {
    setPendingDelete(entry);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const ids = selectedIds.has(pendingDelete.vocabulary.id)
        ? Array.from(selectedIds)
        : [pendingDelete.vocabulary.id];
      const ok = await bulkRemove(ids);
      if (ok.success) {
        toast.success("Đã xóa từ vựng khỏi sổ tay");
        setPendingDelete(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      } else {
        toast.error(ok.error ?? "Không thể xóa từ vựng.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa từ vựng",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, selectedIds, bulkRemove]);

  const handleBulkRemove = useCallback(async () => {
    if (selectedIds.size === 0) return { success: true };
    const r = await bulkRemove(Array.from(selectedIds));
    if (r.success) {
      toast.success(`Đã xóa ${selectedIds.size} từ khỏi sổ tay`);
      setSelectedIds(new Set());
    } else {
      toast.error(r.error ?? "Lỗi khi xóa");
    }
    return r;
  }, [selectedIds, bulkRemove]);

  const handleBulkAddToCollection = useCallback(
    async (collectionId: string) => {
      const r = await bulkAddToCollection(
        collectionId,
        Array.from(selectedIds),
      );
      if (r.success) {
        setSelectedIds(new Set());
      }
      return r;
    },
    [selectedIds, bulkAddToCollection],
  );

  const handleCreateCollection = useCallback(
    async (input: {
      name: string;
    }): Promise<{
      success: boolean;
      error?: string;
      data?: VocabularyCollection;
    }> => {
      const r = await createCollection(input);
      if (!r.success) toast.error(r.error ?? "Lỗi khi tạo");
      return r as {
        success: boolean;
        error?: string;
        data?: VocabularyCollection;
      };
    },
    [createCollection],
  );

  const handleCreateCollectionSidebar = useCallback(
    async (name: string) => {
      const r = await createCollection({ name });
      if (!r.success) {
        throw new Error(r.error ?? "Lỗi khi tạo bộ sưu tập");
      }
    },
    [createCollection],
  );

  const handleDeleteCollection = useCallback(
    async (collection: VocabularyCollection) => {
      setPendingDeleteCollection(collection);
    },
    [],
  );

  const confirmDeleteCollection = useCallback(async () => {
    if (!pendingDeleteCollection) return;
    setIsDeleting(true);
    try {
      const r = await deleteCollection(pendingDeleteCollection.id);
      if (r.success) {
        toast.success(`Đã xóa bộ sưu tập "${pendingDeleteCollection.name}"`);
        setPendingDeleteCollection(null);
        // Reset filter if currently viewing this collection
        if (collectionFilter.kind === "collection" && collectionFilter.id === pendingDeleteCollection.id) {
          setCollectionFilter({ kind: "all" });
        }
      } else {
        toast.error(r.error ?? "Không thể xóa bộ sưu tập");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa bộ sưu tập",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDeleteCollection, deleteCollection, collectionFilter]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Decorative background elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-bl from-teal-100/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-100/20 to-transparent blur-3xl" />
      </div>

      <div className="flex gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <CollectionSidebar
              collections={collections}
              activeFilter={collectionFilter}
              totalCount={notebook.length}
              onSelect={setCollectionFilter}
              onCreateCollection={handleCreateCollectionSidebar}
              onDeleteCollection={handleDeleteCollection}
              tags={usedTags}
              activeTag={activeTag}
              onSelectTag={setActiveTag}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 py-8 space-y-6">
          {/* Header */}
          <header className="relative">
            {/* Header background */}
            <div className="absolute inset-x-0 -top-8 -bottom-4 -z-10 rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-emerald-500/5" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="relative">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30">
                    <BookOpen className="size-7 text-white" />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 scale-150 rounded-2xl bg-gradient-to-br from-teal-400/30 to-emerald-400/30 blur-xl -z-10" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Sổ từ vựng
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Lưu trữ và ôn tập những từ vựng bạn yêu thích
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-2 text-sm font-semibold text-teal-700 border-teal-200/50 shadow-sm"
                >
                  <BookOpen className="size-4 mr-1.5" />
                  {notebook.length} từ đã lưu
                </Badge>
              </div>
            </div>
          </header>

          {/* Search + Sort */}
          <SearchFilterBar
            searchInput={searchInput}
            sortBy={sortBy}
            hasActiveFilter={hasActiveFilter}
            selectedCount={selectedIds.size}
            filteredCount={sortedNotebook.length}
            totalCount={notebook.length}
            onSearchChange={setSearchInput}
            onSortChange={setSortBy}
            onClearFilters={clearFilters}
            onClearSelection={() => setSelectedIds(new Set())}
            onSelectAll={() => toggleAll(true)}
            searchRef={searchRef}
          />

          {/* Filter pills */}
          <FilterPillsBar
            filteredCount={sortedNotebook.length}
            totalCount={notebook.length}
            selectedCount={selectedIds.size}
            hasActiveFilter={hasActiveFilter}
            onClearFilters={clearFilters}
            onClearSelection={() => setSelectedIds(new Set())}
            onSelectAll={() => toggleAll(true)}
          />

          {/* Body */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : notebook.length === 0 ? (
            <EmptyState />
          ) : sortedNotebook.length === 0 ? (
            <NoResultsState
              hasActiveFilter={hasActiveFilter}
              searchQuery={debouncedSearch}
              onClear={clearFilters}
            />
          ) : (
            <>
              {/* Select all row */}
              <div className="flex items-center gap-3 px-1">
                <Checkbox
                  checked={
                    selectedIds.size === sortedNotebook.length &&
                    sortedNotebook.length > 0
                  }
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                  aria-label="Chọn tất cả"
                  className="data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-teal-500 data-[state=checked]:to-emerald-500 data-[state=checked]:border-teal-500 data-[state=checked]:shadow-lg data-[state=checked]:shadow-teal-500/30"
                />
                <span className="text-sm text-slate-500 font-medium">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} / ${sortedNotebook.length} đã chọn`
                    : `${sortedNotebook.length} từ`}
                </span>
              </div>

              {/* Card grid */}
              <div className="grid grid-cols-1 gap-4">
                {sortedNotebook.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="animate-slideUp"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                  >
                    <VocabularyCard
                      entry={entry}
                      collections={collections}
                      allTags={usedTags}
                      isSelected={selectedIds.has(entry.vocabulary.id)}
                      onToggleSelect={() =>
                        toggleSelection(entry.vocabulary.id)
                      }
                      onRequestDelete={() => requestDelete(entry)}
                      onUpdateTags={(vocabularyId: string, next: string[]) =>
                        updateTags(vocabularyId, next)
                      }
                      onUpdateNote={(vocabularyId: string, note: string) =>
                        updateNote(vocabularyId, note)
                      }
                      onAddToCollection={(colId: string, vocabId: string) =>
                        addToCollection(colId, vocabId)
                      }
                      onRemoveFromCollection={(colId: string, vocabId: string) =>
                        removeFromCollection(colId, vocabId)
                      }
                      onCreateCollection={handleCreateCollection}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Shortcut hint */}
          {notebook.length > 0 && (
            <div className="flex items-center justify-center gap-6 py-4">
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <kbd className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-semibold text-slate-600 shadow-sm">/</kbd>
                <span>Tìm kiếm</span>
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <kbd className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-semibold text-slate-600 shadow-sm">?</kbd>
                <span>Phím tắt</span>
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <kbd className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono font-semibold text-slate-600 shadow-sm">Esc</kbd>
                <span>Bỏ chọn</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.size}
        collections={collections}
        onClear={() => setSelectedIds(new Set())}
        onRemove={handleBulkRemove}
        onAddToCollection={handleBulkAddToCollection}
      />

      {/* Shortcut modal */}
      <ShortcutHelpModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100">
                  <Trash2 className="size-4 text-red-600" />
                </div>
                Xóa khỏi sổ tay?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-slate-600 py-2">
              Bạn có chắc muốn xóa{" "}
              {selectedIds.size > 0 &&
              selectedIds.has(pendingDelete?.vocabulary.id ?? "")
                ? `${selectedIds.size} từ`
                : `từ "${pendingDelete?.vocabulary.word}"`}{" "}
              khỏi sổ tay? Hành động này không thể hoàn tác.
            </p>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Hủy</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/25"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Xóa
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPopup>
      </AlertDialog>

      {/* Delete collection confirmation */}
      <AlertDialog
        open={pendingDeleteCollection !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDeleteCollection(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100">
                  <Trash2 className="size-4 text-red-600" />
                </div>
                Xóa bộ sưu tập?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-slate-600 py-2">
              Bạn có chắc muốn xóa bộ sưu tập{" "}
              <span className="font-semibold text-slate-700">"{pendingDeleteCollection?.name}"</span>?{" "}
              {pendingDeleteCollection && pendingDeleteCollection._count > 0 ? (
                <>Bộ sưu tập này chứa <span className="font-semibold">{pendingDeleteCollection._count}</span> từ vựng. Từ vựng sẽ không bị xóa khỏi sổ tay.</>
              ) : (
                <>Từ vựng trong bộ sưu tập sẽ không bị xóa khỏi sổ tay.</>
              )}
            </p>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Hủy</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={confirmDeleteCollection}
                disabled={isDeleting}
                className="rounded-xl bg-gradient-to-r from-white-500 to-white-500 hover:from-white-600 hover:to-white-600 shadow-lg shadow-red-500/25"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Xóa bộ sưu tập
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
