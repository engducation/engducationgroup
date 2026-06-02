"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CreditCard,
  UserCheck,
  Ban,
  Clock,
  ListFilter,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Plus,
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
  adminGetOrdersAction,
  adminGetCoursesAction,
  adminGetUsersModerationAction,
  adminCreateManualOrderAction,
  adminApproveOrderAction,
  adminRejectOrderAction,
  adminGetTransactionLogsAction,
} from "@/features/admin/actions";

interface Order {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  rejectionReason: string | null;
  createdAt: Date;
  userName: string;
  userEmail: string;
  courseTitle: string;
}

interface AuditLog {
  id: string;
  orderId: string;
  amount: number;
  oldStatus: string;
  newStatus: string;
  paymentMethod: string;
  createdAt: Date;
  adminName: string | null;
}

interface DropdownItem {
  id: string;
  name?: string;
  email?: string;
  title?: string;
}

export default function AdminOrdersPage() {
  const [isPending, startTransition] = useTransition();
  
  // Data lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [students, setStudents] = useState<DropdownItem[]>([]);
  const [courses, setCourses] = useState<DropdownItem[]>([]);

  // Manual placement form states
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [amountCollected, setAmountCollected] = useState<string>("");

  // Rejection dialog state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const loadData = () => {
    startTransition(async () => {
      // 1. Get Orders
      const ordersRes = await adminGetOrdersAction();
      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data as Order[]);
      }

      // 2. Get Audit Logs
      const logsRes = await adminGetTransactionLogsAction();
      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data as AuditLog[]);
      }

      // 3. Get Students (role != admin)
      const studentsRes = await adminGetUsersModerationAction();
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data as DropdownItem[]);
      }

      // 4. Get Courses
      const coursesRes = await adminGetCoursesAction();
      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data as DropdownItem[]);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCourse || !amountCollected) {
      toast.error("Vui lòng chọn Học sinh, Khóa học và nhập Số tiền");
      return;
    }

    const price = parseInt(amountCollected, 10);
    if (isNaN(price) || price < 0) {
      toast.error("Số tiền thu được không hợp lệ");
      return;
    }

    const res = await adminCreateManualOrderAction(selectedStudent, selectedCourse, price);
    if (res.success) {
      toast.success("Đã khởi tạo đơn hàng chờ thanh toán thủ công!");
      setSelectedStudent("");
      setSelectedCourse("");
      setAmountCollected("");
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi tạo đơn hàng");
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!confirm(`Phê duyệt đơn hàng ${orderId}?\nQuyền sở hữu khóa học sẽ được mở và ghi nhận ngày hết hạn tự động cho học sinh.`)) return;

    const res = await adminApproveOrderAction(orderId);
    if (res.success) {
      toast.success("Đã phê duyệt đơn hàng & mở khóa học thành công!");
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi phê duyệt");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrderId || !rejectionReason.trim()) {
      toast.error("Vui lòng cung cấp lý do từ chối giao dịch");
      return;
    }

    const res = await adminRejectOrderAction(rejectingOrderId, rejectionReason);
    if (res.success) {
      toast.success("Đã từ chối giao dịch thành công.");
      setRejectingOrderId(null);
      setRejectionReason("");
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi từ chối đơn hàng");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const historyOrders = orders.filter((o) => o.status !== "PENDING");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Đơn hàng & Kích hoạt Tài khoản</h1>
          <p className="text-muted-foreground mt-1">
            Xử lý thanh toán thủ công (chuyển khoản ngân hàng), kích hoạt tài nguyên học tập và đối soát giao dịch.
          </p>
        </div>
        <Button onClick={loadData} disabled={isPending} variant="outline" className="gap-2 self-start md:self-auto shadow">
          <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} /> Làm mới dữ liệu
        </Button>
      </div>

      {/* REJECTION MODAL */}
      {rejectingOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-red-500/30 animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-red-500/10">
              <CardTitle className="text-sm font-bold text-red-600 flex items-center gap-1.5 uppercase">
                <Ban className="size-4" /> Từ chối giao dịch đơn hàng
              </CardTitle>
              <CardDescription>Cung cấp giải trình lý do hủy bỏ kích hoạt khóa học này.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRejectSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="text-xs font-bold text-muted-foreground font-mono">ĐƠN HÀNG ID: {rejectingOrderId}</div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Lý do từ chối (Bắt buộc gửi học sinh)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background min-h-[80px]"
                    placeholder="Không nhận được số dư khớp với sao kê..."
                    required
                  />
                </div>
              </CardContent>
              <Separator />
              <div className="p-4 flex justify-end gap-2 bg-muted/20">
                <Button type="button" onClick={() => setRejectingOrderId(null)} variant="ghost" className="text-xs">Hủy</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs">Từ chối giao dịch</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* GRID LAYOUT: PLACE ORDER & PENDING ITEMS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create Manual Order */}
        <Card className="border lg:col-span-4 bg-card/40 backdrop-blur-md sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="size-5 text-indigo-500" /> Tạo đơn hàng thủ công
            </CardTitle>
            <CardDescription>Chọn học viên nạp tiền và kích hoạt khóa học thủ công.</CardDescription>
          </CardHeader>
          <Separator />
          <form onSubmit={handleCreateOrder}>
            <CardContent className="space-y-4 pt-4">
              {/* Select Student */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Học sinh nộp học phí</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  required
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Course */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Khóa học đăng ký</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  required
                >
                  <option value="">-- Chọn khóa học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount collected */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Số tiền thực thu (VNĐ)</label>
                <input
                  type="number"
                  value={amountCollected}
                  onChange={(e) => setAmountCollected(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background font-semibold"
                  placeholder="Ví dụ: 199000"
                  min={0}
                  required
                />
              </div>
            </CardContent>
            <Separator className="mt-4" />
            <div className="p-4 bg-muted/20">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/10">
                Tạo Đơn Hàng & Chờ Phê Duyệt
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Side: Pending & History list */}
        <div className="lg:col-span-8 space-y-8">
          {/* Pending Approvals */}
          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="size-5 text-amber-500" /> Đang chờ duyệt kích hoạt ({pendingOrders.length})
                </CardTitle>
                <CardDescription>Danh sách học viên đã chuyển khoản, chờ Admin phê duyệt kích hoạt quyền.</CardDescription>
              </div>
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/5">PENDING</Badge>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map((o) => (
                    <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="text-xs font-bold font-mono text-indigo-600">{o.id}</div>
                        <div className="text-sm font-bold text-primary">{o.userName} ({o.userEmail})</div>
                        <div className="text-xs text-muted-foreground">
                          Đăng ký khóa: <span className="font-semibold text-primary">{o.courseTitle}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Ngày tạo: {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-extrabold text-sm text-primary">{o.amount.toLocaleString()} VNĐ</div>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">{o.paymentMethod}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleApproveOrder(o.id)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                          >
                            <UserCheck className="size-3.5" /> Duyệt
                          </Button>
                          <Button
                            onClick={() => setRejectingOrderId(o.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/20 hover:bg-red-500/10 text-red-600 font-bold text-xs gap-1"
                          >
                            <Ban className="size-3.5" /> Từ chối
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">Hiện tại không có đơn hàng nào chờ duyệt.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ListFilter className="size-5 text-indigo-500" /> Lịch sử xử lý đơn hàng
              </CardTitle>
              <CardDescription>Lịch sử các đơn hàng đã được Duyệt hoặc Từ chối trước đó.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="divide-y max-h-[350px] overflow-y-auto">
                {historyOrders.length > 0 ? (
                  historyOrders.map((o) => (
                    <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                      <div className="space-y-1">
                        <div className="text-xs font-mono font-bold text-muted-foreground">{o.id}</div>
                        <div className="text-sm font-semibold">{o.userName} ({o.userEmail})</div>
                        <div className="text-xs text-muted-foreground">Khóa học: {o.courseTitle}</div>
                        {o.status === "FAILED" && o.rejectionReason && (
                          <p className="text-[10px] text-red-500 italic bg-red-500/5 p-1.5 rounded border border-red-500/10 mt-1">
                            Lý do hủy: {o.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-extrabold text-sm">{o.amount.toLocaleString()} VNĐ</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{new Date(o.createdAt).toLocaleDateString()}</div>
                        </div>
                        {o.status === "SUCCESS" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase font-extrabold tracking-wider text-[10px] gap-1 flex items-center">
                            <CheckCircle className="size-3" /> Thành công
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 uppercase font-extrabold tracking-wider text-[10px] gap-1 flex items-center">
                            <XCircle className="size-3" /> Thất bại
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">Không tìm thấy lịch sử đơn hàng nào.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. TRANSACTION AUDIT LOGS (IMMUTABLE, APPEND-ONLY) */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-indigo-500" /> Đối soát Giao dịch Hệ thống (Audit Logs)
          </CardTitle>
          <CardDescription>
            Bảng nhật ký bất biến ghi lại mọi sự thay đổi trạng thái của luồng tài chính. Hệ thống tự động ghi nhật ký vĩnh viễn và không cung cấp thao tác sửa/xóa ở bất kỳ API nào.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left divide-y">
              <thead className="bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Mã Log</th>
                  <th className="px-6 py-4">Đơn hàng ID</th>
                  <th className="px-6 py-4">Phương thức</th>
                  <th className="px-6 py-4">Số tiền</th>
                  <th className="px-6 py-4">Chuyển trạng thái</th>
                  <th className="px-6 py-4">Admin thực hiện</th>
                  <th className="px-6 py-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground">{log.id}</td>
                      <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-600">{log.orderId}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px]">{log.paymentMethod}</Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold">{log.amount.toLocaleString()} VNĐ</td>
                      <td className="px-6 py-4 font-medium flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-muted-foreground">{log.oldStatus}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className={`text-xs font-bold ${log.newStatus === 'SUCCESS' ? 'text-emerald-600' : log.newStatus === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>
                          {log.newStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-xs">{log.adminName ?? "SYSTEM"}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      Chưa phát sinh bản ghi đối soát giao dịch nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
