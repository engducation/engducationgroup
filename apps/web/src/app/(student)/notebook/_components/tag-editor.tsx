"use client";

/**
 * TagEditor
 *
 * Inline tag editor. Type a tag and press Enter or comma to commit.
 * Up to 10 tags, each ≤ 30 chars.
 */

import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MAX_TAGS = 10;
const MAX_LEN = 30;

function normalize(t: string): string {
  return t.toLowerCase().trim();
}

export function TagEditor({
  vocabularyId,
  initialTags,
  availableTags,
  onSave,
}: {
  vocabularyId: string;
  initialTags: string[];
  availableTags: string[];
  onSave: (vocabularyId: string, next: string[]) => Promise<{ success: boolean; error?: string }>;
}) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const commitInput = useCallback(async () => {
    const t = normalize(input);
    if (!t) {
      setInput("");
      return;
    }
    if (t.length > MAX_LEN) {
      toast.error(`Tag tối đa ${MAX_LEN} ký tự`);
      return;
    }
    if (tags.includes(t)) {
      setInput("");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(`Tối đa ${MAX_TAGS} tag`);
      return;
    }
    const next = [...tags, t];
    setTags(next);
    setInput("");
    setSaving(true);
    const r = await onSave(vocabularyId, next);
    setSaving(false);
    if (!r.success) {
      setTags(tags);
      toast.error(r.error ?? "Lỗi khi lưu tag");
    }
  }, [input, tags, vocabularyId, onSave]);

  const removeTag = useCallback(
    async (t: string) => {
      const next = tags.filter((x) => x !== t);
      setTags(next);
      setSaving(true);
      const r = await onSave(vocabularyId, next);
      setSaving(false);
      if (!r.success) {
        setTags(tags);
        toast.error(r.error ?? "Lỗi khi xóa tag");
      }
    },
    [tags, vocabularyId, onSave],
  );

  // Suggested tags that aren't already selected.
  const suggestions = availableTags.filter((t) => !tags.includes(t)).slice(0, 8);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 pr-1">
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="ml-1 rounded-full p-0.5 hover:bg-slate-200"
              aria-label={`Bỏ tag ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                void commitInput();
              }
            }}
            placeholder="Thêm tag..."
            className="h-7 w-32 px-2 text-xs"
            disabled={saving}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => void commitInput()}
            disabled={saving || !input.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="text-slate-400">Gợi ý:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 hover:bg-slate-200"
              onClick={() => {
                setInput(s);
                void commitInput();
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}