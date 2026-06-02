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

export default function AdminModerationPage() {
  const [isPending, startTransition] = useTransition();
  const [activeWorkspace, setActiveWorkspace] = useState<"writing" | "helpdesk">("writing");

  // Data lists
  const [reviewTickets, setReviewTickets] = useState<ReviewTicket[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);

  // Selected Writing Review ticket state
  const [selectedReview, setSelectedReview] = useState<ReviewTicket | null>(null);
  const [teacherScore, setTeacherScore] = useState<string>("");
  const [teacherFeedback, setTeacherFeedback] = useState<string>("");

  // Selected Support Ticket details state
  const [selectedSupportId, setSelectedSupportId] = useState<string | null>(null);
  const [supportDetails, setSupportDetails] = useState<TicketDetails | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>("");

  const loadData = () => {
    startTransition(async () => {
      // 1. Get Review Tickets
      const reviewRes = await adminGetReviewTicketsAction();
      if (reviewRes.success && reviewRes.data) {
        setReviewTickets(reviewRes.data as ReviewTicket[]);
      }

      // 2. Get Support Tickets
      const supportRes = await adminGetSupportTicketsAction();
      if (supportRes.success && supportRes.data) {
        setSupportTickets(supportRes.data as SupportTicket[]);
      }

      // 3. Get Teachers / Admins to assign
      const usersRes = await adminGetUsersModerationAction();
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data as UserDropdown[]);
      }
    });
  };

  const loadTicketDetails = async (ticketId: string) => {
    const res = await adminGetSupportTicketDetailsAction(ticketId);
    if (res.success && res.data) {
      setSupportDetails(res.data as any);
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

  // Handle human resolution of AI score
  const handleResolveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    const scoreNum = parseInt(teacherScore, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Điểm số của giáo viên phải nằm trong khoảng từ 0 đến 100");
      return;
    }

    if (!teacherFeedback.trim()) {
      toast.error("Vui lòng nhập nhận xét chuyên môn từ giáo viên");
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
      toast.error(res.error || "Lỗi khi lưu kết quả chấm điểm");
    }
  };

  // Helpdesk Ticket Actions
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupportId || !replyMessage.trim()) return;

    const res = await adminReplyTicketAction(selectedSupportId, replyMessage);
    if (res.success) {
      toast.success("Đã gửi phản hồi hỗ trợ!");
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
      toast.success("Cập nhật trạng thái hỗ trợ thành công!");
      loadTicketDetails(selectedSupportId);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kiểm Duyệt & Tiếp Nhận Yêu Cầu</h1>
          <p className="text-muted-foreground mt-1">
            Không gian chấm bài viết khiếu nại bằng con người (Human-in-the-loop) và tiếp nhận các yêu cầu trợ giúp kỹ thuật.
          </p>
        </div>
        <Button onClick={loadData} disabled={isPending} variant="outline" className="gap-2 self-start md:self-auto shadow">
          <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} /> Làm mới dữ liệu
        </Button>
      </div>

      <Tabs
        value={activeWorkspace}
        onValueChange={(v) => setActiveWorkspace(v as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="writing" className="font-bold flex items-center gap-1.5">
            <Split className="size-4" /> Khiếu nại Bài viết ({reviewTickets.filter(t => t.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="helpdesk" className="font-bold flex items-center gap-1.5">
            <MessageCircle className="size-4" /> Helpdesk Tickets ({supportTickets.filter(t => t.status !== 'CLOSED').length})
          </TabsTrigger>
        </TabsList>

        {/* ──────── TAB 1: WRITING REVIEW PORTAL ──────── */}
        <TabsContent value="writing" className="space-y-6 mt-6">
          {selectedReview ? (
            /* SPLIT-SCREEN WORKSPACE */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch animate-in slide-in-from-bottom-4 duration-300">
              {/* Left Column: AI Review and Student message */}
              <Card className="border flex flex-col justify-between h-full bg-card/30 backdrop-blur-md">
                <CardHeader className="bg-indigo-500/5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/5 text-[10px] font-bold">
                        ĐÃ CHẤM TỰ ĐỘNG BẰNG AI
                      </Badge>
                      <CardTitle className="text-lg font-bold mt-1.5">Bài làm & Kết quả AI</CardTitle>
                    </div>
                    <Button onClick={() => setSelectedReview(null)} variant="ghost" size="sm" className="text-xs">
                      Quay lại danh sách
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    Học sinh: <span className="font-bold text-primary">{selectedReview.studentName}</span> ({selectedReview.studentEmail})
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-4 py-4 flex-1 overflow-y-auto max-h-[500px]">
                  {selectedReview.userMessage && (
                    <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs leading-relaxed">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">💬 Lời nhắn từ Học sinh:</span>
                      "{selectedReview.userMessage}"
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="size-3.5 text-indigo-500" /> Văn bản gốc của học viên
                    </label>
                    <div className="p-4 border rounded-xl bg-background font-medium text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReview.originalText}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="size-3.5 text-indigo-500" /> Nhận xét chấm điểm AI (Score: {selectedReview.aiScore ?? 0}/100)
                    </label>
                    <div className="p-4 border rounded-xl bg-muted/30 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedReview.aiFeedback || "Chưa có nhận xét từ AI."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Rich Teacher grading and override form */}
              <Card className="border flex flex-col justify-between h-full bg-card/60 backdrop-blur-md">
                <CardHeader className="bg-emerald-500/5">
                  <CardTitle className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                    <UserCheck className="size-5" /> Chuẩn hóa của Giáo viên
                  </CardTitle>
                  <CardDescription>
                    Xem xét chuyên môn, chấm lại thủ công và viết phản hồi chi tiết để ghi đè kết quả AI.
                  </CardDescription>
                </CardHeader>
                <Separator />
                <form onSubmit={handleResolveReview} className="flex-1 flex flex-col justify-between">
                  <CardContent className="space-y-4 py-4 flex-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">Điểm số chính thức của Giáo viên (Thang điểm 0 - 100)</label>
                      <input
                        type="number"
                        value={teacherScore}
                        onChange={(e) => setTeacherScore(e.target.value)}
                        className="w-full md:w-32 px-3 py-2 border rounded-lg text-sm bg-background font-extrabold focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Ví dụ: 85"
                        min={0}
                        max={100}
                        required
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 flex flex-col">
                      <label className="text-xs font-bold text-muted-foreground">Nhận xét chi tiết & Chữa lỗi chính tả ngữ pháp chuẩn sư phạm</label>
                      <Textarea
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        className="w-full flex-1 min-h-[300px] border p-3 text-sm leading-relaxed focus-visible:ring-emerald-500"
                        placeholder="Chào em, bài viết của em có cấu trúc khá tốt nhưng AI đã hiểu nhầm cụm từ... Dưới đây là cách sửa chuẩn của giáo viên:"
                        required
                      />
                    </div>
                  </CardContent>
                  <Separator className="mt-4" />
                  <div className="p-4 bg-muted/20">
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/10">
                      Gửi Kết Quả Chuẩn Hóa & Hoàn Tất Khiếu Nại
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          ) : (
            /* LISTING REVIEW TICKETS */
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Danh sách khiếu nại từ học viên</CardTitle>
                <CardDescription>Các yêu cầu đòi giáo viên bằng con người chấm điểm lại do AI chấm sai hoặc hiểu nhầm ngữ cảnh.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {reviewTickets.length > 0 ? (
                    reviewTickets.map((t) => (
                      <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                        <div className="space-y-1.5 max-w-[70%]">
                          <div className="text-xs font-mono text-muted-foreground">SUBMISSION: {t.submissionId}</div>
                          <div className="text-sm font-bold">{t.studentName} ({t.studentEmail})</div>
                          {t.userMessage && (
                            <p className="text-xs text-muted-foreground bg-amber-500/5 border p-2 rounded-lg leading-relaxed italic">
                              "{t.userMessage}"
                            </p>
                          )}
                          <div className="flex gap-4 text-[10px] text-muted-foreground">
                            <span>AI Score: <span className="font-bold text-indigo-600">{t.aiScore ?? 0}/100</span></span>
                            <span>Ngày tạo: {new Date(t.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {t.status === "PENDING" ? (
                            <div className="flex flex-col items-end gap-2">
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase text-[10px] font-extrabold tracking-wider gap-1">
                                <Clock className="size-3" /> Đang chờ duyệt
                              </Badge>
                              <Button
                                onClick={() => setSelectedReview(t)}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow"
                              >
                                <Split className="size-3.5" /> Mở workspace chấm điểm
                              </Button>
                            </div>
                          ) : (
                            <div className="text-right space-y-1">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase text-[10px] font-extrabold tracking-wider gap-1">
                                <CheckCircle className="size-3" /> Đã hoàn thành
                              </Badge>
                              <div className="text-xs font-bold text-emerald-600">Teacher Score: {t.teacherScore}/100</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">Hiện tại chưa phát sinh khiếu nại nào từ học sinh.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ──────── TAB 2: HELPDESK SYSTEM ──────── */}
        <TabsContent value="helpdesk" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Tickets list */}
            <Card className="border lg:col-span-5 max-h-[600px] overflow-y-auto bg-card/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Bookmark className="size-4 text-indigo-500" /> Hộp thư hỗ trợ (Helpdesk)
                </CardTitle>
                <CardDescription>Tiếp nhận lỗi Video bài giảng, Quiz lỗi, Video loading chậm...</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <div className="divide-y">
                  {supportTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedSupportId(t.id)}
                      className={`p-4 cursor-pointer hover:bg-muted/40 transition-colors ${selectedSupportId === t.id ? 'bg-indigo-500/5 border-l-4 border-indigo-600' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <Badge className="text-[9px] uppercase tracking-wider font-extrabold bg-muted text-muted-foreground border-none">
                          {t.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold uppercase ${t.status === 'OPEN' ? 'border-red-500/20 text-red-600 bg-red-500/5' : t.status === 'IN_PROGRESS' ? 'border-indigo-500/20 text-indigo-600 bg-indigo-500/5' : 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5'}`}
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <div className="text-sm font-bold text-primary mt-1.5 leading-snug truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.studentName}</div>
                      <div className="text-[10px] text-muted-foreground/80 mt-1 font-mono">
                        Cập nhật: {new Date(t.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {supportTickets.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Không có yêu cầu trợ giúp kỹ thuật nào trong hệ thống.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Chat Window and Status controllers */}
            <div className="lg:col-span-7 h-full">
              {supportDetails ? (
                <Card className="border flex flex-col justify-between bg-card/60 backdrop-blur-md min-h-[500px]">
                  <CardHeader className="bg-indigo-500/5 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 border-none">{supportDetails.category}</Badge>
                          <span className="text-xs font-mono font-bold text-muted-foreground">ID: {supportDetails.id}</span>
                        </div>
                        <CardTitle className="text-lg font-bold mt-1">{supportDetails.title}</CardTitle>
                        <CardDescription className="text-xs">
                          Học sinh: <span className="font-bold text-primary">{supportDetails.studentName}</span> ({supportDetails.studentEmail})
                        </CardDescription>
                      </div>
                      {/* Ticket Assignee controller */}
                      <div className="flex flex-col gap-1.5 self-start sm:self-auto">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Người phụ trách xử lý</label>
                        <select
                          value={supportDetails.assigneeId || ""}
                          onChange={(e) => handleUpdateStatus(supportDetails.status, e.target.value || undefined)}
                          className="px-2 py-1 border rounded bg-background text-xs font-bold"
                        >
                          <option value="">-- Chưa bàn giao --</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role || "Giáo viên"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Separator className="mt-3" />
                    <div className="text-xs text-primary leading-relaxed bg-muted/40 p-3 rounded-lg border border-dashed mt-2">
                      <span className="font-bold block text-indigo-600">💬 Mô tả lỗi của học sinh:</span>
                      "{supportDetails.description}"
                    </div>
                  </CardHeader>

                  {/* THREADED CHAT MESSAGES PANEL */}
                  <CardContent className="flex-1 min-h-[300px] max-h-[350px] overflow-y-auto py-4 space-y-4 bg-muted/20 border-y">
                    {supportDetails.messages.map((m) => {
                      const isAdmin = m.senderRole === "admin";
                      return (
                        <div
                          key={m.id}
                          className={`flex gap-3 max-w-[85%] ${isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-muted border text-primary'}`}>
                            <User className="size-4" />
                          </div>
                          <div className="space-y-1">
                            <div className={`text-[10px] font-semibold text-muted-foreground ${isAdmin ? 'text-right' : ''}`}>
                              {m.senderName} <span className="font-normal opacity-85">({m.senderRole || "học viên"})</span>
                            </div>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm font-medium ${isAdmin ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-background border rounded-tl-none text-primary'}`}>
                              {m.message}
                            </div>
                            <div className={`text-[8px] text-muted-foreground/80 ${isAdmin ? 'text-right' : ''}`}>
                              {new Date(m.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {supportDetails.messages.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        Chưa có tin nhắn phản hồi nào trong luồng hỗ trợ này.
                      </div>
                    )}
                  </CardContent>

                  {/* CHAT INPUT AREA AND STATUS ROTATION */}
                  <div className="p-4 bg-muted/10 space-y-3">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Nhập nội dung phản hồi, tư vấn học viên..."
                        className="flex-1 px-3 py-2 border rounded-xl text-xs bg-background focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        required
                      />
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold size-9 p-0 rounded-xl shrink-0 shadow">
                        <Send className="size-4" />
                      </Button>
                    </form>

                    {/* Status routing bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[10px]">
                      <span className="font-bold text-muted-foreground uppercase">Cập nhật nhanh trạng thái:</span>
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => handleUpdateStatus("OPEN")}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[9px] font-bold border hover:bg-red-500/10 hover:text-red-500 text-red-600"
                        >
                          Chờ tiếp nhận
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus("IN_PROGRESS")}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[9px] font-bold border hover:bg-indigo-500/10 hover:text-indigo-500 text-indigo-600"
                        >
                          Đang xử lý
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus("RESOLVED")}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[9px] font-bold border hover:bg-emerald-500/10 hover:text-emerald-500 text-emerald-600"
                        >
                          Đã xử lý xong
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus("CLOSED")}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[9px] font-bold border hover:bg-muted-foreground/10 text-muted-foreground"
                        >
                          Đóng Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-dashed rounded-2xl p-16 text-center text-sm text-muted-foreground bg-card/10 h-full flex flex-col items-center justify-center gap-2">
                  <MessageSquare className="size-8 text-muted-foreground/60 animate-pulse" />
                  Chọn một support ticket từ danh sách bên trái để mở không gian chat luồng tư vấn với học viên.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
