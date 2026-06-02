"use client";

import { useEffect, useState, useTransition } from "react";
import { nanoid } from "nanoid";
import {
  Sparkles,
  AlertTriangle,
  Coins,
  Settings2,
  Trash2,
  Edit,
  Plus,
  TrendingUp,
  Cpu,
  RefreshCw,
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
  adminGetPromptsAction,
  adminUpsertPromptAction,
  adminDeletePromptAction,
  adminUpdateGlobalLimitAction,
  adminGetSystemSettingsAction,
  adminGetAiCostAnalyticsAction,
} from "@/features/admin/actions";

interface AIPrompt {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}

interface AnalyticsData {
  errorRatePercent: number;
  totalCalls10m: number;
  errorCalls10m: number;
  courseCosts: Array<{
    courseId: string;
    courseTitle: string;
    totalTokens: number;
    totalCostUsd: number;
    callsCount: number;
  }>;
  exerciseCosts: Array<{
    writeId: string;
    promptText: string;
    totalTokens: number;
    totalCostUsd: number;
    callsCount: number;
  }>;
}

export default function AdminDashboardPage() {
  const [isPending, startTransition] = useTransition();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [globalLimit, setGlobalLimit] = useState<number>(20);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Edit / Add Prompt state
  const [editingPrompt, setEditingPrompt] = useState<Partial<AIPrompt> | null>(null);

  const loadData = () => {
    startTransition(async () => {
      // 1. Load Prompts
      const promptsRes = await adminGetPromptsAction();
      if (promptsRes.success && promptsRes.data) {
        setPrompts(promptsRes.data as AIPrompt[]);
      }

      // 2. Load System Settings
      const settingsRes = await adminGetSystemSettingsAction();
      if (settingsRes.success && settingsRes.data) {
        const limitVal = settingsRes.data.global_daily_limit;
        if (limitVal) setGlobalLimit(parseInt(limitVal, 10));
      }

      // 3. Load Cost Analytics
      const analyticsRes = await adminGetAiCostAnalyticsAction();
      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data as AnalyticsData);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateLimit = async () => {
    const res = await adminUpdateGlobalLimitAction(globalLimit);
    if (res.success) {
      toast.success("Đã cập nhật hạn mức AI toàn cục thành công!");
    } else {
      toast.error(res.error || "Lỗi khi cập nhật hạn mức");
    }
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt?.id || !editingPrompt?.name || !editingPrompt?.systemPrompt || !editingPrompt?.userPromptTemplate) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }

    const res = await adminUpsertPromptAction({
      id: editingPrompt.id,
      name: editingPrompt.name,
      systemPrompt: editingPrompt.systemPrompt,
      userPromptTemplate: editingPrompt.userPromptTemplate,
      temperature: editingPrompt.temperature ?? 0.7,
      maxTokens: editingPrompt.maxTokens ?? 1000,
    });

    if (res.success) {
      toast.success("Đã lưu Prompt thành công!");
      setEditingPrompt(null);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi lưu Prompt");
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa Prompt cấu hình này?")) return;
    const res = await adminDeletePromptAction(id);
    if (res.success) {
      toast.success("Đã xóa Prompt thành công!");
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi xóa Prompt");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tổng quan Hệ thống & Chi phí AI</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý cấu hình Prompt, thiết lập hạn mức gọi AI toàn hệ thống và giám sát chi tiêu thời gian thực.
          </p>
        </div>
        <Button onClick={loadData} disabled={isPending} variant="outline" className="gap-2 self-start md:self-auto shadow">
          <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} /> Làm mới số liệu
        </Button>
      </div>

      {/* 1. HEALTH AND LIMIT MONITORING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Error Card */}
        <Card className={`border relative overflow-hidden transition-all duration-300 ${analytics && analytics.errorRatePercent > 5 ? 'border-red-500 shadow-lg shadow-red-500/10' : ''}`}>
          {analytics && analytics.errorRatePercent > 5 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Tỷ lệ lỗi kết nối (10 Phút)
              <AlertTriangle className={`size-4 ${analytics && analytics.errorRatePercent > 5 ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold flex items-baseline gap-2">
              {analytics ? analytics.errorRatePercent.toFixed(1) : "0.0"}%
              <span className="text-xs font-medium text-muted-foreground">
                ({analytics ? analytics.errorCalls10m : 0}/{analytics ? analytics.totalCalls10m : 0} cuộc gọi)
              </span>
            </div>
            {analytics && analytics.errorRatePercent > 5 ? (
              <p className="text-xs text-red-500 font-semibold animate-pulse">
                ⚠️ CẢNH BÁO: Tỷ lệ lỗi vượt quá ngưỡng an toàn 5%! Vui lòng kiểm tra lại tài khoản API.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Các kết nối API OpenAI/Groq hiện hoạt động an toàn.</p>
            )}
          </CardContent>
        </Card>

        {/* Total Cost Card */}
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Tổng chi phí API tiêu thụ
              <Coins className="size-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ${analytics?.courseCosts.reduce((acc, curr) => acc + curr.totalCostUsd, 0).toFixed(4) || "0.0000"}
            </div>
            <p className="text-xs text-muted-foreground">
              Tương đương khoảng{" "}
              {Math.round(
                (analytics?.courseCosts.reduce((acc, curr) => acc + curr.totalCostUsd, 0) || 0) * 25000
              ).toLocaleString()}{" "}
              VNĐ
            </p>
          </CardContent>
        </Card>

        {/* Global Daily Quota Limit Settings */}
        <Card className="border bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Hạn mức học viên theo ngày
              <Settings2 className="size-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="flex gap-2">
              <input
                type="number"
                value={globalLimit}
                onChange={(e) => setGlobalLimit(parseInt(e.target.value, 10))}
                className="w-20 px-3 py-1.5 border rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                min={1}
                max={500}
              />
              <Button onClick={handleUpdateLimit} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                Cập nhật hạn mức
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Trần sử dụng AI toàn cục. Học viên vượt quá ngưỡng này sẽ bị chặn gọi AI và reset về 0 lúc 00:00:00 (GMT+7).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. COST PER COURSE & PER EXERCISE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost per Course */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-indigo-500" /> Chi phí theo Khóa học
            </CardTitle>
            <CardDescription>Phân rã tiền tệ quy đổi trên từng khóa học cụ thể.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {analytics && analytics.courseCosts.length > 0 ? (
                analytics.courseCosts.map((c, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="text-sm font-bold">{c.courseTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.callsCount} lượt gọi API • {(c.totalTokens / 1000).toFixed(1)}k Tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400">${c.totalCostUsd.toFixed(4)}</div>
                      <div className="text-[10px] text-muted-foreground">~{Math.round(c.totalCostUsd * 25000)} VNĐ</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu chi phí khóa học.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost per Exercise */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Cpu className="size-4 text-indigo-500" /> Top bài tập viết tiêu hao nhiều nhất
            </CardTitle>
            <CardDescription>Xếp hạng các bài làm văn tiêu hao token nhiều nhất để kịp thời điều chỉnh.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {analytics && analytics.exerciseCosts.length > 0 ? (
                analytics.exerciseCosts.map((e, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1 max-w-[70%]">
                      <div className="text-xs font-bold font-mono text-muted-foreground">ID: {e.writeId}</div>
                      <div className="text-sm font-semibold truncate leading-tight text-primary">{e.promptText}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {e.callsCount} lượt sửa • {(e.totalTokens / 1000).toFixed(1)}k Tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400">${e.totalCostUsd.toFixed(4)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu bài viết tốn chi phí.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. PROMPT CONFIGURATION CENTRAL */}
      <Card className="border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-500" /> Cấu hình Prompt Tập trung cho Bài tập Writing
            </CardTitle>
            <CardDescription>
              Thiết lập System Prompt chỉ dẫn chấm điểm và User Prompt Template chứa các biến động để gửi đi OpenAI API.
            </CardDescription>
          </div>
          <Button
            onClick={() =>
              setEditingPrompt({
                id: "prompt_" + nanoid(6),
                name: "",
                systemPrompt: "You are an IELTS Writing Examiner. Grade the following essay...",
                userPromptTemplate: "Requirement: {{exercise_requirement}}\nStudent Essay: {{student_answer}}\nMax Word Count: {{max_word_count}}",
                temperature: 0.7,
                maxTokens: 1000,
              })
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-lg shadow-indigo-600/10"
          >
            <Plus className="size-4" /> Tạo cấu hình Prompt mới
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Prompt Form (when adding/editing) */}
          {editingPrompt && (
            <form onSubmit={handleSavePrompt} className="p-6 rounded-xl border-2 border-indigo-600/40 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Settings2 className="size-4" /> Cấu hình tệp Prompt
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Mã định danh (Prompt ID - Bắt buộc)</label>
                  <input
                    type="text"
                    value={editingPrompt.id || ""}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background font-mono font-bold"
                    placeholder="ielts_grading_prompt"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Tên mô tả cấu hình</label>
                  <input
                    type="text"
                    value={editingPrompt.name || ""}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background font-semibold"
                    placeholder="Chấm điểm IELTS 4 tiêu chí"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">System Prompt (Chỉ thị AI Giám khảo)</label>
                <textarea
                  value={editingPrompt.systemPrompt || ""}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, systemPrompt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background min-h-[100px] font-mono leading-relaxed"
                  placeholder="You are an IELTS Writing Examiner..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">User Prompt Template (Hỗ trợ {"{{student_answer}}"}, {"{{exercise_requirement}}"}, {"{{max_word_count}}"})</label>
                <textarea
                  value={editingPrompt.userPromptTemplate || ""}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, userPromptTemplate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background min-h-[100px] font-mono leading-relaxed"
                  placeholder="Student Essay: {{student_answer}}"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex justify-between">
                    <span>Nhiệt độ (Temperature)</span>
                    <span className="font-mono font-bold text-indigo-600">{editingPrompt.temperature ?? 0.7}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editingPrompt.temperature ?? 0.7}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Max Completion Tokens</label>
                  <input
                    type="number"
                    value={editingPrompt.maxTokens ?? 1000}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, maxTokens: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background font-semibold"
                    placeholder="1000"
                    min={1}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setEditingPrompt(null)} variant="ghost" className="text-xs">Hủy</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">Lưu Cấu Hình</Button>
              </div>
            </form>
          )}

          {/* Prompt List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prompts.map((p, idx) => (
              <Card key={idx} className="border flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1 max-w-[70%]">
                    <div className="text-xs font-mono font-bold text-indigo-600 flex items-center gap-1 truncate">
                      <Cpu className="size-3 shrink-0" /> {p.id}
                    </div>
                    <CardTitle className="text-sm font-bold truncate leading-snug">{p.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      onClick={() => setEditingPrompt(p)}
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-indigo-600"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeletePrompt(p.id)}
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="py-3 text-xs leading-relaxed space-y-2 bg-muted/20">
                  <div>
                    <span className="font-bold text-muted-foreground">System Prompt (Trích đoạn):</span>
                    <p className="font-mono text-muted-foreground truncate mt-0.5">{p.systemPrompt}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1">
                    <div>Temp: <span className="font-bold">{p.temperature}</span></div>
                    <div>Max Tokens: <span className="font-bold">{p.maxTokens}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {prompts.length === 0 && (
              <div className="md:col-span-2 p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                Chưa có cấu hình Prompt nào được đăng ký trong hệ thống.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
