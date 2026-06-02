"use client";

import { useEffect, useState, useTransition } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminGetCoursesAction,
  adminGetModulesAction,
  adminGetLessonsAction,
  adminGetQuizzesAction,
  adminCreateQuizAction,
  adminDeleteQuizAction,
  adminGetQuizQuestionsAction,
  adminCreateQuizQuestionAction,
  adminUpdateQuizQuestionAction,
  adminDeleteQuizQuestionAction,
} from "@/features/admin/actions";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  level: string;
  status: string;
}

interface Module {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  hasQuiz: boolean;
}

interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string;
  correctOption: number;
  explanation: string;
  orderIndex: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminQuizzesPage() {
  const [isPending, startTransition] = useTransition();

  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesMap, setModulesMap] = useState<Record<string, Module[]>>({});
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});
  const [quizzesMap, setQuizzesMap] = useState<Record<string, any[]>>({});
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuizQuestion[]>>({});

  // Expansion state
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Selected lesson for quiz management
  const [selectedLesson, setSelectedLesson] = useState<{
    lesson: Lesson;
    module: Module;
    course: Course;
  } | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "quiz" | "question";
    id: string;
    label: string;
    lessonId?: string;
  } | null>(null);

  // Question form
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", ""],
    correctOption: 0,
    explanation: "",
  });

  const loadData = () => {
    startTransition(async () => {
      const res = await adminGetCoursesAction();
      if (res.success && res.data) {
        setCourses(res.data as Course[]);

        const modsMap: Record<string, Module[]> = {};
        const lesMap: Record<string, Lesson[]> = {};
        const quizMap: Record<string, any[]> = {};

        for (const course of res.data as Course[]) {
          const modRes = await adminGetModulesAction(course.id);
          if (modRes.success && modRes.data) {
            const modList = modRes.data as Module[];
            modsMap[course.id] = modList;

            for (const mod of modList) {
              const lesRes = await adminGetLessonsAction(mod.id);
              if (lesRes.success && lesRes.data) {
                const lesList = lesRes.data as Lesson[];
                lesMap[mod.id] = lesList;

                // Load quizzes for each lesson
                for (const les of lesList) {
                  const quizRes = await adminGetQuizzesAction(les.id);
                  if (quizRes.success && quizRes.data) {
                    quizMap[les.id] = quizRes.data;
                    // Load questions for each quiz
                    for (const q of quizRes.data) {
                      const questRes = await adminGetQuizQuestionsAction(q.id);
                      if (questRes.success && questRes.data) {
                        setQuestionsMap((prev) => ({
                          ...prev,
                          [q.id]: questRes.data as QuizQuestion[],
                        }));
                      }
                    }
                  } else {
                    quizMap[les.id] = [];
                  }
                }
              }
            }
          }
        }

        setModulesMap(modsMap);
        setLessonsMap(lesMap);
        setQuizzesMap(quizMap);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleCourse = (id: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateQuiz = async (lessonId: string, moduleId: string, courseId: string) => {
    const res = await adminCreateQuizAction(lessonId);
    if (res.success) {
      toast.success("Đã tạo bài Quiz mới");
      // Reload quizzes for this lesson
      const quizRes = await adminGetQuizzesAction(lessonId);
      if (quizRes.success && quizRes.data) {
        setQuizzesMap((prev) => ({ ...prev, [lessonId]: quizRes.data }));
      }
    } else {
      toast.error(res.error || "Lỗi khi tạo quiz");
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteTarget || deleteTarget.type !== "quiz") return;
    const res = await adminDeleteQuizAction(deleteTarget.id);
    if (res.success) {
      toast.success("Đã xóa quiz");
      setQuizzesMap((prev) => {
        const updated = { ...prev };
        if (deleteTarget.lessonId) {
          updated[deleteTarget.lessonId] = updated[deleteTarget.lessonId]?.filter(
            (q) => q.id !== deleteTarget.id
          ) || [];
        }
        return updated;
      });
    } else {
      toast.error(res.error || "Lỗi khi xóa quiz");
    }
    setDeleteTarget(null);
  };

  const handleOpenQuestionForm = (quizId: string, question?: QuizQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        question: question.question,
        options: JSON.parse(question.options),
        correctOption: question.correctOption,
        explanation: question.explanation,
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({ question: "", options: ["", ""], correctOption: 0, explanation: "" });
    }
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async (quizId: string) => {
    if (!questionForm.question.trim()) {
      toast.error("Câu hỏi không được để trống");
      return;
    }
    if (questionForm.options.filter((o) => o.trim()).length < 2) {
      toast.error("Phải có ít nhất 2 đáp án");
      return;
    }
    if (!questionForm.explanation.trim()) {
      toast.error("Giải thích nghiệp vụ không được để trống");
      return;
    }

    const validOptions = questionForm.options.filter((o) => o.trim());

    const res = editingQuestion
      ? await adminUpdateQuizQuestionAction(editingQuestion.id, {
          question: questionForm.question,
          options: validOptions,
          correctOption: questionForm.correctOption,
          explanation: questionForm.explanation,
        })
      : await adminCreateQuizQuestionAction({
          quizId,
          question: questionForm.question,
          options: validOptions,
          correctOption: questionForm.correctOption,
          explanation: questionForm.explanation,
        });

    if (res.success) {
      toast.success(editingQuestion ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi mới");
      // Reload questions
      const questRes = await adminGetQuizQuestionsAction(quizId);
      if (questRes.success && questRes.data) {
        setQuestionsMap((prev) => ({ ...prev, [quizId]: questRes.data as QuizQuestion[] }));
      }
      setQuestionDialogOpen(false);
    } else {
      toast.error(res.error || "Lỗi khi lưu câu hỏi");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteTarget || deleteTarget.type !== "question") return;
    const quizId = deleteTarget.lessonId!;
    const res = await adminDeleteQuizQuestionAction(deleteTarget.id);
    if (res.success) {
      toast.success("Đã xóa câu hỏi");
      setQuestionsMap((prev) => ({
        ...prev,
        [quizId]: prev[quizId]?.filter((q) => q.id !== deleteTarget.id) || [],
      }));
    } else {
      toast.error(res.error || "Lỗi khi xóa câu hỏi");
    }
    setDeleteTarget(null);
  };

  const addOption = () => {
    setQuestionForm((prev) => ({ ...prev, options: [...prev.options, ""] }));
  };

  const removeOption = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctOption: prev.correctOption === index ? 0 : prev.correctOption > index ? prev.correctOption - 1 : prev.correctOption,
    }));
  };

  const updateOption = (index: number, value: string) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? value : o)),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Bộ câu hỏi Quiz</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tạo và quản lý câu hỏi trắc nghiệm cho từng bài học
        </p>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <BookOpen className="size-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Chưa có khóa học nào. Tạo khóa học trước.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden divide-y">
          {courses.map((course) => {
            const isCourseExpanded = expandedCourses.has(course.id);
            const modules = modulesMap[course.id] || [];
            return (
              <div key={course.id}>
                {/* Course Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => toggleCourse(course.id)}
                >
                  {isCourseExpanded ? (
                    <ChevronDown className="size-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="size-4 text-slate-400" />
                  )}
                  <BookOpen className="size-4 text-indigo-500" />
                  <span className="font-semibold text-slate-800">{course.title}</span>
                  <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    {course.level}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{modules.length} chương</span>
                </div>

                {/* Modules */}
                {isCourseExpanded &&
                  modules.map((mod) => {
                    const isModExpanded = expandedModules.has(mod.id);
                    const lessons = lessonsMap[mod.id] || [];
                    return (
                      <div key={mod.id}>
                        <div
                          className="flex items-center gap-3 pl-8 pr-4 py-2.5 cursor-pointer hover:bg-slate-50 transition"
                          onClick={() => toggleModule(mod.id)}
                        >
                          {isModExpanded ? (
                            <ChevronDown className="size-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="size-3.5 text-slate-400" />
                          )}
                          <span className="text-sm text-slate-600">{mod.title}</span>
                          <span className="ml-auto text-xs text-slate-400">{lessons.length} bài</span>
                        </div>

                        {/* Lessons */}
                        {isModExpanded &&
                          lessons.map((les) => {
                            const quizzes = quizzesMap[les.id] || [];
                            return (
                              <div key={les.id} className="pl-16 pr-4 py-2">
                                <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition">
                                  <HelpCircle className="size-4 text-slate-400" />
                                  <span className="flex-1 text-sm text-slate-700">{les.title}</span>

                                  {quizzes.length === 0 ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateQuiz(les.id, mod.id, course.id);
                                      }}
                                    >
                                      <Plus className="size-3 mr-1" />
                                      Tạo Quiz
                                    </Button>
                                  ) : (
                                    <>
                                      <span className="text-xs font-medium text-emerald-600">
                                        ✓ Quiz: {quizzes.length}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-slate-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLesson({ lesson: les, module: mod, course });
                                        }}
                                      >
                                        Quản lý câu hỏi
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteTarget({ type: "quiz", id: quizzes[0].id, label: "Quiz của " + les.title, lessonId: les.id });
                                        }}
                                      >
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}

      {/* Question Management Dialog */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Câu hỏi Quiz: {selectedLesson?.lesson.title}
            </DialogTitle>
            <DialogDescription>
              Quản lý câu hỏi trắc nghiệm cho bài học này. Mỗi câu hỏi cần ít nhất 2 đáp án và phải có giải thích nghiệp vụ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedLesson && (
              <>
                {(() => {
                  const quizId = quizzesMap[selectedLesson.lesson.id]?.[0]?.id;
                  const questions = quizId ? questionsMap[quizId] || [] : [];
                  return (
                    <>
                      {/* Questions List */}
                      <div className="space-y-2">
                        {questions.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
                            <HelpCircle className="size-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên.</p>
                          </div>
                        ) : (
                          questions.map((q, idx) => (
                            <div key={q.id} className="rounded-lg border bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-slate-800 mb-2">
                                    Câu {idx + 1}: {q.question}
                                  </div>
                                  <div className="space-y-1 mb-2">
                                    {JSON.parse(q.options).map((opt: string, i: number) => (
                                      <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className={`font-medium ${i === q.correctOption ? "text-emerald-600" : "text-slate-400"}`}>
                                          {String.fromCharCode(65 + i)}.
                                        </span>
                                        <span className={i === q.correctOption ? "text-emerald-700 font-medium" : "text-slate-600"}>
                                          {opt}
                                        </span>
                                        {i === q.correctOption && <CheckCircle2 className="size-3 text-emerald-500" />}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-white rounded px-2 py-1.5 border">
                                    <AlertCircle className="size-3 mt-0.5 shrink-0" />
                                    <span><strong>Giải thích:</strong> {q.explanation}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => handleOpenQuestionForm(quizId, q)}
                                  >
                                    Sửa
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setDeleteTarget({ type: "question", id: q.id, label: "câu hỏi này", lessonId: quizId })}
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Question Button */}
                      {quizId && (
                        <Button
                          variant="outline"
                          className="w-full border-dashed"
                          onClick={() => handleOpenQuestionForm(quizId)}
                        >
                          <Plus className="size-4 mr-2" />
                          Thêm câu hỏi mới
                        </Button>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Form Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Chỉnh sửa Câu hỏi" : "Thêm Câu hỏi mới"}
            </DialogTitle>
            <DialogDescription>
              Mỗi câu hỏi cần ít nhất 2 đáp án, chỉ định đáp án đúng và có giải thích nghiệp vụ bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Question Text */}
            <div className="space-y-1.5">
              <Label>Câu hỏi (bắt buộc)</Label>
              <Textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm((p) => ({ ...p, question: e.target.value }))}
                placeholder="Nhập nội dung câu hỏi..."
                rows={2}
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label>Đáp án (ít nhất 2)</Label>
              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionForm((p) => ({ ...p, correctOption: idx }))}
                    className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                      questionForm.correctOption === idx
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 hover:border-emerald-300"
                    }`}
                    title="Đánh dấu là đáp án đúng"
                  >
                    {questionForm.correctOption === idx && (
                      <CheckCircle2 className="size-3" />
                    )}
                  </button>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                    className="flex-1"
                  />
                  {questionForm.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="text-slate-400 hover:text-red-500 transition shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={addOption}
              >
                <Plus className="size-3 mr-1" />
                Thêm đáp án
              </Button>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <Label>Giải thích nghiệp vụ (bắt buộc)</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm((p) => ({ ...p, explanation: e.target.value }))}
                placeholder="Giải thích đáp án đúng để học viên hiểu rõ hơn..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuestionDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                const quizId = selectedLesson && quizzesMap[selectedLesson.lesson.id]?.[0]?.id;
                if (quizId) handleSaveQuestion(quizId);
              }}
            >
              {editingQuestion ? "Lưu thay đổi" : "Thêm câu hỏi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {deleteTarget?.label}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget?.type === "quiz") handleDeleteQuiz();
                else handleDeleteQuestion();
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
