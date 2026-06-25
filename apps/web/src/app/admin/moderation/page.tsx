"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  Inbox,
  MessageCircle,
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
  adminGetSupportTicketsAction,
  adminGetSupportTicketDetailsAction,
  adminUpdateTicketStatusAction,
  adminReplyTicketAction,
  adminGetUsersModerationAction,
} from "@/features/admin/actions";

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
    OPEN: {
      label: "Mở",
      cls: "bg-red-50 text-red-700 border-red-200/60",
      icon: <AlertCircle className="size-3" />,
    },
    IN_PROGRESS: {
      label: "Đang xử lý",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
      icon: <RefreshCw className="size-3 animate-spin" />,
    },
    RESOLVED: {
      label: "Đã giải quyết",
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

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);

  const [selectedSupportId, setSelectedSupportId] = useState<string | null>(null);
  const [supportDetails, setSupportDetails] = useState<TicketDetails | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const loadData = () => {
    startTransition(async () => {
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
      void loadTicketDetails(selectedSupportId);
    } else {
      setSupportDetails(null);
    }
  }, [selectedSupportId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupportId || !replyMessage.trim()) return;

    const res = await adminReplyTicketAction(selectedSupportId, replyMessage);
    if (res.success) {
      toast.success("Đã gửi phản hồi!");
      setReplyMessage("");
      void loadTicketDetails(selectedSupportId);
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
      void loadTicketDetails(selectedSupportId);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi cập nhật trạng thái");
    }
  };

  const openTickets = supportTickets.filter((t) => t.status !== "CLOSED");

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Helpdesk
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Quản lý yêu cầu hỗ trợ từ học viên.
          </p>
        </div>
        <Button
          onClick={loadData}
          disabled={isPending}
          variant="outline"
          className="gap-2 self-start rounded-xl shadow-sm border-slate-200/80 bg-white"
        >
          <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Ticket list */}
        <Card className="lg:col-span-4 overflow-hidden border-slate-200/80 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Inbox className="size-4" />
              </div>
              <div>
                <CardTitle>Hộp thư hỗ trợ</CardTitle>
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
            <div className="divide-y max-h-[540px] overflow-y-auto">
              {supportTickets.length > 0 ? (
                supportTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedSupportId(t.id)}
                    className={`cursor-pointer p-4 transition-all ${
                      selectedSupportId === t.id
                        ? "bg-indigo-50/60 border-l-2 border-indigo-500"
                        : "hover:bg-slate-50/60 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge className="text-[9px] font-bold bg-slate-100 text-slate-600 border-none">
                        {t.category}
                      </Badge>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-sm font-semibold text-slate-950 leading-snug line-clamp-2">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {t.studentName} · {new Date(t.updatedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
                  <Inbox className="size-8 mb-2 opacity-30" />
                  <p className="text-xs">Không có yêu cầu nào.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ticket detail */}
        <div className="lg:col-span-8">
          {supportDetails ? (
            <Card className="overflow-hidden h-full flex flex-col border-slate-200/80 bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200/60 text-[10px] font-bold">
                        {supportDetails.category}
                      </Badge>
                      <StatusBadge status={supportDetails.status} />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-950">
                      {supportDetails.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {supportDetails.studentName} · {supportDetails.studentEmail}
                    </CardDescription>
                  </div>

                  {/* Assignee */}
                  <div className="space-y-1 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Người phụ trách
                    </p>
                    <select
                      value={supportDetails.assigneeId || ""}
                      onChange={(e) =>
                        handleUpdateStatus(
                          supportDetails.status,
                          e.target.value || undefined,
                        )
                      }
                      className="px-3 py-1.5 border rounded-xl bg-white text-xs font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
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
                {supportDetails.description && (
                  <div className="mt-3 rounded-xl bg-white/80 border border-slate-200/50 p-3">
                    <p className="text-[11px] font-bold text-indigo-600 mb-1">Mô tả lỗi:</p>
                    <p className="text-xs leading-relaxed text-slate-700 italic">
                      "{supportDetails.description}"
                    </p>
                  </div>
                )}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto max-h-[340px] min-h-[300px] py-5 px-5 space-y-4 bg-slate-50/30 border-y">
                {supportDetails.messages.length > 0 ? (
                  supportDetails.messages.map((m) => {
                    const isAdmin = m.senderRole === "admin";
                    return (
                      <div key={m.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-[10px] text-white ${
                            isAdmin ? "bg-indigo-500" : "bg-slate-400"
                          }`}
                        >
                          {m.senderName.charAt(0).toUpperCase()}
                        </div>
                        <div className={`space-y-1 max-w-[80%] ${isAdmin ? "text-right" : ""}`}>
                          <div className={`text-[10px] font-semibold text-slate-400 ${isAdmin ? "text-right" : ""}`}>
                            {m.senderName}
                          </div>
                          <div
                            className={`inline-block rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-medium shadow-sm ${
                              isAdmin
                                ? "bg-indigo-600 text-white rounded-br-sm"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                            }`}
                          >
                            {m.message}
                          </div>
                          <div className={`text-[9px] text-slate-400/70 ${isAdmin ? "text-right" : ""}`}>
                            {new Date(m.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 py-12">
                    <HelpCircle className="size-8 mb-2 opacity-30" />
                    Chưa có tin nhắn nào.
                  </div>
                )}
              </CardContent>

              {/* Reply + status */}
              <div className="p-5 space-y-4 bg-white">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Nhập phản hồi cho học sinh…"
                    className="flex-1 h-10 px-4 rounded-xl border border-input bg-white text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    required
                  />
                  <Button
                    type="submit"
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl size-10 p-0 shadow-sm"
                  >
                    <MessageCircle className="size-4" />
                  </Button>
                </form>

                {/* Status actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <span className="text-[10px] font-semibold text-slate-400">Trạng thái:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Mở", status: "OPEN", cls: "text-red-600 border-red-200 hover:bg-red-50" },
                      { label: "Xử lý", status: "IN_PROGRESS", cls: "text-indigo-600 border-indigo-200 hover:bg-indigo-50" },
                      { label: "Xong", status: "RESOLVED", cls: "text-emerald-600 border-emerald-200 hover:bg-emerald-50" },
                      { label: "Đóng", status: "CLOSED", cls: "text-slate-500 border-slate-200 hover:bg-slate-50" },
                    ].map(({ label, status, cls }) => (
                      <Button
                        key={status}
                        onClick={() => handleUpdateStatus(status)}
                        variant="ghost"
                        size="sm"
                        className={`h-6 text-[10px] font-bold border rounded-lg px-2.5 transition-colors ${cls}`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 py-28 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <HelpCircle className="size-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Chọn một ticket để xem chi tiết</p>
              <p className="mt-1 text-xs text-slate-400">
                Nhấn vào ticket bên trái để mở không gian chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
