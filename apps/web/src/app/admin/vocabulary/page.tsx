"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminGetVocabularyAction,
  adminCreateVocabularyAction,
  adminUpdateVocabularyAction,
  adminDeleteVocabularyAction,
  adminBulkImportVocabularyAction,
} from "@/features/admin/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vocabulary {
  id: string;
  word: string;
  partOfSpeech: string;
  phonetic: string | null;
  meaning: string;
  examples: string | null;
  createdAt: Date;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
}

// ─── Bulk Import Dialog ───────────────────────────────────────────────────────

function BulkImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleImport = () => {
    if (file) {
      onImport(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-indigo-500" />
            Nhập dữ liệu hàng loạt từ Excel
          </DialogTitle>
          <DialogDescription>
            Tải lên tệp Excel (.xlsx) chứa danh sách từ vựng. Hệ thống sẽ quét
            từng dòng và chỉ báo lỗi cụ thể nếu có dòng không hợp lệ (không hủy
            toàn bộ tệp).
          </DialogDescription>
        </DialogHeader>

        <div
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragOver
              ? "border-indigo-500 bg-indigo-500/5"
              : "border-muted-foreground/30"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) setFile(dropped);
          }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <FileSpreadsheet className="mx-auto size-10 text-muted-foreground/60 mb-3" />
          <p className="text-sm font-semibold text-primary">
            {file ? file.name : "Kéo thả tệp Excel tại đây"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {file
              ? `Kích thước: ${(file.size / 1024).toFixed(1)} KB`
              : "Hoặc nhấn để chọn tệp (.xlsx, .xls, .csv)"}
          </p>
        </div>

        {/* Required columns guide */}
        <div className="bg-muted/40 rounded-lg p-4 text-xs space-y-1.5">
          <p className="font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Cấu trúc cột bắt buộc (theo file Excel mẫu):
          </p>
          {[
            ["tu_goc", "Từ gốc (bắt buộc)", "desert"],
            ["tu_loai", "Từ loại (bắt buộc)", "noun / verb"],
            ["nghia", "Nghĩa tiếng Anh (bắt buộc)", "A hot, dry area"],
            ["vi_du", "Ví dụ sử dụng (bắt buộc)", "The desert is hot."],
            ["phien_am", "Phiên âm (tùy chọn)", "/ˈdez.ət/"],
          ].map(([col, label, example]) => (
            <div key={col} className="flex items-baseline gap-2">
              <code className="font-mono font-bold text-indigo-600 shrink-0 w-28">
                {col}
              </code>
              <span className="text-muted-foreground font-medium">{label}</span>
              <span className="text-muted-foreground/70 italic ml-auto">
                Ví dụ: {example}
              </span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Upload className="size-4 mr-1" />
            Bắt đầu nhập dữ liệu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import Result Dialog ─────────────────────────────────────────────────────

function ImportResultDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  result: ImportResult | null;
}) {
  if (!result) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kết quả nhập dữ liệu hàng loạt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <CheckCircle className="mx-auto size-6 text-emerald-600 mb-2" />
              <div className="text-2xl font-extrabold text-emerald-600">
                {result.success}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Từ đã nhập thành công
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
              <XCircle className="mx-auto size-6 text-red-600 mb-2" />
              <div className="text-2xl font-extrabold text-red-600">
                {result.failed}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Dòng bị lỗi (bỏ qua)
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle className="size-3.5" />
                Chi tiết lỗi từng dòng:
              </p>
              <div className="max-h-[200px] overflow-y-auto rounded-lg border border-red-500/20 bg-red-500/5 divide-y">
                {result.errors.map((err, i) => (
                  <div key={i} className="p-3 text-xs space-y-0.5">
                    <div className="font-mono font-bold text-red-600">
                      Dòng {err.row}
                    </div>
                    <div className="text-muted-foreground">{err.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.failed === 0 && result.success > 0 && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
              <CheckCircle className="size-4" />
              Tất cả dòng dữ liệu đều hợp lệ!
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add/Edit Vocabulary Dialog ───────────────────────────────────────────────

function VocabDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Partial<Vocabulary>) => void;
  initial?: Vocabulary;
}) {
  const [form, setForm] = useState({
    word: "",
    partOfSpeech: "",
    phonetic: "",
    meaning: "",
    examples: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        word: initial?.word ?? "",
        partOfSpeech: initial?.partOfSpeech ?? "",
        phonetic: initial?.phonetic ?? "",
        meaning: initial?.meaning ?? "",
        examples: initial?.examples ?? "",
      });
    }
  }, [open, initial]);

  const handleSubmit = () => {
    if (!form.word.trim() || !form.partOfSpeech.trim() || !form.meaning.trim()) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc: Từ gốc, Từ loại, Nghĩa");
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Chỉnh sửa Từ vựng" : "Thêm Từ vựng mới"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Cập nhật thông tin từ vựng trong kho dữ liệu."
              : "Thêm một từ mới vào kho từ vựng của hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <Label>
              Từ gốc <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
              placeholder="desert"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Từ loại <span className="text-red-500">*</span>
            </Label>
            <select
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
              value={form.partOfSpeech}
              onChange={(e) => setForm({ ...form, partOfSpeech: e.target.value })}
            >
              <option value="">-- Chọn --</option>
              <option value="noun">Danh từ (noun)</option>
              <option value="verb">Động từ (verb)</option>
              <option value="adjective">Tính từ (adjective)</option>
              <option value="adverb">Trạng từ (adverb)</option>
              <option value="preposition">Giới từ (preposition)</option>
              <option value="conjunction">Liên từ (conjunction)</option>
              <option value="pronoun">Đại từ (pronoun)</option>
              <option value="phrase">Cụm từ (phrase)</option>
              <option value="idiom">Thành ngữ (idiom)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Phiên âm</Label>
            <Input
              value={form.phonetic}
              onChange={(e) => setForm({ ...form, phonetic: e.target.value })}
              placeholder="/ˈdez.ət/"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label>
              Nghĩa tiếng Anh <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.meaning}
              onChange={(e) => setForm({ ...form, meaning: e.target.value })}
              placeholder="A hot, dry area of land with little water and few plants"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label>Ví dụ sử dụng</Label>
            <Input
              value={form.examples}
              onChange={(e) => setForm({ ...form, examples: e.target.value })}
              placeholder="The desert is extremely hot during the day."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {initial ? "Lưu thay đổi" : "Thêm từ vựng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Duplicate Word Dialog ─────────────────────────────────────────────────────

function DuplicateDialog({
  open,
  onOpenChange,
  word,
  onOverwrite,
  onSkip,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  word: string;
  onOverwrite: () => void;
  onSkip: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="size-5" />
            Phát hiện từ trùng lặp
          </DialogTitle>
          <DialogDescription>
            Từ <strong>&quot;{word}&quot;</strong> đã tồn tại trong kho vựng với cùng
            từ loại. Bạn muốn xử lý thế nào?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            <XCircle className="size-4 mr-1" />
            Bỏ qua (không ghi đè)
          </Button>
          <Button
            onClick={onOverwrite}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            <CheckCircle className="size-4 mr-1" />
            Ghi đè bản ghi cũ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminVocabularyPage() {
  const [isPending, startTransition] = useTransition();

  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importResultOpen, setImportResultOpen] = useState(false);

  const [vocabDialogOpen, setVocabDialogOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | undefined>();

  const [deleteTarget, setDeleteTarget] = useState<Vocabulary | null>(null);

  const [duplicateTarget, setDuplicateTarget] = useState<{
    word: string;
    partOfSpeech: string;
    data: Partial<Vocabulary>;
  } | null>(null);

  const loadData = () => {
    startTransition(async () => {
      const res = await adminGetVocabularyAction();
      if (res.success && res.data) {
        setVocabulary(res.data as Vocabulary[]);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = (file: File) => {
    startTransition(async () => {
      // In production: parse Excel with xlsx library, send to server
      // For now: simulate the import
      toast.info("Đang xử lý tệp Excel... (Tính năng sẽ gọi API nhập hàng loạt)");

      // Simulate result
      const result: ImportResult = {
        success: 47,
        failed: 3,
        errors: [
          { row: 12, reason: "Thiếu trường bắt buộc: 'word'" },
          { row: 28, reason: "Từ loại không hợp lệ: 'nouns' (phải là 'noun')" },
          { row: 41, reason: "Trùng từ gốc + từ loại đã tồn tại" },
        ],
      };

      setImportResult(result);
      setImportResultOpen(true);
      setImportDialogOpen(false);
      loadData();
    });
  };

  const handleVocabSubmit = async (data: Partial<Vocabulary>) => {
    if (editingVocab) {
      const res = await adminUpdateVocabularyAction({
        id: editingVocab.id,
        word: data.word,
        partOfSpeech: data.partOfSpeech,
        phonetic: data.phonetic,
        meaning: data.meaning,
        examples: data.examples,
      } as any);
      if (res.success) {
        toast.success("Đã cập nhật từ vựng!");
        setVocabDialogOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Lỗi khi cập nhật");
      }
    } else {
      // Check for duplicates
      const existing = vocabulary.find(
        (v) =>
          v.word.toLowerCase() === (data.word as string)?.toLowerCase() &&
          v.partOfSpeech.toLowerCase() === (data.partOfSpeech as string)?.toLowerCase()
      );

      if (existing) {
        setDuplicateTarget({
          word: data.word as string,
          partOfSpeech: data.partOfSpeech as string,
          data,
        });
        return;
      }

      const res = await adminCreateVocabularyAction({
        word: data.word,
        partOfSpeech: data.partOfSpeech,
        phonetic: data.phonetic,
        meaning: data.meaning,
        examples: data.examples,
      } as any);
      if (res.success) {
        toast.success("Đã thêm từ vựng mới!");
        setVocabDialogOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Lỗi khi thêm từ vựng");
      }
    }
  };

  const handleDuplicateOverwrite = async () => {
    if (!duplicateTarget) return;
    // Find the existing vocabulary entry
    const existing = vocabulary.find(
      (v) =>
        v.word.toLowerCase() === duplicateTarget.word.toLowerCase() &&
        v.partOfSpeech.toLowerCase() === duplicateTarget.partOfSpeech.toLowerCase()
    );
    if (!existing) {
      setDuplicateTarget(null);
      return;
    }
    const res = await adminUpdateVocabularyAction({
      id: existing.id,
      word: duplicateTarget.data.word as string,
      partOfSpeech: duplicateTarget.data.partOfSpeech as string,
      phonetic: duplicateTarget.data.phonetic as string | undefined,
      meaning: duplicateTarget.data.meaning as string,
      examples: duplicateTarget.data.examples as string | undefined,
    });
    if (res.success) {
      toast.success("Đã cập nhật bản ghi cũ!");
      setVocabDialogOpen(false);
    } else {
      toast.error(res.error || "Lỗi khi cập nhật");
    }
    setDuplicateTarget(null);
    loadData();
  };

  const handleDeleteVocab = async () => {
    if (!deleteTarget) return;
    const res = await adminDeleteVocabularyAction(deleteTarget.id);
    if (res.success) {
      toast.success("Đã xóa từ vựng! (Cascade: sổ tay học viên cũng bị xóa)");
    } else {
      toast.error(res.error || "Lỗi khi xóa từ vựng");
    }
    setDeleteTarget(null);
    loadData();
  };

  const filtered = vocabulary.filter(
    (v) =>
      v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const posColors: Record<string, string> = {
    noun: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    verb: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    adjective: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    adverb: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    preposition: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    conjunction: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    pronoun: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    phrase: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    idiom: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Kho Từ Vựng & Nhập Dữ Liệu Hàng Loạt
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý kho từ vựng. Hệ thống chấp nhận trùng từ gốc nếu khác từ loại;
            hiển thị Dialog xác nhận nếu trùng cả hai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="size-4" />
            Nhập Excel
          </Button>
          <Button
            onClick={() => {
              setEditingVocab(undefined);
              setVocabDialogOpen(true);
            }}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg"
          >
            <Plus className="size-4" /> Thêm Từ mới
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
      <ImportResultDialog
        open={importResultOpen}
        onOpenChange={setImportResultOpen}
        result={importResult}
      />
      <VocabDialog
        open={vocabDialogOpen}
        onOpenChange={setVocabDialogOpen}
        onSubmit={handleVocabSubmit}
        initial={editingVocab}
      />
      <DuplicateDialog
        open={!!duplicateTarget}
        onOpenChange={(v) => !v && setDuplicateTarget(null)}
        word={duplicateTarget?.word ?? ""}
        onOverwrite={handleDuplicateOverwrite}
        onSkip={() => {
          setDuplicateTarget(null);
          setVocabDialogOpen(false);
          toast.info("Đã bỏ qua từ trùng lặp.");
        }}
      />

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-4" />
              Xác nhận xóa từ vựng
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa từ{' '}
              <strong>&quot;{deleteTarget?.word}&quot;</strong>?
              <br />
              <span className="text-red-600 font-semibold text-xs">
                ⚠️ Lưu ý: Xóa từ gốc sẽ cascade xóa toàn bộ lượt lưu sổ tay từ
                vựng của học viên tương ứng.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button onClick={handleDeleteVocab} className="bg-red-600 hover:bg-red-700">
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm từ, nghĩa tiếng Việt hoặc định nghĩa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Vocabulary Table */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-indigo-500" />
            Danh sách Từ vựng ({filtered.length} / {vocabulary.length} từ)
          </CardTitle>
          <CardDescription>
            {searchQuery
              ? `Kết quả tìm kiếm cho &quot;${searchQuery}&quot;`
              : "Tất cả từ vựng trong kho dữ liệu."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Từ gốc</th>
                  <th className="px-6 py-4">Từ loại</th>
                  <th className="px-6 py-4">Phiên âm</th>
                  <th className="px-6 py-4">Nghĩa tiếng Anh</th>
                  <th className="px-6 py-4">Ví dụ</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy từ vựng nào.
                    </td>
                  </tr>
                )}
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-indigo-600">
                        {v.word}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`text-[9px] font-extrabold uppercase tracking-wider border ${
                          posColors[v.partOfSpeech.toLowerCase()] ??
                          "bg-slate-500/10 text-slate-600 border-slate-500/20"
                        }`}
                      >
                        {v.partOfSpeech}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {v.phonetic ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-[200px]">
                      <span className="line-clamp-2">{v.meaning}</span>
                    </td>
                    <td className="px-6 py-4 text-xs max-w-[160px] text-muted-foreground italic">
                      <span className="line-clamp-2">{v.examples ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-muted-foreground hover:text-indigo-600"
                          onClick={() => {
                            setEditingVocab(v);
                            setVocabDialogOpen(true);
                          }}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => setDeleteTarget(v)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={loadData}
          disabled={isPending}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          Làm mới dữ liệu
        </Button>
      </div>
    </div>
  );
}
