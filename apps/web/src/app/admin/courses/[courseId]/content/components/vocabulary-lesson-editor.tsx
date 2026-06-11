"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface VocabularyItem {
  id?: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
  example: string;
  notes: string;
  status?: string;
}

interface VocabularyLessonEditorProps {
  lessonId?: string;
  initialVocabulary?: VocabularyItem[];
  onVocabularyChange?: (vocabulary: VocabularyItem[]) => void;
  onSave?: (vocabulary: VocabularyItem[]) => Promise<void>;
  isSaving?: boolean;
}

const PART_OF_SPEECH_OPTIONS = [
  { value: "noun", label: "Danh từ", color: "bg-blue-100 text-blue-700" },
  { value: "verb", label: "Động từ", color: "bg-red-100 text-red-700" },
  { value: "adjective", label: "Tính từ", color: "bg-green-100 text-green-700" },
  { value: "adverb", label: "Trạng từ", color: "bg-purple-100 text-purple-700" },
  { value: "preposition", label: "Giới từ", color: "bg-yellow-100 text-yellow-700" },
  { value: "conjunction", label: "Liên từ", color: "bg-pink-100 text-pink-700" },
  { value: "pronoun", label: "Đại từ", color: "bg-indigo-100 text-indigo-700" },
  { value: "determiner", label: "Mạo từ", color: "bg-teal-100 text-teal-700" },
  { value: "exclamation", label: "Thán từ", color: "bg-orange-100 text-orange-700" },
];

const EMPTY_VOCABULARY: VocabularyItem = {
  word: "",
  meaning: "",
  partOfSpeech: "noun",
  phonetic: "",
  example: "",
  notes: "",
};

export function VocabularyLessonEditor({
  lessonId,
  initialVocabulary = [],
  onVocabularyChange,
  onSave,
  isSaving = false,
}: VocabularyLessonEditorProps) {
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>(initialVocabulary);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingForm, setEditingForm] = useState<VocabularyItem>(EMPTY_VOCABULARY);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const getPartOfSpeechConfig = (pos: string) => {
    return PART_OF_SPEECH_OPTIONS.find((p) => p.value === pos) || PART_OF_SPEECH_OPTIONS[0];
  };

  const handleAddNew = () => {
    setEditingForm(EMPTY_VOCABULARY);
    setIsAddingNew(true);
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setEditingForm(vocabularyList[index]);
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  const handleCancel = () => {
    setEditingForm(EMPTY_VOCABULARY);
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const handleSave = () => {
    if (!editingForm.word.trim() || !editingForm.meaning.trim()) {
      return;
    }

    const updatedList = [...vocabularyList];
    if (editingIndex !== null) {
      updatedList[editingIndex] = { ...editingForm };
    } else {
      updatedList.push({ ...editingForm, id: `new-${Date.now()}` });
    }

    setVocabularyList(updatedList);
    onVocabularyChange?.(updatedList);
    handleCancel();
  };

  const handleDelete = (index: number) => {
    const updatedList = vocabularyList.filter((_, i) => i !== index);
    setVocabularyList(updatedList);
    onVocabularyChange?.(updatedList);
    if (editingIndex === index) {
      handleCancel();
    }
  };

  const handleSaveAll = async () => {
    if (onSave) {
      await onSave(vocabularyList);
    }
  };

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const filteredVocabulary = vocabularyList.filter(
    (vocab) =>
      vocab.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vocab.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Quản lý Từ vựng</h3>
              <p className="text-xs text-slate-500">
                Thêm và quản lý danh sách từ vựng cho bài học
              </p>
            </div>
          </div>
          <Button onClick={handleAddNew} className="gap-2 bg-teal-600 hover:bg-teal-700">
            <Plus className="size-4" />
            Thêm từ vựng
          </Button>
        </div>

        {/* Search */}
        {vocabularyList.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm từ vựng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAddingNew && (
        <VocabularyFormCard
          form={editingForm}
          onChange={setEditingForm}
          onSave={handleSave}
          onCancel={handleCancel}
          isNew={true}
        />
      )}

      {/* Vocabulary List */}
      <div className="space-y-3">
        {filteredVocabulary.length === 0 && vocabularyList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-teal-50 mb-4">
              <BookOpen className="size-8 text-teal-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              Chưa có từ vựng nào
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Bắt đầu bằng cách thêm từ vựng đầu tiên cho bài học này
            </p>
            <Button onClick={handleAddNew} size="sm" className="bg-teal-600 hover:bg-teal-700">
              <Plus className="size-4 mr-1.5" />
              Thêm từ vựng đầu tiên
            </Button>
          </div>
        ) : filteredVocabulary.length === 0 && searchQuery ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">
              Không tìm thấy từ vựng nào phù hợp với "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-indigo-600 hover:underline mt-1"
            >
              Xóa tìm kiếm
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{filteredVocabulary.length} từ vựng</span>
              {searchQuery && (
                <span className="text-indigo-600">
                  (lọc từ {vocabularyList.length} từ vựng)
                </span>
              )}
            </div>

            {/* Cards Grid */}
            <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
              {filteredVocabulary.map((vocab, index) => (
                <VocabularyCard
                  key={vocab.id || index}
                  vocab={vocab}
                  index={index}
                  isEditing={editingIndex === index}
                  isExpanded={expandedCards.has(index)}
                  partOfSpeechConfig={getPartOfSpeechConfig(vocab.partOfSpeech)}
                  onEdit={() => handleEdit(index)}
                  onDelete={() => handleDelete(index)}
                  onSave={() => {
                    if (editingIndex === index) handleSave();
                  }}
                  onCancel={handleCancel}
                  editingForm={editingIndex === index ? editingForm : undefined}
                  onEditingFormChange={setEditingForm}
                  onToggleExpand={() => toggleExpand(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Save All Button */}
      {vocabularyList.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button
            onClick={handleSaveAll}
            disabled={isSaving || vocabularyList.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? "Đang lưu..." : "Lưu tất cả từ vựng"}
          </Button>
        </div>
      )}
    </div>
  );
}

// Vocabulary Form Card for adding/editing
function VocabularyFormCard({
  form,
  onChange,
  onSave,
  onCancel,
  isNew,
}: {
  form: VocabularyItem;
  onChange: (form: VocabularyItem) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const updateField = (field: keyof VocabularyItem, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Card className="border-teal-200 bg-teal-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            {isNew ? "Thêm từ vựng mới" : "Chỉnh sửa từ vựng"}
          </p>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Từ vựng *</label>
            <Input
              placeholder="VD: comfortable"
              value={form.word}
              onChange={(e) => updateField("word", e.target.value)}
              className="border-teal-200 focus:border-teal-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Từ loại *</label>
            <select
              className="h-10 w-full rounded-lg border border-teal-200 bg-white px-3 text-sm focus:border-teal-400"
              value={form.partOfSpeech}
              onChange={(e) => updateField("partOfSpeech", e.target.value)}
            >
              {PART_OF_SPEECH_OPTIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Nghĩa *</label>
          <Input
            placeholder="VD: thoải mái, dễ chịu"
            value={form.meaning}
            onChange={(e) => updateField("meaning", e.target.value)}
            className="border-teal-200 focus:border-teal-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Phiên âm</label>
          <Input
            placeholder="VD: /ˈkʌmftəbl/"
            value={form.phonetic}
            onChange={(e) => updateField("phonetic", e.target.value)}
            className="border-teal-200 focus:border-teal-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Ví dụ</label>
          <Textarea
            placeholder="VD: The hotel room was very comfortable."
            value={form.example}
            onChange={(e) => updateField("example", e.target.value)}
            className="resize-none min-h-20 border-teal-200 focus:border-teal-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Ghi chú</label>
          <Textarea
            placeholder="Ghi chú bổ sung..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="resize-none min-h-16 border-teal-200 focus:border-teal-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            onClick={onSave}
            disabled={!form.word.trim() || !form.meaning.trim()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isNew ? "Thêm" : "Lưu"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Vocabulary Display Card
function VocabularyCard({
  vocab,
  index,
  isEditing,
  isExpanded,
  partOfSpeechConfig,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  editingForm,
  onEditingFormChange,
  onToggleExpand,
}: {
  vocab: VocabularyItem;
  index: number;
  isEditing: boolean;
  isExpanded: boolean;
  partOfSpeechConfig: { value: string; label: string; color: string };
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  editingForm?: VocabularyItem;
  onEditingFormChange?: (form: VocabularyItem) => void;
  onToggleExpand: () => void;
}) {
  if (isEditing && editingForm && onEditingFormChange) {
    return (
      <Card className="border-teal-200 bg-teal-50/50">
        <CardContent className="p-4 space-y-3">
          <VocabularyFormCard
            form={editingForm}
            onChange={onEditingFormChange}
            onSave={onSave}
            onCancel={onCancel}
            isNew={false}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-teal-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 text-lg">{vocab.word}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${partOfSpeechConfig.color}`}>
              {partOfSpeechConfig.label}
            </span>
          </div>
          {vocab.phonetic && (
            <p className="text-sm text-slate-500 italic mb-1">{vocab.phonetic}</p>
          )}
          <p className="text-slate-700">{vocab.meaning}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={onEdit}
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {vocab.example && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Ví dụ:</p>
              <p className="text-sm text-slate-600 italic">{vocab.example}</p>
            </div>
          )}
          {vocab.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Ghi chú:</p>
              <p className="text-sm text-slate-600">{vocab.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
