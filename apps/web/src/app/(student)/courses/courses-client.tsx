"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Loader2, Sparkles } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { Input } from "@/components/ui/input";

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  thumbnailUrl: string | null;
  totalModules: number;
  totalLessons: number;
}

interface CoursesClientProps {
  initialCourses: Course[];
  enrolledCourseIds: string[];
  isPremium: boolean;
}

export function CoursesClient({
  initialCourses,
  enrolledCourseIds,
  isPremium,
}: CoursesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [enrolledIds, setEnrolledIds] = useState<string[]>(enrolledCourseIds);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeCourseName, setUpgradeCourseName] = useState<string | undefined>();

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.level.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const handleEnroll = async (courseId: string) => {
    // If not premium, show upgrade dialog
    if (!isPremium) {
      const course = courses.find((c) => c.id === courseId);
      setUpgradeCourseName(course?.title);
      setShowUpgradeDialog(true);
      return;
    }

    // If already enrolled, go to learning page
    if (enrolledIds.includes(courseId)) {
      router.push(`/learn/${courseId}`);
      return;
    }

    // Proceed with enrollment
    setIsEnrolling(courseId);
    try {
      const response = await fetch("/api/student/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (data.success) {
        // Add to enrolled list
        setEnrolledIds((prev) => [...prev, courseId]);
        // Redirect to learning page
        router.push(`/learn/${courseId}`);
      } else if (data.error === "PREMIUM_REQUIRED") {
        // Show upgrade dialog
        const course = courses.find((c) => c.id === courseId);
        setUpgradeCourseName(course?.title);
        setShowUpgradeDialog(true);
      } else {
        alert(data.message || data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsEnrolling(null);
    }
  };

  const handleContinue = (courseId: string) => {
    router.push(`/learn/${courseId}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100">
            <BookOpen className="size-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Danh sách khóa học</h1>
            <p className="text-sm text-slate-500">
              Khám phá và đăng ký các khóa học để bắt đầu hành trình học tập
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isPremium ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Sparkles className="size-3.5 text-emerald-500" />
              Thành viên Premium
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Tài khoản Free - Cần nâng cấp Premium
            </span>
          )}
          <span className="text-sm text-slate-500">
            {filteredCourses.length} khóa học
          </span>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-5 shadow-inner">
            <BookOpen className="size-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1.5">
            {searchQuery ? "Không tìm thấy khóa học" : "Chưa có khóa học nào"}
          </h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            {searchQuery
              ? `Không có khóa học nào phù hợp với "${searchQuery}"`
              : "Hiện tại chưa có khóa học nào trên hệ thống. Hãy quay lại sau nhé."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="relative">
              {/* Loading overlay */}
              {isEnrolling === course.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
                  <Loader2 className="size-8 text-indigo-600 animate-spin" />
                </div>
              )}
              <CourseCard
                {...course}
                isEnrolled={enrolledIds.includes(course.id)}
                isPremium={isPremium}
                onEnroll={handleEnroll}
                onContinue={handleContinue}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upgrade Dialog */}
      <UpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        courseName={upgradeCourseName}
      />
    </div>
  );
}
