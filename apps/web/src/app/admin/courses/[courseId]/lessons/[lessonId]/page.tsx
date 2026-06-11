import LessonConfigClient from "./lesson-config-client";

interface PageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default async function LessonConfigPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;

  return <LessonConfigClient courseId={courseId} lessonId={lessonId} />;
}
