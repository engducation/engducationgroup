"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ShieldAlert,
  UserX,
  UserCheck,
  History,
  Info,
  Calendar,
  Globe,
  Terminal,
  Search,
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
  adminGetUsersModerationAction,
  adminBanUserAction,
  adminUnbanUserAction,
  adminGetAuditLogsAction,
} from "@/features/admin/actions";

interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string;
  banReason: string | null;
  createdAt: Date;
}

interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  oldPayload: string | null;
  newPayload: string | null;
  createdAt: Date;
}

export default function AdminUsersPage() {
  const [isPending, startTransition] = useTransition();

  // Data states
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Banning dialog state
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<string>("");

  // Payload comparison preview state
  const [selectedAuditLog, setSelectedAuditLog] = useState<AdminAuditLog | null>(null);

  const loadData = () => {
    startTransition(async () => {
      // 1. Get students for moderation
      const usersRes = await adminGetUsersModerationAction();
      if (usersRes.success && usersRes.data) {
        setStudents(usersRes.data as StudentUser[]);
      }

      // 2. Get Admin Audit Logs
      const logsRes = await adminGetAuditLogsAction();
      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data as AdminAuditLog[]);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banningUserId || !banReason.trim()) {
      toast.error("Vui lòng nhập lý do khóa tài khoản");
      return;
    }

    const res = await adminBanUserAction(banningUserId, banReason);
    if (res.success) {
      toast.success("Đã khóa tài khoản học viên và vô hiệu hóa các phiên đăng nhập!");
      setBanningUserId(null);
      setBanReason("");
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi khóa tài khoản");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm("Xác nhận mở khóa hoạt động cho tài khoản này?")) return;

    const res = await adminUnbanUserAction(userId);
    if (res.success) {
      toast.success("Đã mở khóa tài khoản thành công!");
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi mở khóa");
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Người dùng & Kiểm soát An ninh</h1>
          <p className="text-muted-foreground mt-1">
            Quản trị viên khóa/mở khóa tài khoản học viên vi phạm, thu hồi JWT/Session đăng nhập tức thời, rà soát nhật ký hoạt động hệ thống.
          </p>
        </div>
        <Button onClick={loadData} disabled={isPending} variant="outline" className="gap-2 self-start md:self-auto shadow">
          <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} /> Làm mới dữ liệu
        </Button>
      </div>

      {/* BAN CONFIRMATION DIALOG MODAL */}
      {banningUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-red-600/40 animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-red-500/10">
              <CardTitle className="text-sm font-bold text-red-600 flex items-center gap-1.5 uppercase">
                <ShieldAlert className="size-4 animate-pulse" /> Khóa tài khoản Học viên
              </CardTitle>
              <CardDescription>
                Hành động này sẽ lập tức chuyển trạng thái tài khoản sang BANNED và xóa toàn bộ các phiên hoạt động hiện hành trên tất cả thiết bị của học viên.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleBanSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="text-xs text-muted-foreground font-mono">USER ID: {banningUserId}</div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Lý do khóa tài khoản (Bắt buộc ghi nhận giải trình)</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background min-h-[80px]"
                    placeholder="Lợi dụng script spam liên tục nộp bài viết AI / Nhập ngôn từ thù ghét..."
                    required
                  />
                </div>
              </CardContent>
              <Separator />
              <div className="p-4 flex justify-end gap-2 bg-muted/20">
                <Button type="button" onClick={() => setBanningUserId(null)} variant="ghost" className="text-xs">Hủy</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs">Xác nhận Khóa (Ban)</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* AUDIT LOG PAYLOAD COMPARISON MODAL */}
      {selectedAuditLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-none animate-in zoom-in-95 duration-200 bg-card">
            <CardHeader className="bg-indigo-500/5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-sm font-bold text-indigo-600 flex items-center gap-1.5 uppercase">
                    <Terminal className="size-4" /> Nhật ký chi tiết hoạt động (Data Payload)
                  </CardTitle>
                  <CardDescription>So sánh sự thay đổi của đối tượng dữ liệu trong DB.</CardDescription>
                </div>
                <Button onClick={() => setSelectedAuditLog(null)} variant="ghost" size="sm" className="text-xs">
                  Đóng
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 overflow-y-auto max-h-[450px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Trạng thái trước khi sửa (Old Payload)</div>
                  <pre className="p-3 border rounded bg-muted/30 font-mono text-[10px] whitespace-pre-wrap overflow-x-auto text-primary">
                    {selectedAuditLog.oldPayload ? JSON.stringify(JSON.parse(selectedAuditLog.oldPayload), null, 2) : "Không có (Tạo mới)"}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Trạng thái sau khi sửa (New Payload)</div>
                  <pre className="p-3 border rounded bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20 font-mono text-[10px] whitespace-pre-wrap overflow-x-auto text-primary">
                    {selectedAuditLog.newPayload ? JSON.stringify(JSON.parse(selectedAuditLog.newPayload), null, 2) : "Không có (Xóa bỏ)"}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MAIN LAYOUT: SEARCH & STUDENTS MODERATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Middle: Students moderation list */}
        <Card className="border lg:col-span-8 bg-card/40 backdrop-blur-md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-lg font-bold">Danh sách học viên và an ninh</CardTitle>
              <CardDescription>Quản lý trạng thái vận hành của tài khoản học viên cuối.</CardDescription>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs bg-background outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-primary flex items-center gap-2">
                        {s.name}
                        {s.status === "BANNED" ? (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[9px] uppercase tracking-wider font-extrabold">BANNED</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] uppercase tracking-wider font-extrabold">ACTIVE</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">{s.email}</div>
                      <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                        <Calendar className="size-3" /> Đăng ký ngày: {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                      {s.status === "BANNED" && s.banReason && (
                        <p className="text-[10px] text-red-500 italic bg-red-500/5 p-1.5 rounded border border-red-500/10 mt-1">
                          Lý do khóa: {s.banReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center shrink-0">
                      {s.status === "ACTIVE" ? (
                        <Button
                          onClick={() => setBanningUserId(s.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1 shadow"
                        >
                          <UserX className="size-3.5" /> Khóa tài khoản (Ban)
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUnbanUser(s.id)}
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 font-bold text-xs gap-1"
                        >
                          <UserCheck className="size-3.5" /> Mở khóa hoạt động
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">Không tìm thấy học viên nào khớp với tìm kiếm.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Quick security alerts and guidelines */}
        <Card className="border lg:col-span-4 bg-red-500/5 border-red-500/15">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-red-600 uppercase flex items-center gap-1.5">
              <ShieldAlert className="size-4 text-red-500 animate-pulse" /> Hướng dẫn an ninh vận hành
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs text-muted-foreground leading-relaxed pt-1">
            <p>
              Hệ thống được tích hợp cổng kiểm soát chi phí OpenAI API. Admin thực hiện khóa tài khoản học viên dựa trên:
            </p>
            <Separator className="bg-red-500/10" />
            <ul className="space-y-2 list-disc pl-4 font-medium">
              <li>Spam liên tiếp request gọi AI Writing (hệ thống tự động phát hiện và cảnh báo).</li>
              <li>Học viên cố tình tiêm các prompt độc hại, văn từ bạo lực hoặc thù ghét vào bài viết.</li>
              <li>Học viên dùng tài khoản ảo chia sẻ rộng rãi gây thất thoát API key.</li>
            </ul>
            <Separator className="bg-red-500/10" />
            <p className="font-bold text-red-600">
              * Chú ý: Hành động khóa tài khoản sẽ thu hồi phiên JWT ngay lập tức. Mọi hành động Ban/Unban đều được lưu lại vĩnh viễn vào nhật ký Audit Logs bên dưới.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. ADMIN OPERATIONS AUDIT LOGS (IMMUTABLE, APPEND-ONLY) */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="size-5 text-indigo-500" /> Nhật ký thao tác của Admin (Admin Audit Logs)
          </CardTitle>
          <CardDescription>
            Bảng theo dõi minh bạch lưu vết toàn bộ hoạt động Thêm, Sửa, Xóa dữ liệu nhạy cảm hoặc cấu hình từ tài khoản quản trị viên.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left divide-y">
              <thead className="bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tác nhân Admin</th>
                  <th className="px-6 py-4">Hành động nghiệp vụ</th>
                  <th className="px-6 py-4">IP Thiết bị</th>
                  <th className="px-6 py-4">Trình duyệt/Thiết bị</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-center">Payload thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary text-xs">{log.adminEmail}</div>
                        <Badge variant="outline" className="text-[9px] font-extrabold uppercase mt-1 text-indigo-600">{log.adminRole}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[9px] uppercase tracking-wider font-extrabold">{log.action}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs flex items-center gap-1.5 mt-2">
                        <Globe className="size-3 text-muted-foreground" /> {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="px-6 py-4 text-xs max-w-[200px] truncate" title={log.userAgent || "Unknown"}>
                        {log.userAgent || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          onClick={() => setSelectedAuditLog(log)}
                          variant="ghost"
                          size="sm"
                          className="text-xs hover:text-indigo-600 font-bold gap-1 text-indigo-500"
                        >
                          <Info className="size-3.5" /> Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      Chưa phát sinh hoạt động quản trị nào cần ghi nhận log.
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
