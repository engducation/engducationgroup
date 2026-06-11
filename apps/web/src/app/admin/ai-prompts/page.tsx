"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApi } from "@/features/admin/api/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

interface AiPrompt {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

interface PromptFormData {
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: string;
  maxTokens: string;
}

const EMPTY_FORM: PromptFormData = {
  name: "",
  description: "",
  systemPrompt: "",
  userPromptTemplate: "",
  temperature: "0.7",
  maxTokens: "1000",
};

export default function AiPromptsPage() {
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AiPrompt | null>(null);
  const [formData, setFormData] = useState<PromptFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAiPrompts();
      setPrompts(data as AiPrompt[]);
    } catch (error) {
      toast.error("Không thể tải danh sách AI Prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const openCreateDialog = () => {
    setEditingPrompt(null);
    setFormData(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEditDialog = (prompt: AiPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || "",
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      temperature: String(prompt.temperature),
      maxTokens: String(prompt.maxTokens),
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.systemPrompt || !formData.userPromptTemplate) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        systemPrompt: formData.systemPrompt,
        userPromptTemplate: formData.userPromptTemplate,
        temperature: parseFloat(formData.temperature) || 0.7,
        maxTokens: parseInt(formData.maxTokens) || 1000,
      };

      if (editingPrompt) {
        await adminApi.updateAiPrompt(editingPrompt.id, payload);
        toast.success("Đã cập nhật AI Prompt");
      } else {
        await adminApi.createAiPrompt(payload);
        toast.success("Đã tạo AI Prompt mới");
      }

      setSheetOpen(false);
      loadPrompts();
    } catch (error) {
      toast.error("Không thể lưu AI Prompt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa AI Prompt này?")) return;

    try {
      await adminApi.deleteAiPrompt(id);
      toast.success("Đã xóa AI Prompt");
      loadPrompts();
    } catch (error) {
      toast.error("Không thể xóa AI Prompt");
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Bot className="size-5 text-white" />
            </div>
            AI Prompts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các mẫu prompt AI cho bài tập Writing
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="size-4 mr-2" />
          Thêm Prompt
        </Button>
      </div>

      {/* Prompts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            Danh sách Prompt ({prompts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                <Bot className="size-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Chưa có AI Prompt nào</p>
              <p className="text-xs text-slate-400 mb-4">
                Tạo prompt đầu tiên để bắt đầu
              </p>
              <Button onClick={openCreateDialog} variant="outline" size="sm">
                <Plus className="size-3.5 mr-1.5" />
                Tạo Prompt
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mô tả</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[100px]">Temp</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[100px]">Tokens</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[120px]">Ngày tạo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[120px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((prompt, index) => (
                    <tr 
                      key={prompt.id} 
                      className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"} hover:bg-slate-50`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{prompt.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-500 max-w-[300px] truncate">
                          {prompt.description || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{prompt.temperature}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{prompt.maxTokens}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {formatDate(prompt.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                              copyToClipboard(prompt.systemPrompt, `${prompt.id}-system`)
                            }
                            title="Sao chép System Prompt"
                          >
                            {copiedId === `${prompt.id}-system` ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEditDialog(prompt)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(prompt.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[540px] sm:max-w-[540px] overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-lg font-semibold">
              {editingPrompt ? "Chỉnh sửa AI Prompt" : "Tạo AI Prompt mới"}
            </SheetTitle>
            <SheetDescription>
              {editingPrompt
                ? "Cập nhật thông tin prompt cho bài tập Writing"
                : "Tạo prompt mới để sử dụng cho các bài tập Writing"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">
                Tên Prompt <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prompt-name"
                placeholder="VD: IELTS Writing Task 1 - Academic"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt-description">Mô tả</Label>
              <Textarea
                id="prompt-description"
                placeholder="Mô tả ngắn về prompt này (sẽ hiển thị khi chọn trong Writing form)"
                className="resize-none min-h-[70px]"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-prompt">
                System Prompt <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="system-prompt"
                placeholder="Nhập system prompt cho AI..."
                className="resize-none min-h-[150px] font-mono text-sm"
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Hướng dẫn AI cách xử lý và phản hồi yêu cầu của người dùng
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-prompt-template">
                User Prompt Template <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="user-prompt-template"
                placeholder="Nhập template cho user prompt. Sử dụng {'{user_input}'} để đánh dấu vị trí nhập liệu của người dùng."
                className="resize-none min-h-[150px] font-mono text-sm"
                value={formData.userPromptTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, userPromptTemplate: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Template cho người dùng nhập. Dùng {"{user_input}"} làm placeholder cho nội dung user
              </p>
            </div>

            <div className="grid gap-5 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  placeholder="0.7"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Kiểm soát tính ngẫu nhiên của phản hồi (0-2)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="100"
                  max="10000"
                  placeholder="1000"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData({ ...formData, maxTokens: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Số token tối đa cho phản hồi
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t mt-auto">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : editingPrompt ? (
                  "Cập nhật"
                ) : (
                  "Tạo Prompt"
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
