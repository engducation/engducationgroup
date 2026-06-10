"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle,
  Circle,
  Layers3,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/features/admin/api/admin-api";
import { useAdminCourses } from "@/features/admin/hooks/use-admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

function StatusRow({ status }: { status: string }) {
  if (status === "PUBLISHED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
        <CheckCircle className="size-3 shrink-0" />
        Đã xuất bản
      </span>
    );
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
        <XCircle className="size-3 shrink-0" />
        Đã lưu trữ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
      <Circle className="size-3 shrink-0" />
      Bản nháp
    </span>
  );
}

const defaultForm = {
  title: "",
  description: "",
  level: "",
  thumbnailUrl: "",
  certificateTemplateUrl: "",
};

export default function AdminCoursesPage() {
  const { data, isLoading, error, refetch } = useAdminCourses();
  const courses = (data ?? []) as any[];
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const resetForm = () => setForm(defaultForm);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.level.trim()) {
      toast.error("Vui lòng nhập tên khóa học và trình độ");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createCourse({
        title: form.title,
        description: form.description || undefined,
        level: form.level,
        thumbnailUrl: form.thumbnailUrl || undefined,
        certificateTemplateUrl: form.certificateTemplateUrl || undefined,
      });
      toast.success("Đã tạo khóa học mới");
      setOpen(false);
      resetForm();
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo khóa học");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishToggle = async (courseId: string, status: string) => {
    try {
      if (status === "PUBLISHED") {
        await adminApi.unpublishCourse(courseId);
        toast.success("Đã chuyển khóa học về bản nháp");
      } else {
        await adminApi.publishCourse(courseId);
        toast.success("Đã xuất bản khóa học");
      }
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      await adminApi.deleteCourse(courseId);
      toast.success("Đã xóa khóa học");
      setConfirmDelete(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa khóa học");
    }
  };

  const publishedCount = courses.filter((c) => c.status === "PUBLISHED").length;
  const draftCount = courses.filter((c) => c.status === "DRAFT").length;
  const archivedCount = courses.filter((c) => c.status === "ARCHIVED").length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Quản lý khóa học
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Tạo, chỉnh sửa và quản lý nội dung khóa học.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 shrink-0">
              <Plus className="size-4" />
              Tạo khóa học
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo khóa học mới</DialogTitle>
              <DialogDescription>
                Khóa học sẽ được tạo ở trạng thái bản nháp. Sau khi hoàn tất nội dung, bạn có thể xuất bản.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 px-1 pb-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Tên khóa học *</label>
                <Input
                  placeholder="VD: IELTS Writing Masterclass"
                  value={form.title}
                  onChange={(e) => setForm((curr) => ({ ...curr, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Trình độ *</label>
                <Input
                  placeholder="VD: IELTS 5.5–6.5"
                  value={form.level}
                  onChange={(e) => setForm((curr) => ({ ...curr, level: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Mô tả</label>
                <Textarea
                  placeholder="Mô tả ngắn gọn về nội dung và mục tiêu khóa học..."
                  value={form.description}
                  onChange={(e) => setForm((curr) => ({ ...curr, description: e.target.value }))}
                  className="min-h-20 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Thumbnail URL</label>
                <Input
                  placeholder="https://..."
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm((curr) => ({ ...curr, thumbnailUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Certificate template URL</label>
                <Input
                  placeholder="https://..."
                  value={form.certificateTemplateUrl}
                  onChange={(e) => setForm((curr) => ({ ...curr, certificateTemplateUrl: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                <Sparkles className="size-4" />
                {submitting ? "Đang tạo..." : "Tạo khóa học"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200/80 bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tổng khóa học</p>
              <p className="text-2xl font-bold text-slate-950">{courses.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Đã xuất bản</p>
              <p className="text-2xl font-bold text-slate-950">{publishedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Circle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Bản nháp</p>
              <p className="text-2xl font-bold text-slate-950">{draftCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error state */}
      {error ? (
        <Card className="border-red-200/60 bg-red-50/50">
          <CardContent className="flex items-center gap-3 p-4">
            <p className="text-sm text-red-600">{String(error)}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Course table */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BookOpen className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Danh sách khóa học</CardTitle>
              <CardDescription className="text-xs">
                {courses.length > 0
                  ? `${courses.length} khóa học`
                  : "Chưa có khóa học nào"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <BookOpen className="size-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Chưa có khóa học nào</p>
              <p className="mt-1 text-xs text-slate-400">
                Nhấn "Tạo khóa học" để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {courses.map((course: any) => {
                const moduleCount = course.modules?.length ?? 0;
                const lessonCount =
                  course.modules?.reduce(
                    (total: number, item: any) => total + (item.lessons?.length ?? 0),
                    0,
                  ) ?? 0;

                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-5 hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Thumbnail placeholder */}
                    <div className="size-12 shrink-0 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 flex items-center justify-center">
                      {course.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="size-12 rounded-xl object-cover"
                        />
                      ) : (
                        <BookOpen className="size-5 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-950 truncate">
                          {course.title}
                        </h3>
                        <StatusRow status={course.status} />
                        <Badge variant="outline" className="text-[10px]">
                          {course.level}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span>{moduleCount} chương</span>
                        <span>{lessonCount} bài học</span>
                        <span>
                          {course.certificateTemplateUrl ? "✓ Chứng chỉ" : "— Chưa cấu hình chứng chỉ"}
                        </span>
                      </div>
                      {course.description && (
                        <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                          {course.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs rounded-lg"
                          onClick={() => handlePublishToggle(course.id, course.status)}
                        >
                          {course.status === "PUBLISHED" ? (
                            <>
                              <XCircle className="size-3" />
                              Bản nháp
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3" />
                              Xuất bản
                            </>
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              render={
                                <Link
                                  href={`/admin/courses/${course.id}/content`}
                                  className="flex cursor-pointer items-center gap-2"
                                />
                              }
                            >
                              <Layers3 className="size-4" />
                              Quản lý nội dung
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
                              onClick={() => setConfirmDelete(course.id)}
                            >
                              <Trash2 className="size-4" />
                              Xóa khóa học
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                    {/* Always-visible primary CTA */}
                    <Link href={`/admin/courses/${course.id}/content`}>
                      <Button size="sm" className="h-8 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 shrink-0">
                        <Layers3 className="size-3" />
                        Nội dung
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa khóa học</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Toàn bộ nội dung bên trong sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              <Trash2 className="size-4" />
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
