/**
 * VocabularyCard — single vocabulary entry card
 * Premium design with gradient accents, smooth animations, and visual depth
 */

import { useState } from "react";
import { Star, Trash2, ChevronDown, ChevronUp, FileText, Folder, Sparkles } from "lucide-react";
import type {
  UserNotebookEntry,
  VocabularyCollection,
} from "@/features/vocabulary/hooks/useVocabulary";
import type { ActionResult } from "@/features/learning-content/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { PronunciationTooltip } from "../pronunciation-tooltip";
import { TagEditor } from "../tag-editor";
import { NoteEditor } from "../note-editor";
import { CollectionPicker } from "../collection-picker";
import { formatRelativeTime } from "./notebook-utils";

interface VocabularyCardProps {
  entry: UserNotebookEntry;
  collections: VocabularyCollection[];
  allTags: string[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onRequestDelete: () => void;
  onUpdateTags: (
    vocabularyId: string,
    next: string[],
  ) => Promise<{ success: boolean; error?: string }>;
  onUpdateNote: (
    vocabularyId: string,
    note: string,
  ) => Promise<ActionResult>;
  onAddToCollection: (
    colId: string,
    vocabId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onRemoveFromCollection: (
    colId: string,
    vocabId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onCreateCollection: (input: {
    name: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    data?: VocabularyCollection;
  }>;
}

export function VocabularyCard({
  entry,
  collections,
  allTags,
  isSelected,
  onToggleSelect,
  onRequestDelete,
  onUpdateTags,
  onUpdateNote,
  onAddToCollection,
  onRemoveFromCollection,
  onCreateCollection,
}: VocabularyCardProps) {
  const vocab = entry.vocabulary;
  const tags = (entry.tags ?? []) as string[];
  const isMastered = entry.masteredAt !== null;
  const entryCollections = (entry.collections ?? []) as string[];
  const isDue =
    entry.review && new Date(entry.review.dueAt).getTime() <= Date.now();

  // Collapsible details
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = tags.length > 0 || entry.note || entryCollections.length > 0;

  // Get collection names for display
  const entryCollectionNames = collections
    .filter((c) => entryCollections.includes(c.id))
    .map((c) => ({ id: c.id, name: c.name, color: c.color }));

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-teal-500/10",
        "hover:-translate-y-0.5",
        isSelected
          ? "border-teal-400/50 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 shadow-lg shadow-teal-500/20 ring-2 ring-teal-300/50"
          : "border-slate-200/60 hover:border-teal-200/80",
        isMastered && "bg-gradient-to-br from-amber-50/30 via-white to-yellow-50/20"
      )}
    >
      {/* Decorative gradient accent */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r transition-opacity duration-300",
        isSelected ? "opacity-100 from-teal-400 via-emerald-400 to-teal-400" : "opacity-0",
        !isSelected && "group-hover:opacity-100 from-teal-300/0 via-teal-400/60 to-teal-300/0"
      )} />

      {/* Mastered shimmer effect */}
      {isMastered && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(251,191,36,0.08),transparent)] animate-shimmer" />
      )}

      {/* Main content */}
      <div className="p-4">
        {/* Top row: checkbox + word info */}
        <div className="flex items-start gap-3">
          {/* Checkbox with enhanced styling */}
          <div className="mt-1 shrink-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className={cn(
                "border-2 transition-all duration-200",
                isSelected
                  ? "border-teal-500 bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30"
                  : "border-slate-300 hover:border-teal-400 hover:shadow-sm hover:shadow-teal-200/50",
              )}
              aria-label={`Chọn từ ${vocab.word}`}
            />
          </div>

          {/* Word info */}
          <div className="min-w-0 flex-1">
            {/* Word + level + part of speech */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {vocab.word}
              </h3>
              {vocab.level && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-bold border",
                    vocab.level.startsWith("A")
                      ? "border-green-300/80 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-sm"
                      : vocab.level.startsWith("B")
                        ? "border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 shadow-sm"
                        : "border-red-300/80 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 shadow-sm",
                  )}
                >
                  {vocab.level}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="text-xs uppercase tracking-wider font-medium bg-slate-100/80 text-slate-500"
              >
                {vocab.partOfSpeech}
              </Badge>
            </div>

            {/* Phonetic */}
            {vocab.phonetic && (
              <div className="mt-1.5">
                <PronunciationTooltip phonetic={vocab.phonetic} />
              </div>
            )}

            {/* Meaning with enhanced typography */}
            <p className="mt-2.5 text-slate-600/90 leading-relaxed text-sm">
              {vocab.meaning}
            </p>

            {/* Status badges with enhanced styling */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isMastered ? (
                <Badge className="gap-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200/50 shadow-sm">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="font-semibold">Đã thuộc</span>
                </Badge>
              ) : isDue ? (
                <Badge variant="outline" className="gap-1.5 border-amber-300/60 bg-gradient-to-r from-amber-50/80 to-orange-50/80 text-amber-700 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  <span className="font-medium">Cần ôn</span>
                </Badge>
              ) : entry.review ? (
                <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-blue-600 border-blue-200/50 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  <span className="font-medium">Đang học</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1.5 bg-slate-100 text-slate-500 border-slate-200/50 shadow-sm">
                  <span className="font-medium">Mới</span>
                </Badge>
              )}
              {vocab.topic && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100/60 text-slate-400 font-medium">
                  {vocab.topic}
                </span>
              )}
              {/* Show up to 2 collection badges inline */}
              {entryCollectionNames.length > 0 && (
                <>
                  {entryCollectionNames.slice(0, 2).map((col) => (
                    <span
                      key={col.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/50"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full ring-1 ring-white shadow-sm"
                        style={{ backgroundColor: col.color ?? "#94a3b8" }}
                      />
                      <span className="truncate max-w-[100px]">{col.name}</span>
                    </span>
                  ))}
                  {entryCollectionNames.length > 2 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100/60 text-slate-400 font-medium">
                      +{entryCollectionNames.length - 2}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions with enhanced hover */}
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRequestDelete}
              aria-label={`Xóa ${vocab.word}`}
              className="text-slate-400 hover:bg-red-50 hover:text-red-600 hover:scale-110 active:scale-95 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100/80 pt-3">
          <span className="text-xs text-slate-400/80 font-medium">
            Lưu {formatRelativeTime(entry.savedAt)}
          </span>

          {/* Toggle details */}
          {hasDetails && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 transition-all duration-200 hover:text-teal-700 hover:bg-teal-50 px-2.5 py-1 rounded-full hover:shadow-sm"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Chi tiết</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible details with glassmorphism */}
      {showDetails && hasDetails && (
        <div className="border-t border-slate-100/80 bg-gradient-to-b from-slate-50/50 to-white/80 backdrop-blur-sm p-4">
          <div className="space-y-4">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="animate-fadeIn">
                <TagEditor
                  vocabularyId={vocab.id}
                  initialTags={tags}
                  availableTags={allTags}
                  onSave={onUpdateTags}
                />
              </div>
            )}

            {/* Note */}
            {entry.note && (
              <div className="animate-fadeIn">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <FileText className="h-4 w-4" />
                  <span>Ghi chú</span>
                </div>
                <NoteEditor
                  vocabularyId={vocab.id}
                  initialNote={entry.note ?? null}
                  onSave={onUpdateNote}
                />
              </div>
            )}

            {/* Collections */}
            {entryCollections.length > 0 && (
              <div className="animate-fadeIn">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Folder className="h-4 w-4" />
                  <span>Bộ sưu tập</span>
                </div>
                
                {/* Display current collections inline */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {entryCollectionNames.map((col) => (
                    <span
                      key={col.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/50 hover:shadow-md transition-shadow"
                    >
                      <span
                        className="h-2 w-2 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: col.color ?? "#94a3b8" }}
                      />
                      {col.name}
                    </span>
                  ))}
                </div>

                {/* Collection picker button */}
                <CollectionPicker
                  vocabularyId={vocab.id}
                  collections={collections}
                  currentCollectionIds={entryCollections}
                  onAdd={onAddToCollection}
                  onRemove={onRemoveFromCollection}
                  onCreate={onCreateCollection}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed quick info (when details hidden) */}
      {!showDetails && hasDetails && (
        <div className="border-t border-slate-100/60 bg-slate-50/30 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {tags.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-semibold text-teal-600">{tags.length}</span>
                <span>tag</span>
              </span>
            )}
            {entry.note && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <FileText className="h-3.5 w-3.5" />
                <span>Ghi chú</span>
              </span>
            )}
            {entryCollectionNames.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Folder className="h-3.5 w-3.5" />
                <span>{entryCollectionNames.length} bộ sưu tập</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
