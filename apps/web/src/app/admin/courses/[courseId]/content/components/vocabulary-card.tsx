"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

type WorkspaceVocabulary = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic?: string | null;
  example?: string | null;
  notes?: string | null;
  orderIndex: number;
  status: StatusValue;
};

interface VocabularyCardProps {
  item: WorkspaceVocabulary;
  onEdit: (item: WorkspaceVocabulary) => void;
  onDelete: (vocabularyId: string) => void;
}

export function VocabularyCard({ item, onEdit, onDelete }: VocabularyCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
      <div className="space-y-1 text-sm">
        <p className="font-medium text-slate-900">
          {item.word} · {item.meaning}
        </p>
        <p className="text-slate-500">
          {item.partOfSpeech}
          {item.example ? ` · ${item.example}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{item.status}</Badge>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => onEdit(item)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button size="icon-sm" variant="outline" onClick={() => onDelete(item.id)}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
