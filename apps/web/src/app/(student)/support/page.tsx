"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Inbox,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupportTicketModal } from "@/features/learning-content/components/support-ticket-modal";
import { useSupportTickets, type SupportTicket } from "@/features/learning-content/hooks/use-support-tickets";

function TicketStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    OPEN: {
      label: "Mở",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <Clock className="size-3" />,
    },
    IN_PROGRESS: {
      label: "Đang xử lý",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Loader2 className="size-3 animate-spin" />,
    },
    RESOLVED: {
      label: "Đã giải quyết",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="size-3" />,
    },
    CLOSED: {
      label: "Đã đóng",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      icon: <XCircle className="size-3" />,
    },
  };

  const { label, className, icon } = config[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
    icon: null,
  };

  return (
    <Badge variant="outline" className={`flex items-center gap-1 text-xs font-medium border ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}

function TicketCategoryBadge({ category }: { category: string }) {
  const config: Record<string, string> = {
    ACCOUNT: "Tài khoản",
    VIDEO: "Video",
    QUIZ: "Quiz",
    SYSTEM_ERROR: "Lỗi hệ thống",
    PAYMENT: "Thanh toán",
    OTHER: "Khác",
  };

  return (
    <span className="text-xs font-medium text-slate-500">
      {config[category] ?? category}
    </span>
  );
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentSupportPage() {
  const { tickets, createTicket, refreshTickets, isLoading } = useSupportTickets();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS");
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yêu cầu hỗ trợ</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và quản lý các yêu cầu hỗ trợ của bạn
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          <Plus className="size-4" />
          Gửi yêu cầu mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-100">
                <Clock className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Đang mở</p>
                <p className="text-xl font-bold text-slate-900">{openTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100">
                <CheckCircle className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Đã giải quyết</p>
                <p className="text-xl font-bold text-slate-900">{resolvedTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100">
                <Inbox className="size-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tổng cộng</p>
                <p className="text-xl font-bold text-slate-900">{tickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100">
              <MessageCircle className="size-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Danh sách yêu cầu</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Đang tải..."
                  : tickets.length > 0
                  ? `${tickets.length} yêu cầu`
                  : "Chưa có yêu cầu nào"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <Inbox className="size-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-600">Chưa có yêu cầu nào</p>
              <p className="mt-1 text-sm text-slate-400">
                Gửi yêu cầu hỗ trợ nếu bạn gặp vấn đề
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Plus className="size-4" />
                Gửi yêu cầu mới
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map((ticket: SupportTicket) => (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}` as Route}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <MessageCircle className="size-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {ticket.title}
                      </p>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <TicketCategoryBadge category={ticket.category} />
                      <span>•</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Modal */}
      <SupportTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
