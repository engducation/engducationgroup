/**
 * Lesson Service - Truy vấn và xóa Lesson
 *
 * PRD Section 9.3: Xóa Lesson xóa luôn các phần nội dung liên quan.
 * PRD Section 10.1: User chỉ thấy nội dung Published.
 */

import { db } from "@/db";
import {
  lesson,
  read,
  write,
  quiz,
  lessonVideo,
  studentProgress,
} from "@/db/schema/learning-content";
import { eq } from "drizzle-orm";
import type { LessonWithContent } from "@/features/learning-content/types";

export async function getLessonWithFullContent(lessonId: string): Promise<LessonWithContent | null> {
  const result = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
    with: {
      read: true,
      write: true,
      quiz: {
        with: {
          questions: {
            orderBy: (q, { asc }) => [asc(q.orderIndex)],
          },
        },
      },
      video: true,
      lessonVocabularies: {
        with: {
          vocabulary: true,
        },
      },
    },
  });

  return result as LessonWithContent | null;
}

export async function getLessonForStudent(lessonId: string): Promise<LessonWithContent | null> {
  const result = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
    with: {
      read: true,
      write: true,
      quiz: {
        with: {
          questions: {
            orderBy: (q, { asc }) => [asc(q.orderIndex)],
          },
        },
      },
      video: true,
      lessonVocabularies: {
        with: {
          vocabulary: true,
        },
      },
    },
  });

  return result as LessonWithContent | null;
}

/**
 * Delete all content parts attached to a lesson.
 * Called before deleting the lesson itself.
 */
export async function deleteLessonContent(lessonId: string): Promise<void> {
  await db.delete(read).where(eq(read.lessonId, lessonId));
  await db.delete(write).where(eq(write.lessonId, lessonId));

  const quizRecord = await db.query.quiz.findFirst({ where: eq(quiz.lessonId, lessonId) });
  if (quizRecord) {
    await db.delete(quiz).where(eq(quiz.id, quizRecord.id));
  }

  await db.delete(lessonVideo).where(eq(lessonVideo.lessonId, lessonId));

  // Note: lesson_vocabulary junction is cascade-deleted via FK.
  // student_progress is cascade-deleted via FK.
}
