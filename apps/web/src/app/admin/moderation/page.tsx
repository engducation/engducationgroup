"use client";

import { useEffect, useState, useTransition } from "react";
import {
  MessageSquare,
  Sparkles,
  User,
  CheckCircle,
  Clock,
  Send,
  UserCheck,
  Split,
  MessageCircle,
  FileText,
  Bookmark,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  adminGetReviewTicketsAction,
  adminResolveWritingReviewAction,
  adminGetSupportTicketsAction,
  adminGetSupportTicketDetailsAction,
  adminUpdateTicketStatusAction,
  adminReplyTicketAction,
  adminGetUsersModerationAction,
} from "@/features/admin/actions";

interface ReviewTicket {
  id: string;
  submissionId: string;
  userMessage: string | null;
  status: string;
  teacherScore: number | null;
  teacherFeedback: string | null;
  createdAt: Date;
  studentName: string;
  studentEmail: string;
  originalText: string;
  aiFeedback: string | null;
  aiScore: number | null;
}

interface SupportTicket {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  studentName: string;
  studentEmail: string;
  assigneeName: string | null;
}

interface TicketMessage {
  id: string;
  message: string;
  createdAt: Date;
  senderName: string;
  senderRole: string | null;
}

interface TicketDetails extends SupportTicket {
  messages: TicketMessage[];
  assigneeId: string | null;
}

interface UserDropdown {
  id: string;
  name: string;
  role: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PENDING: {
      label: "Đang chờ",
      cls: "bg-amber-50 text-amber-700 border-amber-200/60",
      icon: <Clock className="size-3" />,
    },
    COMPLETED: {
      label: "Hoàn thành",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      icon: <CheckCircle2 className="size-3" />,
    },
    OPEN: {
      label: "Mở",
      cls: "bg-red-50 text-red-700 border-red-200/60",
      icon: <AlertCircle className="size-3" />,
    },
    IN_PROGRESS: {
      label: "Đang xử lý",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
      icon: <Clock className="size-3" />,
    },
    RESOLVED: {
      label: "Đã xử lý",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      icon: <CheckCircle2 className="size-3" />,
    },
    CLOSED: {
      label: "Đã đóng",
      cls: "bg-slate-100 text-slate-500 border-slate-200/60",
      icon: <CheckCircle className="size-3" />,
    },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600", icon: null };
  return (
    <Badge className={`flex items-center gap-1 text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

export default function AdminModerationPage() {
  const [isPending, startTransition] = useTransition();
  const [activeWorkspace, setActiveWorkspace] = useState<"writing" | "helpdesk">("writing");

  const [reviewTickets, setReviewTickets] = useState<ReviewTicket[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);

  const [selectedReview, setSelectedReview] = useState<ReviewTicket | null>(null);
  const [teacherScore, setTeacherScore] = useState<string>("");
  const [teacherFeedback, setTeacherFeedback] = useState<string>("");

  const [selectedSupportId, setSelectedSupportId] = useState<string | null>(null);
  const [supportDetails, setSupportDetails] = useState<TicketDetails | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>("");

  const loadData = () => {
    startTransition(async () => {
      const reviewRes = await adminGetReviewTicketsAction();
      if (reviewRes.success && reviewRes.data) {
        setReviewTickets(reviewRes.data as ReviewTicket[]);
      }

      const supportRes = await adminGetSupportTicketsAction();
      if (supportRes.success && supportRes.data) {
        setSupportTickets(supportRes.data as SupportTicket[]);
      }

      const usersRes = await adminGetUsersModerationAction();
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data as UserDropdown[]);
      }
    });
  };

  const loadTicketDetails = async (ticketId: string) => {
    const res = await adminGetSupportTicketDetailsAction(ticketId);
    if (res.success && res.data) {
      setSupportDetails(res.data as unknown as TicketDetails);
    } else {
      toast.error(res.error || "Không thể tải chi tiết ticket");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSupportId) {
      loadTicketDetails(selectedSupportId);
    } else {
      setSupportDetails(null);
    }
  }, [selectedSupportId]);

  const handleResolveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    const scoreNum = parseInt(teacherScore, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Điểm phải từ 0 đến 100");
      return;
    }

    if (!teacherFeedback.trim()) {
      toast.error("Vui lòng nhập nhận xét chuyên môn");
      return;
    }

    const res = await adminResolveWritingReviewAction(selectedReview.id, scoreNum, teacherFeedback);
    if (res.success) {
      toast.success("Đã ghi đè và chuẩn hóa điểm số thành công!");
      setSelectedReview(null);
      setTeacherScore("");
      setTeacherFeedback("");
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi lưu kết quả");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupportId || !replyMessage.trim()) return;

    const res = await adminReplyTicketAction(selectedSupportId, replyMessage);
    if (res.success) {
      toast.success("Đã gửi phản hồi!");
      setReplyMessage("");
      loadTicketDetails(selectedSupportId);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi gửi phản hồi");
    }
  };

  const handleUpdateStatus = async (status: string, assigneeId?: string) => {
    if (!selectedSupportId) return;

    const res = await adminUpdateTicketStatusAction(selectedSupportId, status, assigneeId);
    if (res.success) {
      toast.success("Đã cập nhật trạng thái!");
      loadTicketDetails(selectedSupportId);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi cập nhật trạng thái");
    }
  };

  const pendingReviews = reviewTickets.filter((t) => t.status === "PENDING");
  const openTickets = supportTickets.filter((t) => t.status !== "CLOSED");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kiểm duyệt &amp; tiếp nhận
          </h1>
          <p className="text-sm text-muted-foreground">
            Chấm bài viết khiếu nại (human-in-the-loop) và quản lý yêu cầu hỗ trợ.
          </p>
        </div>
        <Button
          onClick={loadData}
          disabled={isPending}
          variant="outline"
          className="gap-2 self-start rounded-xl shadow-sm"
        >
          <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* ─── TABS ─── */}
      <Tabs
        value={activeWorkspace}
        onValueChange={(v) => setActiveWorkspace(v as any)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-xl bg-muted/60 p-1 gap-1">
          <TabsTrigger
            value="writing"
            className="rounded-lg font-semibold text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Split className="size-4" />
            Khiếu nại bài viết
            {pendingReviews.length > 0 && (
              <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="helpdesk"
            className="rounded-lg font-semibold text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <MessageCircle className="size-4" />
            Helpdesk
            {openTickets.length > 0 && (
              <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                {openTickets.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: WRITING REVIEW ─── */}
        <TabsContent value="writing" className="mt-5">
          {selectedReview ? (
            /* Workspace view */
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              {/* Breadcrumb back */}
              <button
                onClick={() => setSelectedReview(null)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Quay lại danh sách
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* LEFT: AI result */}
                <Card className="overflow-hidden border-indigo-200/30">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100">
                          <Sparkles className="size-4 text-indigo-600" />
                        </div>
                        <CardTitle className="text-sm font-bold">Kết quả AI</CardTitle>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200/60 text-[10px] font-extrabold">
                        {selectedReview.aiScore ?? 0}/100
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {selectedReview.studentName} · {selectedReview.studentEmail}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4 overflow-y-auto max-h-[420px]">
                    {selectedReview.userMessage && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200/50 p-3">
                        <p className="text-[11px] font-bold text-amber-700 mb-1">Lời nhắn học sinh:</p>
                        <p className="text-xs text-amber-800 italic">"{selectedReview.userMessage}"</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="size-3.5 text-indigo-500" />
                        Bài viết gốc
                      </p>
                      <div className="rounded-xl border border-slate-200/60 bg-white p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-800">
                          {selectedReview.originalText}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-indigo-500" />
                        Phản hồi AI
                      </p>
                      <div className="rounded-xl border border-indigo-200/30 bg-indigo-50/30 p-4">
                        <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-700">
                          {selectedReview.aiFeedback || "Chưa có phản hồi từ AI."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* RIGHT: Teacher form */}
                <Card className="overflow-hidden border-emerald-200/30">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100">
                        <UserCheck className="size-4 text-emerald-600" />
                      </div>
                      <CardTitle className="text-sm font-bold text-emerald-800">
                        Chuẩn hóa của giáo viên
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Chấm điểm lại và ghi đè kết quả AI.
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleResolveReview} className="flex flex-col">
                    <CardContent className="space-y-4 pt-4 flex-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Điểm chính thức (0 – 100)
                        </label>
                        <input
                          type="number"
                          value={teacherScore}
                          onChange={(e) => setTeacherScore(e.target.value)}
                          className="h-10 w-24 rounded-xl border border-input bg-background px-3 text-sm font-extrabold shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                          placeholder="85"
                          min={0}
                          max={100}
                          required
                        />
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Nhận xét chuyên môn
                        </label>
                        <Textarea
                          value={teacherFeedback}
                          onChange={(e) => setTeacherFeedback(e.target.value)}
                          className="min-h-[200px] rounded-xl border focus-visible:ring-emerald-500 focus-visible:outline-none resize-none"
                          placeholder="Chào em, bài viết của em có cấu trúc khá tốt nhưng AI đã hiểu nhầm cụm từ... Dưới đây là cách sửa chuẩn:"
                          required
                        />
                      </div>
                    </CardContent>
                    <div className="border-t p-4 bg-emerald-50/30">
                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm"
                      >
                        <CheckCircle2 className="size-4" />
                        Gửi kết quả chuẩn hóa
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          ) : (
            /* List view */
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50">
                    <MessageSquare className="size-4 text-indigo-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Danh sách khiếu nại</CardTitle>
                    <CardDescription className="text-xs">
                      {pendingReviews.length > 0
                        ? `${pendingReviews.length} yêu cầu đang chờ giải quyết`
                        : "Không có yêu cầu nào đang chờ"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="divide-y max-h-[480px] overflow-y-auto">
                  {reviewTickets.length > 0 ? (
                    reviewTickets.map((t) => (
                      <div key={t.id} className="flex items-start justify-between gap-4 p-4 hover:bg-muted/20 transition-colors">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">
                              #{t.submissionId.slice(0, 8)}
                            </span>
                            <StatusBadge status={t.status} />
                          </div>
                          <p className="text-sm font-semibold text-foreground">{t.studentName}</p>
                          {t.userMessage && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/50 rounded-lg px-2.5 py-1.5 italic">
                              "{t.userMessage}"
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Sparkles className="size-3" />
                              AI: <span className="font-bold text-indigo-600">{t.aiScore ?? 0}</span>
                            </span>
                            {t.teacherScore !== null && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="size-3" />
                                GV: <span className="font-bold text-emerald-600">{t.teacherScore}</span>
                              </span>
                            )}
                            <span>{new Date(t.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                        </div>

                        {t.status === "PENDING" ? (
                          <Button
                            onClick={() => setSelectedReview(t)}
                            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl gap-1.5 shadow-sm"
                          >
                            Chấm điểm
                            <ChevronRight className="size-3.5" />
                          </Button>
                        ) : (
                          <div className="shrink-0 text-right">
                            <StatusBadge status={t.status} />
                            {t.teacherScore !== null && (
                              <p className="mt-1 text-xs font-bold text-emerald-600">
                                {t.teacherScore}/100
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 mb-3">
                        <CheckCircle className="size-6 text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-600 mb-1">
                        Không có khiếu nại nào
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tất cả bài viết đã được giải quyết.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB 2: HELPDESK ─── */}
        <TabsContent value="helpdesk" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Ticket list */}
            <Card className="lg:col-span-4 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50">
                    <Bookmark className="size-4 text-indigo-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Hộp thư hỗ trợ</CardTitle>
                    <CardDescription className="text-xs">
                      {openTickets.length > 0
                        ? `${openTickets.length} yêu cầu đang mở`
                        : "Không có yêu cầu nào"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <div className="divide-y max-h-[520px] overflow-y-auto">
                  {supportTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedSupportId(t.id)}
                      className={`cursor-pointer p-4 transition-all ${
                        selectedSupportId === t.id
                          ? "bg-indigo-50/60 border-l-2 border-indigo-500"
                          : "hover:bg-muted/30 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <Badge className="text-[9px] font-bold bg-slate-100 text-slate-600 border-none">
                          {t.category}
                        </Badge>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t.studentName} · {new Date(t.updatedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  ))}

                  {supportTickets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                      <MessageSquare className="size-8 text-muted-foreground/30 mb-2" />
                      Không có yêu cầu nào.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat detail */}
            <div className="lg:col-span-8">
              {supportDetails ? (
                <Card className="overflow-hidden h-full flex flex-col">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200/60 text-[10px] font-bold">
                            {supportDetails.category}
                          </Badge>
                          <StatusBadge status={supportDetails.status} />
                        </div>
                        <CardTitle className="text-base font-bold">{supportDetails.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {supportDetails.studentName} · {supportDetails.studentEmail}
                        </CardDescription>
                      </div>

                      {/* Assignee */}
                      <div className="space-y-1 shrink-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Người phụ trách
                        </p>
                        <select
                          value={supportDetails.assigneeId || ""}
                          onChange={(e) => handleUpdateStatus(supportDetails.status, e.target.value || undefined)}
                          className="px-2.5 py-1.5 border rounded-xl bg-white text-xs font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                        >
                          <option value="">— Chưa bàn giao —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role || "Giáo viên"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-2 rounded-xl bg-white/80 border border-slate-200/50 p-3">
                      <p className="text-[11px] font-bold text-indigo-600 mb-1">Mô tả lỗi:</p>
                      <p className="text-xs leading-relaxed text-slate-700 italic">
                        "{supportDetails.description}"
                      </p>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto max-h-[320px] min-h-[280px] py-4 px-4 space-y-4 bg-slate-50/50 border-y">
                    {supportDetails.messages.map((m) => {
                      const isAdmin = m.senderRole === "admin";
                      return (
                        <div key={m.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}>
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-[10px] text-white ${isAdmin ? "bg-indigo-500" : "bg-slate-400"}`}>
                            {m.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className={`space-y-1 max-w-[80%] ${isAdmin ? "text-right" : ""}`}>
                            <div className={`text-[10px] font-semibold text-muted-foreground ${isAdmin ? "text-right" : ""}`}>
                              {m.senderName}
                            </div>
                            <div className={`inline-block rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-medium shadow-sm ${
                              isAdmin
                                ? "bg-indigo-600 text-white rounded-br-sm"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                            }`}>
                              {m.message}
                            </div>
                            <div className={`text-[9px] text-muted-foreground/70 ${isAdmin ? "text-right" : ""}`}>
                              {new Date(m.createdAt).toLocaleString("vi-VN")}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {supportDetails.messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground py-8">
                        <MessageSquare className="size-8 text-muted-foreground/30 mb-2" />
                        Chưa có tin nhắn nào.
                      </div>
                    )}
                  </CardContent>

                  {/* Input */}
                  <div className="p-4 space-y-3 bg-white">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Nhập phản hồi cho học sinh…"
                        className="flex-1 h-10 px-3.5 rounded-xl border border-input bg-background text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                        required
                      />
                      <Button
                        type="submit"
                        className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl size-10 p-0 shadow-sm"
                      >
                        <Send className="size-4" />
                      </Button>
                    </form>

                    {/* Status quick actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t">
                      <span className="text-[10px] font-semibold text-muted-foreground">Trạng thái:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Chờ", status: "OPEN", cls: "text-red-600 border-red-200 hover:bg-red-50" },
                          { label: "Xử lý", status: "IN_PROGRESS", cls: "text-indigo-600 border-indigo-200 hover:bg-indigo-50" },
                          { label: "Xong", status: "RESOLVED", cls: "text-emerald-600 border-emerald-200 hover:bg-emerald-50" },
                          { label: "Đóng", status: "CLOSED", cls: "text-slate-600 border-slate-200 hover:bg-slate-50" },
                        ].map(({ label, status, cls }) => (
                          <Button
                            key={status}
                            onClick={() => handleUpdateStatus(status)}
                            variant="ghost"
                            size="sm"
                            className={`h-6 text-[10px] font-bold border rounded-lg px-2 transition-colors ${cls}`}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 mb-3">
                    <MessageSquare className="size-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    Chọn một ticket để xem chi tiết
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nhấn vào ticket bên trái để mở không gian chat.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
