"use client";

import { useEffect, useState, useTransition } from "react";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  Video,
  FileText,
  PenLine,
  Check,
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminGetCoursesAction,
  adminCreateCourseAction,
  adminUpdateCourseAction,
  adminDeleteCourseAction,
  adminGetModulesAction,
  adminCreateModuleAction,
  adminUpdateModuleAction,
  adminDeleteModuleAction,
  adminGetLessonsAction,
  adminCreateLessonAction,
  adminUpdateLessonAction,
  adminDeleteLessonAction,
} from "@/features/admin/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: Date;
  modulesCount?: number;
}

interface Module {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  lessonsCount?: number;
  description?: string | null;
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  orderIndex: number;
  hasRead: boolean;
  hasWrite: boolean;
  hasVideo: boolean;
  videoUrl?: string | null;
}

// ─── Course Form ─────────────────────────────────────────────────────────────

interface CourseFormData {
  title: string;
  description: string;
  level: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

function CourseDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: CourseFormData) => void;
  initial?: Course;
}) {
  const [form, setForm] = useState<CourseFormData>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    level: initial?.level ?? "A1",
    status: initial?.status ?? "DRAFT",
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        level: initial?.level ?? "A1",
        status: initial?.status ?? "DRAFT",
      });
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Chỉnh sửa Khóa học" : "Tạo Khóa học mới"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Cập nhật thông tin chi tiết khóa học."
              : "Thiết lập khóa học mới với tên, mô tả và cấp độ phù hợp."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tên Khóa học (bắt buộc)</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ví dụ: Ngữ pháp A1 — Căn bản"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Mô tả ngắn gọn nội dung khóa học..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cấp độ</Label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                  <option key={l} value={l}>
                    {l} — {l === "A1" ? "Sơ cấp" : l === "A2" ? "Tiền trung cấp" : l === "B1" ? "Trung cấp" : l === "B2" ? "Tiền cao cấp" : l === "C1" ? "Cao cấp" : "Thành thạo"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as CourseFormData["status"],
                  })
                }
              >
                <option value="DRAFT">Bản nháp (Draft)</option>
                <option value="PUBLISHED">Xuất bản (Published)</option>
                <option value="ARCHIVED">Lưu trữ (Archived)</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={!form.title.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {initial ? "Lưu thay đổi" : "Tạo Khóa học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Module/Lesson Form ───────────────────────────────────────────────────────

function SmallDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  confirmLabel,
  confirmClassName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmLabel: string;
  confirmClassName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm} className={confirmClassName}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
  const [isPending, startTransition] = useTransition();

  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesMap, setModulesMap] = useState<Record<string, Module[]>>({});
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});

  // Expanded state
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>();
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [moduleCourseId, setModuleCourseId] = useState("");

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>();
  const [lessonForm, setLessonForm] = useState({
    title: "",
    hasRead: true,
    hasWrite: true,
    hasVideo: false,
    videoUrl: "",
    content: "",
  });
  const [lessonModuleId, setLessonModuleId] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "course" | "module" | "lesson";
    id: string;
    label: string;
  } | null>(null);

  const loadData = () => {
    startTransition(async () => {
      const res = await adminGetCoursesAction();
      if (res.success && res.data) {
        setCourses(res.data as Course[]);
        // Expand first course by default if none expanded
      }

      // Load modules for all courses
      const courseRes = await adminGetCoursesAction();
      if (courseRes.success && courseRes.data) {
        const courseList = courseRes.data as Course[];
        const modulesResult: Record<string, Module[]> = {};
        for (const c of courseList) {
          const modRes = await adminGetModulesAction(c.id);
          if (modRes.success && modRes.data) {
            modulesResult[c.id] = modRes.data as Module[];
          }
        }
        setModulesMap(modulesResult);

        // Load lessons for all modules
        const lessonsResult: Record<string, Lesson[]> = {};
        for (const mods of Object.values(modulesResult)) {
          for (const m of mods) {
            const lesRes = await adminGetLessonsAction(m.id);
            if (lesRes.success && lesRes.data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lessonsResult[m.id] = lesRes.data as any;
            }
          }
        }
        setLessonsMap(lessonsResult);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Course CRUD ──
  const handleCourseSubmit = async (data: CourseFormData) => {
    const res = editingCourse
      ? await adminUpdateCourseAction({ ...data, id: editingCourse.id })
      : await adminCreateCourseAction(data);

    if (res.success) {
      toast.success(
        editingCourse ? "Đã cập nhật khóa học!" : "Đã tạo khóa học mới!"
      );
      setCourseDialogOpen(false);
      setEditingCourse(undefined);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi lưu khóa học");
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return;
    const res = await adminDeleteCourseAction(deleteTarget.id);
    if (res.success) {
      toast.success("Đã xóa khóa học!");
    } else {
      toast.error(res.error || "Không thể xóa khóa học có Module/Bài học bên trong");
    }
    setDeleteTarget(null);
    loadData();
  };

  // ── Module CRUD ──
  const openModuleDialog = (courseId: string, module?: Module) => {
    setModuleCourseId(courseId);
    setEditingModule(module);
    setModuleForm({
      title: module?.title ?? "",
      description: module?.description ?? "",
    });
    setModuleDialogOpen(true);
  };

  const handleModuleSubmit = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Vui lòng nhập tên Module");
      return;
    }
    const res = editingModule
      ? await adminUpdateModuleAction({
          id: editingModule.id,
          title: moduleForm.title,
          description: moduleForm.description,
        })
      : await adminCreateModuleAction({
          courseId: moduleCourseId,
          title: moduleForm.title,
          description: moduleForm.description,
        });

    if (res.success) {
      toast.success(editingModule ? "Đã cập nhật Module!" : "Đã tạo Module mới!");
      setModuleDialogOpen(false);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi lưu Module");
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteTarget) return;
    const res = await adminDeleteModuleAction(deleteTarget.id);
    if (res.success) {
      toast.success("Đã xóa Module!");
    } else {
      toast.error(res.error || "Lỗi khi xóa Module");
    }
    setDeleteTarget(null);
    loadData();
  };

  // ── Lesson CRUD ──
  const openLessonDialog = (moduleId: string, lesson?: Lesson) => {
    setLessonModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson?.title ?? "",
      hasRead: lesson?.hasRead ?? true,
      hasWrite: lesson?.hasWrite ?? true,
      hasVideo: lesson?.hasVideo ?? false,
      videoUrl: lesson?.videoUrl ?? "",
      content: "",
    });
    setLessonDialogOpen(true);
  };

  const handleLessonSubmit = async () => {
    if (!lessonForm.title.trim()) {
      toast.error("Vui lòng nhập tên Bài học");
      return;
    }
    const res = editingLesson
      ? await adminUpdateLessonAction({
          id: editingLesson.id,
          title: lessonForm.title,
          hasRead: lessonForm.hasRead,
          hasWrite: lessonForm.hasWrite,
          hasVideo: lessonForm.hasVideo,
          videoUrl: lessonForm.videoUrl,
        })
      : await adminCreateLessonAction({
          moduleId: lessonModuleId,
          title: lessonForm.title,
          hasRead: lessonForm.hasRead,
          hasWrite: lessonForm.hasWrite,
          hasVideo: lessonForm.hasVideo,
          videoUrl: lessonForm.videoUrl,
        });

    if (res.success) {
      toast.success(editingLesson ? "Đã cập nhật Bài học!" : "Đã tạo Bài học mới!");
      setLessonDialogOpen(false);
      loadData();
    } else {
      toast.error(res.error || "Lỗi khi lưu Bài học");
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteTarget) return;
    const res = await adminDeleteLessonAction(deleteTarget.id);
    if (res.success) {
      toast.success("Đã xóa Bài học!");
    } else {
      toast.error(res.error || "Lỗi khi xóa Bài học");
    }
    setDeleteTarget(null);
    loadData();
  };

  const toggleCourse = (id: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PUBLISHED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    ARCHIVED: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };
  const statusLabels: Record<string, string> = {
    DRAFT: "Bản nháp",
    PUBLISHED: "Xuất bản",
    ARCHIVED: "Lưu trữ",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Quản lý Nội dung Học tập
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý cây thư mục: Khóa học → Chương (Module) → Bài học (Lesson) kèm nội dung Video Cloudinary.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCourse(undefined);
            setCourseDialogOpen(true);
          }}
          className="gap-2 self-start md:self-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg"
        >
          <Plus className="size-4" /> Tạo Khóa học mới
        </Button>
      </div>

      {/* Course Dialog */}
      <CourseDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        onSubmit={handleCourseSubmit}
        initial={editingCourse}
      />

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Chỉnh sửa Chương" : "Tạo Chương mới"}
            </DialogTitle>
            <DialogDescription>
              Thêm một Chương (Module) vào trong Khóa học hiện tại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên Chương (bắt buộc)</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, title: e.target.value })
                }
                placeholder="Ví dụ: Unit 1 — Thì Hiện tại Đơn"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, description: e.target.value })
                }
                placeholder="Mô tả ngắn nội dung chương..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModuleDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleModuleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {editingModule ? "Lưu thay đổi" : "Tạo Chương"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Chỉnh sửa Bài học" : "Tạo Bài học mới"}
            </DialogTitle>
            <DialogDescription>
              Bật/tắt các cấu phần nội dung: Read (văn bản), Write (bài tập viết AI), Video (Cloudinary).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên Bài học (bắt buộc)</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, title: e.target.value })
                }
                placeholder="Ví dụ: Bài 1.1 — Sự khác nhau giữa is/are"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
                Cấu phần nội dung
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setLessonForm({ ...lessonForm, hasRead: !lessonForm.hasRead })
                  }
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    lessonForm.hasRead
                      ? "border-indigo-500 bg-indigo-500/5 text-indigo-600"
                      : "border-dashed border-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  <FileText className="size-5" />
                  <span className="text-xs font-bold">Read</span>
                  <span className="text-[10px]">Văn bản bài học</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setLessonForm({ ...lessonForm, hasWrite: !lessonForm.hasWrite })
                  }
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    lessonForm.hasWrite
                      ? "border-indigo-500 bg-indigo-500/5 text-indigo-600"
                      : "border-dashed border-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  <PenLine className="size-5" />
                  <span className="text-xs font-bold">Write</span>
                  <span className="text-[10px]">Bài tập viết AI</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setLessonForm({
                      ...lessonForm,
                      hasVideo: !lessonForm.hasVideo,
                      videoUrl: !lessonForm.hasVideo ? lessonForm.videoUrl : "",
                    })
                  }
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    lessonForm.hasVideo
                      ? "border-indigo-500 bg-indigo-500/5 text-indigo-600"
                      : "border-dashed border-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  <Video className="size-5" />
                  <span className="text-xs font-bold">Video</span>
                  <span className="text-[10px]">Cloudinary</span>
                </button>
              </div>
            </div>

            {lessonForm.hasVideo && (
              <div className="space-y-1.5">
                <Label>Video URL (Cloudinary)</Label>
                <Input
                  value={lessonForm.videoUrl}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, videoUrl: e.target.value })
                  }
                  placeholder="https://res.cloudinary.com/.../video.mp4"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLessonDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleLessonSubmit}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {editingLesson ? "Lưu thay đổi" : "Tạo Bài học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="size-4" /> Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa{" "}
              <strong>{deleteTarget?.label}</strong>? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button
              onClick={
                deleteTarget?.type === "course"
                  ? handleDeleteCourse
                  : deleteTarget?.type === "module"
                  ? handleDeleteModule
                  : handleDeleteLesson
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Tree */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="size-5 text-indigo-500" />
            Danh sách Khóa học & Cấu trúc Bài học
          </CardTitle>
          <CardDescription>
            Mở rộng khóa học để xem các Chương và Bài học bên trong.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <div className="divide-y">
            {courses.length === 0 && (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Chưa có khóa học nào. Hãy tạo khóa học đầu tiên!
              </div>
            )}

            {courses.map((course) => {
              const isExpanded = expandedCourses.has(course.id);
              const modules = modulesMap[course.id] ?? [];

              return (
                <div key={course.id}>
                  {/* Course Row */}
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                    <button
                      onClick={() => toggleCourse(course.id)}
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-primary">
                          {course.title}
                        </span>
                        <Badge
                          className={`text-[9px] font-extrabold uppercase tracking-wider border ${statusColors[course.status]}`}
                        >
                          {statusLabels[course.status]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase"
                        >
                          {course.level}
                        </Badge>
                      </div>
                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-indigo-600"
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseDialogOpen(true);
                        }}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() =>
                          setDeleteTarget({
                            type: "course",
                            id: course.id,
                            label: course.title,
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1 ml-2"
                        onClick={() => {
                          setModuleCourseId(course.id);
                          setEditingModule(undefined);
                          setModuleDialogOpen(true);
                        }}
                      >
                        <Plus className="size-3" /> Chương
                      </Button>
                    </div>
                  </div>

                  {/* Modules */}
                  {isExpanded && (
                    <div className="bg-muted/20 border-t">
                      {modules.length === 0 && (
                        <div className="px-8 py-4 text-xs text-muted-foreground italic">
                          Chưa có Chương nào. Nhấn &quot;+ Chương&quot; để tạo.
                        </div>
                      )}

                      {modules.map((mod) => {
                        const isModExpanded = expandedModules.has(mod.id);
                        const lessons = lessonsMap[mod.id] ?? [];

                        return (
                          <div key={mod.id}>
                            <div className="flex items-center gap-3 px-8 py-3 hover:bg-background transition-colors border-t border-muted/30">
                              <button
                                onClick={() => toggleModule(mod.id)}
                                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                              >
                                {isModExpanded ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronRight className="size-3.5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-primary">
                                  {mod.title}
                                </span>
                                {mod.description && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    — {mod.description}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 text-muted-foreground hover:text-indigo-600"
                                  onClick={() => openModuleDialog(course.id, mod)}
                                >
                                  <Edit className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 text-muted-foreground hover:text-red-500"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "module",
                                      id: mod.id,
                                      label: mod.title,
                                    })
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] gap-0.5 px-2 py-1 h-7"
                                  onClick={() => {
                                    setLessonModuleId(mod.id);
                                    setEditingLesson(undefined);
                                    setLessonDialogOpen(true);
                                  }}
                                >
                                  <Plus className="size-3" />
                                  Bài
                                </Button>
                              </div>
                            </div>

                            {/* Lessons */}
                            {isModExpanded && (
                              <div className="bg-background border-t border-muted/30">
                                {lessons.length === 0 && (
                                  <div className="px-14 py-3 text-[11px] text-muted-foreground italic">
                                    Chưa có Bài học nào.
                                  </div>
                                )}

                                {lessons.map((les) => (
                                  <div
                                    key={les.id}
                                    className="flex items-center gap-3 px-14 py-2.5 hover:bg-muted/20 transition-colors border-t border-muted/20 text-xs"
                                  >
                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                      <span className="font-semibold text-primary truncate">
                                        {les.title}
                                      </span>
                                      <div className="flex gap-1 shrink-0">
                                        {les.hasRead && (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] font-bold border-indigo-500/20 text-indigo-600 bg-indigo-500/5"
                                          >
                                            <FileText className="size-2.5 mr-0.5" />{" "}
                                            Read
                                          </Badge>
                                        )}
                                        {les.hasWrite && (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] font-bold border-indigo-500/20 text-indigo-600 bg-indigo-500/5"
                                          >
                                            <PenLine className="size-2.5 mr-0.5" />{" "}
                                            Write
                                          </Badge>
                                        )}
                                        {les.hasVideo && (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] font-bold border-indigo-500/20 text-indigo-600 bg-indigo-500/5"
                                          >
                                            <Video className="size-2.5 mr-0.5" />{" "}
                                            Video
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="size-6 p-0 text-muted-foreground hover:text-indigo-600"
                                        onClick={() => openLessonDialog(mod.id, les)}
                                      >
                                        <Edit className="size-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="size-6 p-0 text-muted-foreground hover:text-red-500"
                                        onClick={() =>
                                          setDeleteTarget({
                                            type: "lesson",
                                            id: les.id,
                                            label: les.title,
                                          })
                                        }
                                      >
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={loadData}
          disabled={isPending}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          Làm mới dữ liệu
        </Button>
      </div>
    </div>
  );
}
