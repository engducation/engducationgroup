"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers3, PencilLine, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>;
  }

  if (status === "ARCHIVED") {
    return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">Archived</Badge>;
  }

  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>;
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
      toast.success("Đã tạo khóa học");
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
        toast.success("Đã chuyển khóa học về draft");
      } else {
        await adminApi.publishCourse(courseId);
        toast.success("Đã publish khóa học");
      }
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật trạng thái khóa học");
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      await adminApi.deleteCourse(courseId);
      toast.success("Đã xóa khóa học");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa khóa học");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Quản lý khóa học</h1>
          <p className="text-sm text-slate-600">Tạo khóa học, cập nhật pricing và mở workspace nội dung.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700"><Plus data-icon="inline-start" />Tạo khóa học</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo khóa học mới</DialogTitle>
              <DialogDescription>Khóa học mới sẽ được tạo ở trạng thái draft theo nghiệp vụ.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 px-4 pb-2">
              <Input placeholder="Tên khóa học" value={form.title} onChange={(e) => setForm((curr) => ({ ...curr, title: e.target.value }))} />
              <Input placeholder="Trình độ" value={form.level} onChange={(e) => setForm((curr) => ({ ...curr, level: e.target.value }))} />
              <Textarea placeholder="Mô tả khóa học" value={form.description} onChange={(e) => setForm((curr) => ({ ...curr, description: e.target.value }))} />
              <Input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={(e) => setForm((curr) => ({ ...curr, thumbnailUrl: e.target.value }))} />
              <Input placeholder="Certificate template URL" value={form.certificateTemplateUrl} onChange={(e) => setForm((curr) => ({ ...curr, certificateTemplateUrl: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                <Sparkles data-icon="inline-start" />
                {submitting ? "Đang tạo..." : "Tạo khóa học"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-slate-200">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <section className="grid gap-4">
          {courses.map((course: any) => {
            const moduleCount = course.modules?.length ?? 0;
            const lessonCount = course.modules?.reduce((total: number, item: any) => total + (item.lessons?.length ?? 0), 0) ?? 0;
            return (
              <Card key={course.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{course.title}</CardTitle>
                        <StatusBadge status={course.status} />
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                      <CardDescription>{course.description || "Chưa có mô tả"}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handlePublishToggle(course.id, course.status)}>
                        <Sparkles data-icon="inline-start" />
                        {course.status === "PUBLISHED" ? "Đưa về draft" : "Publish"}
                      </Button>
                      <Button variant="outline" onClick={() => handleDelete(course.id)}>
                        <Trash2 data-icon="inline-start" />
                        Xóa
                      </Button>
                      <Link href={`/admin/courses/${course.id}/content`}>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                          <Layers3 data-icon="inline-start" />
                          Quản lý nội dung
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Chương học</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{moduleCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bài học</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{lessonCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Chứng chỉ</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{course.certificateTemplateUrl ? "Đã cấu hình" : "Chưa có"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
