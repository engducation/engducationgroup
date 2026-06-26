"use client";

/**
 * CollectionPicker
 *
 * Popover that lets the user add/remove a vocabulary to/from one
 * or more collections. Also lets the user create a new collection inline.
 */

import { useCallback, useState } from "react";
import { FolderPlus, Globe, Lock, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { VocabularyCollection } from "@/features/vocabulary/hooks/useVocabulary";

export function CollectionPicker({
  vocabularyId,
  collections,
  currentCollectionIds,
  onAdd,
  onRemove,
  onCreate,
  onTogglePublic,
}: {
  vocabularyId: string;
  collections: VocabularyCollection[];
  currentCollectionIds: string[];
  onAdd: (
    collectionId: string,
    vocabularyId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onRemove: (
    collectionId: string,
    vocabularyId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onCreate: (input: { name: string }) => Promise<{
    success: boolean;
    error?: string;
    data?: VocabularyCollection;
  }>;
  onTogglePublic?: (
    collectionId: string,
    isPublic: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isMember = useCallback(
    (id: string) => currentCollectionIds.includes(id),
    [currentCollectionIds],
  );

  const handleToggle = useCallback(
    async (c: VocabularyCollection) => {
      setBusyId(c.id);
      try {
        if (isMember(c.id)) {
          const r = await onRemove(c.id, vocabularyId);
          if (!r.success) toast.error(r.error ?? "Lỗi");
        } else {
          const r = await onAdd(c.id, vocabularyId);
          if (!r.success) toast.error(r.error ?? "Lỗi");
        }
      } finally {
        setBusyId(null);
      }
    },
    [isMember, onAdd, onRemove, vocabularyId],
  );

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await onCreate({ name: newName.trim() });
      if (!r.success) {
        toast.error(r.error ?? "Lỗi khi tạo");
      } else {
        setNewName("");
        if (r.data) {
          const add = await onAdd(r.data.id, vocabularyId);
          if (add.success) toast.success("Đã tạo & thêm vào bộ sưu tập");
        }
      }
    } finally {
      setCreating(false);
    }
  }, [newName, onCreate, onAdd, vocabularyId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
            "hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
            "transition-colors cursor-pointer",
          )}
        >
          {currentCollectionIds.length > 0 ? (
            <>
              <span className="flex h-4 w-4 items-center justify-center rounded bg-teal-100 text-teal-600">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Quản lý bộ sưu tập</span>
            </>
          ) : (
            <>
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300" />
              <span>Thêm vào bộ sưu tập</span>
            </>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-72 p-2"
      >
        <div className="mb-1 text-xs font-medium text-slate-500">
          Chọn bộ sưu tập
        </div>
        
        {/* Collections list */}
        <div className="max-h-48 overflow-y-auto">
          {collections.length === 0 ? (
            <p className="p-3 text-center text-xs text-slate-400">
              Chưa có bộ sưu tập nào.
            </p>
          ) : (
            <div className="space-y-0.5">
              {collections.map((c) => {
                const member = isMember(c.id);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                  >
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left text-sm"
                      onClick={() => void handleToggle(c)}
                      disabled={busyId === c.id}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          member
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {member && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color ?? "#94a3b8" }}
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-xs text-slate-400">{c._count}</span>
                    </button>
                    {onTogglePublic && (
                      <button
                        type="button"
                        onClick={() => void onTogglePublic(c.id, !c.isPublic)}
                        className="shrink-0 text-slate-400 hover:text-slate-600"
                        aria-label="Toggle public"
                      >
                        {c.isPublic ? (
                          <Globe className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create new */}
        <div className="mt-2 border-t pt-2">
          <div className="flex items-center gap-1.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
              placeholder="Tên bộ sưu tập mới..."
              className="h-7 text-xs"
              disabled={creating}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => void handleCreate()}
              disabled={!newName.trim() || creating}
              className="shrink-0"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
