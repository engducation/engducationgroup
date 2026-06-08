import { db } from "@/db";
import {
  adminAuditLog,
  packageOrder,
  systemSetting,
  subscriptionAuditLog,
  PACKAGE_DURATIONS,
  PACKAGE_LABELS,
} from "@/db/schema";
import {
  course,
  courseReview,
  lesson,
  lessonVideo,
  module,
  moduleVocabulary,
  quiz,
  quizQuestion,
  read,
  write,
} from "@/db/schema/learning-content";
import { user } from "@/db/schema/auth";
import { and, asc, count, desc, eq, gte, inArray, isNull, sql, sum } from "drizzle-orm";
import { nanoid } from "nanoid";

export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "PAUSED";
export type OrderStatus = "PENDING" | "SUCCESS" | "FAILED";
export type PackageType = "MONTHLY" | "6_MONTH" | "YEAR";

export interface AdminCourseInput {
  title: string;
  description?: string;
  detailedDescription?: string;
  learningObjectives?: string;
  targetAudience?: string;
  level: string;
  language?: string;
  thumbnailUrl?: string;
  certificateTemplateUrl?: string;
  policyNotes?: string;
  status?: PublicationStatus;
}

export interface AdminModuleInput {
  courseId: string;
  title: string;
  description?: string;
  status?: PublicationStatus;
  orderIndex?: number;
}

export interface AdminLessonInput {
  moduleId: string;
  title: string;
  description?: string;
  status?: PublicationStatus;
  orderIndex?: number;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasQuiz?: boolean;
  hasVideo?: boolean;
  hasVocabulary?: boolean;
  isRequired?: boolean;
}

export interface AdminModuleVocabularyInput {
  moduleId: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  orderIndex?: number;
  status?: PublicationStatus;
}

export interface AdminQuizQuestionInput {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

function normalizeStatus(status?: PublicationStatus) {
  if (!status) return undefined;
  return status === "PAUSED" ? "ARCHIVED" : status;
}

function denormalizeStatus(status?: string | null): PublicationStatus | null {
  if (!status) return null;
  return status === "ARCHIVED" ? "PAUSED" : (status as PublicationStatus);
}

function serializeCourseRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

function serializeModuleRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

function serializeLessonRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

function serializeVocabularyRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

function serializeWorkspaceCourse(rawCourse: any) {
  if (!rawCourse) return rawCourse;

  return {
    ...rawCourse,
    status: denormalizeStatus(rawCourse.status),
    modules: (rawCourse.modules ?? []).map((item: any) => ({
      ...item,
      status: denormalizeStatus(item.status),
      lessons: (item.lessons ?? []).map((lessonItem: any) => ({
        ...lessonItem,
        status: denormalizeStatus(lessonItem.status),
      })),
      vocabularies: (item.vocabularies ?? []).map((vocabularyItem: any) => ({
        ...vocabularyItem,
        status: denormalizeStatus(vocabularyItem.status),
      })),
    })),
  };
}

function normalizeCoursePayload(input: Partial<AdminCourseInput>) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.detailedDescription !== undefined
      ? { certificateTemplateUrl: input.detailedDescription }
      : {}),
    ...(input.learningObjectives !== undefined
      ? { learningObjectives: input.learningObjectives }
      : {}),
    ...(input.targetAudience !== undefined ? { targetAudience: input.targetAudience } : {}),
    ...(input.level !== undefined ? { level: input.level } : {}),
    ...(input.language !== undefined ? { description: input.language } : {}),
    ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl } : {}),
    ...(input.certificateTemplateUrl !== undefined
      ? { certificateTemplateUrl: input.certificateTemplateUrl }
      : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
  };
}

async function ensureCourseExists(courseId: string) {
  const existing = await db.query.course.findFirst({ where: eq(course.id, courseId) });
  if (!existing) throw new Error("Khóa học không tồn tại");
  return existing;
}

async function ensureModuleExists(moduleId: string) {
  const existing = await db.query.module.findFirst({ where: eq(module.id, moduleId) });
  if (!existing) throw new Error("Chương học không tồn tại");
  return existing;
}

async function ensureLessonExists(lessonId: string) {
  const existing = await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) });
  if (!existing) throw new Error("Bài học không tồn tại");
  return existing;
}

async function nextModuleOrderIndex(courseId: string) {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${module.orderIndex}), -1)` })
    .from(module)
    .where(eq(module.courseId, courseId));

  return (row?.max ?? -1) + 1;
}

async function nextLessonOrderIndex(moduleId: string) {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${lesson.orderIndex}), -1)` })
    .from(lesson)
    .where(eq(lesson.moduleId, moduleId));

  return (row?.max ?? -1) + 1;
}

async function nextModuleVocabularyOrderIndex(moduleId: string) {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${moduleVocabulary.orderIndex}), -1)` })
    .from(moduleVocabulary)
    .where(eq(moduleVocabulary.moduleId, moduleId));

  return (row?.max ?? -1) + 1;
}

async function grantSubscriptionForOrderSuccess(orderId: string, adminId: string) {
  const order = await db.query.packageOrder.findFirst({ where: eq(packageOrder.id, orderId) });
  if (!order) throw new Error("Đơn hàng không tồn tại");
  if (order.status !== "PENDING") throw new Error("Đơn hàng này đã được xử lý rồi");

  const packageDays = PACKAGE_DURATIONS[order.packageType as PackageType] ?? 30;

  await db.transaction(async (tx) => {
    // Update order status
    await tx
      .update(packageOrder)
      .set({
        status: "SUCCESS",
        adminId,
        updatedAt: new Date(),
      })
      .where(eq(packageOrder.id, orderId));

    // Calculate new subscription expiry
    const now = new Date();
    const newActivatedAt = now;
    const packageDurationMs = packageDays * 24 * 60 * 60 * 1000;

    // Get current user subscription
    const [currentUser] = await tx
      .select({ expiresAt: user.expiresAt })
      .from(user)
      .where(eq(user.id, order.userId));

    const currentExpiresAt = currentUser?.expiresAt ? new Date(currentUser.expiresAt) : null;
    const isCurrentlyActive = currentExpiresAt && currentExpiresAt > now;

    // If user has active subscription, extend from current expiry
    // If no active subscription, start from now
    const baseDate = isCurrentlyActive ? currentExpiresAt! : now;
    const newExpiresAt = new Date(baseDate.getTime() + packageDurationMs);

    // Update user subscription dates
    await tx
      .update(user)
      .set({
        activatedAt: newActivatedAt,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(user.id, order.userId));

    // Create audit log
    await tx.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId: order.id,
      userId: order.userId,
      packageType: order.packageType,
      amount: order.amount,
      oldStatus: "PENDING",
      newStatus: "SUCCESS",
      paymentMethod: order.paymentMethod,
      adminId,
      createdAt: new Date(),
    });
  });
}

export async function getAdminCourseDashboard() {
  const [courseStats] = await db
    .select({
      totalCourses: count(course.id),
      publishedCourses: sql<number>`sum(case when ${course.status} = 'PUBLISHED' then 1 else 0 end)`,
      draftCourses: sql<number>`sum(case when ${course.status} = 'DRAFT' then 1 else 0 end)`,
      pausedCourses: sql<number>`sum(case when ${course.status} = 'ARCHIVED' then 1 else 0 end)`,
    })
    .from(course);

  const [orderStats] = await db
    .select({
      totalRevenue: sum(packageOrder.amount),
      paidOrders: sql<number>`sum(case when ${packageOrder.status} = 'SUCCESS' then 1 else 0 end)`,
      pendingOrders: sql<number>`sum(case when ${packageOrder.status} = 'PENDING' then 1 else 0 end)`,
    })
    .from(packageOrder);

  // Package distribution: count SUCCESS orders per package type
  const packageDistribution = await db
    .select({
      packageType: packageOrder.packageType,
      count: count(packageOrder.id),
      revenue: sum(packageOrder.amount),
    })
    .from(packageOrder)
    .where(eq(packageOrder.status, "SUCCESS"))
    .groupBy(packageOrder.packageType);

  return {
    totals: {
      totalCourses: courseStats?.totalCourses ?? 0,
      publishedCourses: Number(courseStats?.publishedCourses ?? 0),
      draftCourses: Number(courseStats?.draftCourses ?? 0),
      pausedCourses: Number(courseStats?.pausedCourses ?? 0),
      totalRevenue: Number(orderStats?.totalRevenue ?? 0),
      paidOrders: Number(orderStats?.paidOrders ?? 0),
      pendingOrders: Number(orderStats?.pendingOrders ?? 0),
    },
    packageDistribution: packageDistribution.map((item) => ({
      packageType: item.packageType,
      label: PACKAGE_LABELS[item.packageType as PackageType] ?? item.packageType,
      count: item.count,
      revenue: Number(item.revenue ?? 0),
    })),
  };
}

export async function getAdminCourses() {
  const courses = await db.query.course.findMany({
    orderBy: [desc(course.createdAt)],
    with: {
      modules: {
        orderBy: [asc(module.orderIndex)],
        with: {
          lessons: {
            orderBy: [asc(lesson.orderIndex)],
          },
          vocabularies: {
            orderBy: [asc(moduleVocabulary.orderIndex)],
          },
        },
      },
    },
  });

  return courses.map((item) => serializeWorkspaceCourse(item));
}

export async function getAdminCourseContentWorkspace(courseId: string) {
  await ensureCourseExists(courseId);

  const rawCourse = await db.query.course.findFirst({
    where: eq(course.id, courseId),
    with: {
      modules: {
        orderBy: [asc(module.orderIndex)],
        with: {
          lessons: {
            orderBy: [asc(lesson.orderIndex)],
            with: {
              read: true,
              write: true,
              video: true,
              quiz: {
                with: {
                  questions: {
                    orderBy: [asc(quizQuestion.orderIndex)],
                  },
                },
              },
            },
          },
          vocabularies: {
            orderBy: [asc(moduleVocabulary.orderIndex)],
          },
        },
      },
    },
  });

  return serializeWorkspaceCourse(rawCourse);
}

export async function createAdminCourse(input: AdminCourseInput) {
  const id = nanoid();
  const persistedStatus = normalizeStatus(input.status) ?? "DRAFT";

  await db.insert(course).values({
    id,
    title: input.title,
    description: input.description ?? null,
    level: input.level,
    thumbnailUrl: input.thumbnailUrl ?? null,
    certificateTemplateUrl: input.certificateTemplateUrl ?? null,
    status: persistedStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, id) }));
}

export async function updateAdminCourse(courseId: string, input: Partial<AdminCourseInput>) {
  await ensureCourseExists(courseId);

  await db
    .update(course)
    .set({
      ...normalizeCoursePayload(input),
      updatedAt: new Date(),
    })
    .where(eq(course.id, courseId));

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function deleteAdminCourse(courseId: string) {
  const existing = await db.query.module.findFirst({ where: eq(module.courseId, courseId) });
  if (existing) {
    throw new Error("Không thể xóa khóa học đã có chương học hoặc bài học bên trong");
  }

  await db.delete(course).where(eq(course.id, courseId));
  return { id: courseId };
}

export async function createAdminModule(input: AdminModuleInput) {
  await ensureCourseExists(input.courseId);

  const id = nanoid();
  await db.insert(module).values({
    id,
    courseId: input.courseId,
    title: input.title,
    description: input.description ?? null,
    status: normalizeStatus(input.status) ?? "DRAFT",
    orderIndex: input.orderIndex ?? (await nextModuleOrderIndex(input.courseId)),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return serializeModuleRecord(await db.query.module.findFirst({ where: eq(module.id, id) }));
}

export async function updateAdminModule(
  moduleId: string,
  input: Partial<Omit<AdminModuleInput, "courseId">>,
) {
  await ensureModuleExists(moduleId);

  await db
    .update(module)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
      ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
      updatedAt: new Date(),
    })
    .where(eq(module.id, moduleId));

  return serializeModuleRecord(await db.query.module.findFirst({ where: eq(module.id, moduleId) }));
}

export async function deleteAdminModule(moduleId: string) {
  const existingLesson = await db.query.lesson.findFirst({ where: eq(lesson.moduleId, moduleId) });
  if (existingLesson) {
    throw new Error("Không thể xóa chương học đang chứa bài học");
  }

  await db.delete(moduleVocabulary).where(eq(moduleVocabulary.moduleId, moduleId));
  await db.delete(module).where(eq(module.id, moduleId));
  return { id: moduleId };
}

export async function createAdminLesson(input: AdminLessonInput) {
  await ensureModuleExists(input.moduleId);

  const id = nanoid();
  await db.insert(lesson).values({
    id,
    moduleId: input.moduleId,
    title: input.title,
    description: input.description ?? null,
    status: normalizeStatus(input.status) ?? "DRAFT",
    orderIndex: input.orderIndex ?? (await nextLessonOrderIndex(input.moduleId)),
    hasRead: input.hasRead ?? false,
    hasWrite: input.hasWrite ?? false,
    hasQuiz: input.hasQuiz ?? false,
    hasVideo: input.hasVideo ?? false,
    hasVocabulary: input.hasVocabulary ?? false,
    isRequired: input.isRequired ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return serializeLessonRecord(await db.query.lesson.findFirst({ where: eq(lesson.id, id) }));
}

export async function updateAdminLesson(
  lessonId: string,
  input: Partial<Omit<AdminLessonInput, "moduleId">>,
) {
  await ensureLessonExists(lessonId);

  await db
    .update(lesson)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.hasRead !== undefined ? { hasRead: input.hasRead } : {}),
      ...(input.hasWrite !== undefined ? { hasWrite: input.hasWrite } : {}),
      ...(input.hasQuiz !== undefined ? { hasQuiz: input.hasQuiz } : {}),
      ...(input.hasVideo !== undefined ? { hasVideo: input.hasVideo } : {}),
      ...(input.hasVocabulary !== undefined ? { hasVocabulary: input.hasVocabulary } : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
      ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
      ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
      updatedAt: new Date(),
    })
    .where(eq(lesson.id, lessonId));

  return serializeLessonRecord(await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) }));
}

export async function deleteAdminLesson(lessonId: string) {
  await db.delete(read).where(eq(read.lessonId, lessonId));
  await db.delete(write).where(eq(write.lessonId, lessonId));

  const lessonQuiz = await db.query.quiz.findFirst({ where: eq(quiz.lessonId, lessonId) });
  if (lessonQuiz) {
    await db.delete(quizQuestion).where(eq(quizQuestion.quizId, lessonQuiz.id));
    await db.delete(quiz).where(eq(quiz.id, lessonQuiz.id));
  }

  await db.delete(lessonVideo).where(eq(lessonVideo.lessonId, lessonId));
  await db.delete(lesson).where(eq(lesson.id, lessonId));
  return { id: lessonId };
}

export async function upsertAdminLessonRead(
  lessonId: string,
  input: { title: string; content: string; keywords?: string; learningObjectives?: string },
) {
  const existing = await db.query.read.findFirst({ where: eq(read.lessonId, lessonId) });

  if (existing) {
    await db
      .update(read)
      .set({
        title: input.title,
        content: input.content,
        keywords: input.keywords ?? null,
        learningObjectives: input.learningObjectives ?? null,
        updatedAt: new Date(),
      })
      .where(eq(read.id, existing.id));

    return db.query.read.findFirst({ where: eq(read.id, existing.id) });
  }

  const id = nanoid();
  await db.insert(read).values({
    id,
    lessonId,
    title: input.title,
    content: input.content,
    keywords: input.keywords ?? null,
    learningObjectives: input.learningObjectives ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.update(lesson).set({ hasRead: true, updatedAt: new Date() }).where(eq(lesson.id, lessonId));

  return db.query.read.findFirst({ where: eq(read.id, id) });
}

export async function upsertAdminLessonWrite(
  lessonId: string,
  input: {
    title?: string;
    prompt: string;
    gradingCriteria?: string;
    wordCountGuidance?: number;
    aiPromptId?: string;
    maxAiRevisions?: number;
    dueDate?: string | null;
    submissionMode?: "OPEN" | "CLOSED";
  },
) {
  const normalizedPrompt = input.title
    ? `${input.title}\n\n${input.prompt}`
    : input.prompt;
  const normalizedCriteria = [
    input.gradingCriteria?.trim(),
    input.dueDate ? `Due date: ${input.dueDate}` : null,
    input.submissionMode ? `Submission mode: ${input.submissionMode}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const existing = await db.query.write.findFirst({ where: eq(write.lessonId, lessonId) });

  if (existing) {
    await db
      .update(write)
      .set({
        prompt: normalizedPrompt,
        gradingCriteria: normalizedCriteria || null,
        wordCountGuidance: input.wordCountGuidance ?? null,
        aiPromptId: input.aiPromptId ?? null,
        maxAiRevisions: input.maxAiRevisions ?? 5,
        updatedAt: new Date(),
      })
      .where(eq(write.id, existing.id));

    return db.query.write.findFirst({ where: eq(write.id, existing.id) });
  }

  const id = nanoid();
  await db.insert(write).values({
    id,
    lessonId,
    prompt: normalizedPrompt,
    gradingCriteria: normalizedCriteria || null,
    wordCountGuidance: input.wordCountGuidance ?? null,
    aiPromptId: input.aiPromptId ?? null,
    maxAiRevisions: input.maxAiRevisions ?? 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.update(lesson).set({ hasWrite: true, updatedAt: new Date() }).where(eq(lesson.id, lessonId));

  return db.query.write.findFirst({ where: eq(write.id, id) });
}

export async function upsertAdminLessonVideo(
  lessonId: string,
  input: {
    title: string;
    description?: string;
    cloudinaryPublicId: string;
    cloudinaryUrl: string;
    durationSeconds?: number;
    resourceNotes?: string;
  },
) {
  const combinedDescription = [input.description?.trim(), input.resourceNotes?.trim()]
    .filter(Boolean)
    .join("\n\n");

  const existing = await db.query.lessonVideo.findFirst({ where: eq(lessonVideo.lessonId, lessonId) });

  if (existing) {
    await db
      .update(lessonVideo)
      .set({
        title: input.title,
        description: combinedDescription || null,
        cloudinaryPublicId: input.cloudinaryPublicId,
        cloudinaryUrl: input.cloudinaryUrl,
        durationSeconds: input.durationSeconds ?? null,
        updatedAt: new Date(),
      })
      .where(eq(lessonVideo.id, existing.id));

    return db.query.lessonVideo.findFirst({ where: eq(lessonVideo.id, existing.id) });
  }

  const id = nanoid();
  await db.insert(lessonVideo).values({
    id,
    lessonId,
    title: input.title,
    description: combinedDescription || null,
    cloudinaryPublicId: input.cloudinaryPublicId,
    cloudinaryUrl: input.cloudinaryUrl,
    durationSeconds: input.durationSeconds ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.update(lesson).set({ hasVideo: true, updatedAt: new Date() }).where(eq(lesson.id, lessonId));

  return db.query.lessonVideo.findFirst({ where: eq(lessonVideo.id, id) });
}

export async function upsertAdminLessonQuiz(
  lessonId: string,
  input: {
    title?: string;
    passingPercentage?: number | null;
    questions: AdminQuizQuestionInput[];
  },
) {
  const questions = input.questions;
  if (questions.length === 0) {
    throw new Error("Quiz phải có ít nhất 1 câu hỏi");
  }

  for (const [index, questionItem] of questions.entries()) {
    if (questionItem.options.length < 2) {
      throw new Error(`Câu hỏi ${index + 1} phải có ít nhất 2 đáp án`);
    }
    if (questionItem.correctOption < 0 || questionItem.correctOption >= questionItem.options.length) {
      throw new Error(`Câu hỏi ${index + 1} có đáp án đúng không hợp lệ`);
    }
    if (!questionItem.explanation.trim()) {
      throw new Error(`Câu hỏi ${index + 1} bắt buộc phải có giải thích`);
    }
  }

  const existing = await db.query.quiz.findFirst({ where: eq(quiz.lessonId, lessonId) });
  const quizId = existing?.id ?? nanoid();
  const normalizedTitle = input.title?.trim();
  const normalizedPassingPercentage = input.passingPercentage ?? null;

  await db.transaction(async (tx) => {
    if (existing) {
      await tx.delete(quizQuestion).where(eq(quizQuestion.quizId, existing.id));
      await tx
        .update(quiz)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(quiz.id, existing.id));
    } else {
      await tx.insert(quiz).values({
        id: quizId,
        lessonId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (normalizedTitle || normalizedPassingPercentage !== null) {
      await tx
        .update(lesson)
        .set({
          description: normalizedTitle
            ? `Quiz: ${normalizedTitle}${
                normalizedPassingPercentage !== null ? `\nPassing: ${normalizedPassingPercentage}%` : ""
              }`
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(lesson.id, lessonId));
    }

    await tx.insert(quizQuestion).values(
      questions.map((questionItem, index) => ({
        id: nanoid(),
        quizId,
        question: questionItem.question,
        options: JSON.stringify(questionItem.options),
        correctOption: questionItem.correctOption,
        explanation: questionItem.explanation,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  });

  await db.update(lesson).set({ hasQuiz: true, updatedAt: new Date() }).where(eq(lesson.id, lessonId));

  return db.query.quiz.findFirst({
    where: eq(quiz.id, quizId),
    with: {
      questions: {
        orderBy: [asc(quizQuestion.orderIndex)],
      },
    },
  });
}

export async function getAdminModuleVocabulary(moduleId: string) {
  const vocabularies = await db.query.moduleVocabulary.findMany({
    where: eq(moduleVocabulary.moduleId, moduleId),
    orderBy: [asc(moduleVocabulary.orderIndex)],
  });

  return vocabularies.map((item) => serializeVocabularyRecord(item));
}

export async function createAdminModuleVocabulary(input: AdminModuleVocabularyInput) {
  await ensureModuleExists(input.moduleId);

  const id = nanoid();
  await db.insert(moduleVocabulary).values({
    id,
    moduleId: input.moduleId,
    word: input.word,
    phonetic: input.phonetic ?? null,
    partOfSpeech: input.partOfSpeech,
    meaning: input.meaning,
    example: input.example ?? null,
    notes: input.notes ?? null,
    orderIndex: input.orderIndex ?? (await nextModuleVocabularyOrderIndex(input.moduleId)),
    status: normalizeStatus(input.status) ?? "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const relatedLessons = await db.query.lesson.findMany({ where: eq(lesson.moduleId, input.moduleId) });
  if (relatedLessons.length > 0) {
    await db
      .update(lesson)
      .set({ hasVocabulary: true, updatedAt: new Date() })
      .where(
        inArray(
          lesson.id,
          relatedLessons.map((item) => item.id),
        ),
      );
  }

  return serializeVocabularyRecord(
    await db.query.moduleVocabulary.findFirst({ where: eq(moduleVocabulary.id, id) }),
  );
}

export async function updateAdminModuleVocabulary(
  vocabularyId: string,
  input: Partial<Omit<AdminModuleVocabularyInput, "moduleId">>,
) {
  await db
    .update(moduleVocabulary)
    .set({
      ...(input.word !== undefined ? { word: input.word } : {}),
      ...(input.partOfSpeech !== undefined ? { partOfSpeech: input.partOfSpeech } : {}),
      ...(input.meaning !== undefined ? { meaning: input.meaning } : {}),
      ...(input.phonetic !== undefined ? { phonetic: input.phonetic } : {}),
      ...(input.example !== undefined ? { example: input.example } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
      ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(moduleVocabulary.id, vocabularyId));

  return serializeVocabularyRecord(
    await db.query.moduleVocabulary.findFirst({ where: eq(moduleVocabulary.id, vocabularyId) }),
  );
}

export async function deleteAdminModuleVocabulary(vocabularyId: string) {
  await db.delete(moduleVocabulary).where(eq(moduleVocabulary.id, vocabularyId));
  return { id: vocabularyId };
}

export async function publishAdminCourse(courseId: string) {
  const targetCourse = await ensureCourseExists(courseId);
  const modules = await db.query.module.findMany({ where: eq(module.courseId, targetCourse.id) });

  if (modules.length === 0) {
    throw new Error("Khóa học phải có ít nhất 1 chương học trước khi publish");
  }

  await db.transaction(async (tx) => {
    await tx.update(course).set({ status: "PUBLISHED", updatedAt: new Date() }).where(eq(course.id, courseId));
    await tx
      .update(module)
      .set({ status: "PUBLISHED", updatedAt: new Date() })
      .where(eq(module.courseId, courseId));

    const moduleIds = modules.map((item) => item.id);
    const lessons = await tx.query.lesson.findMany({ where: inArray(lesson.moduleId, moduleIds) });

    if (lessons.length > 0) {
      await tx
        .update(lesson)
        .set({ status: "PUBLISHED", updatedAt: new Date() })
        .where(inArray(lesson.moduleId, moduleIds));
    }

    await tx
      .update(moduleVocabulary)
      .set({ status: "PUBLISHED", updatedAt: new Date() })
      .where(inArray(moduleVocabulary.moduleId, moduleIds));
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function unpublishAdminCourse(courseId: string) {
  const modules = await db.query.module.findMany({ where: eq(module.courseId, courseId) });
  const moduleIds = modules.map((item) => item.id);

  await db.transaction(async (tx) => {
    await tx.update(course).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(course.id, courseId));
    await tx.update(module).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(module.courseId, courseId));

    if (moduleIds.length > 0) {
      await tx
        .update(lesson)
        .set({ status: "DRAFT", updatedAt: new Date() })
        .where(inArray(lesson.moduleId, moduleIds));
      await tx
        .update(moduleVocabulary)
        .set({ status: "DRAFT", updatedAt: new Date() })
        .where(inArray(moduleVocabulary.moduleId, moduleIds));
    }
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function archiveAdminCourse(courseId: string) {
  const modules = await db.query.module.findMany({ where: eq(module.courseId, courseId) });
  const moduleIds = modules.map((item) => item.id);

  await db.transaction(async (tx) => {
    await tx.update(course).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(course.id, courseId));
    await tx
      .update(module)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(module.courseId, courseId));

    if (moduleIds.length > 0) {
      await tx
        .update(lesson)
        .set({ status: "ARCHIVED", updatedAt: new Date() })
        .where(inArray(lesson.moduleId, moduleIds));
      await tx
        .update(moduleVocabulary)
        .set({ status: "ARCHIVED", updatedAt: new Date() })
        .where(inArray(moduleVocabulary.moduleId, moduleIds));
    }
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function getAdminOrders() {
  return db.query.packageOrder.findMany({
    orderBy: [desc(packageOrder.createdAt)],
    with: {
      user: true,
      admin: true,
    },
  });
}

export async function createAdminManualOrder(
  userId: string,
  packageType: PackageType,
  amount: number,
  adminId: string,
) {
  const orderId = `PKG_${nanoid(10).toUpperCase()}`;

  await db.transaction(async (tx) => {
    await tx.insert(packageOrder).values({
      id: orderId,
      userId,
      packageType,
      amount,
      status: "PENDING",
      paymentMethod: "MANUAL_BANK_TRANSFER",
      adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId,
      userId,
      packageType,
      amount,
      oldStatus: "NONE",
      newStatus: "PENDING",
      paymentMethod: "MANUAL_BANK_TRANSFER",
      adminId,
      createdAt: new Date(),
    });
  });

  return { orderId };
}

export async function approveAdminOrder(orderId: string, adminId: string) {
  await grantSubscriptionForOrderSuccess(orderId, adminId);
  return { orderId };
}

export async function rejectAdminOrder(orderId: string, reason: string, adminId: string) {
  const order = await db.query.packageOrder.findFirst({ where: eq(packageOrder.id, orderId) });
  if (!order) throw new Error("Đơn hàng không tồn tại");
  if (order.status !== "PENDING") throw new Error("Đơn hàng này đã được xử lý rồi");

  await db.transaction(async (tx) => {
    await tx
      .update(packageOrder)
      .set({
        status: "FAILED",
        adminId,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(packageOrder.id, orderId));

    await tx.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId: order.id,
      userId: order.userId,
      packageType: order.packageType,
      amount: order.amount,
      oldStatus: "PENDING",
      newStatus: "FAILED",
      paymentMethod: order.paymentMethod,
      adminId,
      createdAt: new Date(),
    });
  });

  return { orderId };
}

export async function getAdminOrderAnalytics() {
  const [stats] = await db
    .select({
      totalRevenue: sum(packageOrder.amount),
      successOrders: sql<number>`sum(case when ${packageOrder.status} = 'SUCCESS' then 1 else 0 end)`,
      pendingOrders: sql<number>`sum(case when ${packageOrder.status} = 'PENDING' then 1 else 0 end)`,
      failedOrders: sql<number>`sum(case when ${packageOrder.status} = 'FAILED' then 1 else 0 end)`,
    })
    .from(packageOrder);

  // Package distribution for analytics
  const packageDistribution = await db
    .select({
      packageType: packageOrder.packageType,
      count: count(packageOrder.id),
    })
    .from(packageOrder)
    .where(eq(packageOrder.status, "SUCCESS"))
    .groupBy(packageOrder.packageType);

  return {
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    successOrders: Number(stats?.successOrders ?? 0),
    pendingOrders: Number(stats?.pendingOrders ?? 0),
    failedOrders: Number(stats?.failedOrders ?? 0),
    packageDistribution: packageDistribution.map((item) => ({
      packageType: item.packageType,
      label: PACKAGE_LABELS[item.packageType as PackageType] ?? item.packageType,
      count: item.count,
    })),
  };
}

export async function getAdminTransactionLogs() {
  return db.query.subscriptionAuditLog.findMany({
    orderBy: [desc(subscriptionAuditLog.createdAt)],
    with: {
      user: true,
    },
  });
}

export async function getAdminReviews() {
  return db.query.courseReview.findMany({
    orderBy: [desc(courseReview.createdAt)],
    with: {
      user: true,
      course: true,
    },
  });
}

export async function replyAdminCourseReview(reviewId: string, reply: string) {
  await db
    .update(courseReview)
    .set({
      adminReply: reply,
      adminReplyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(courseReview.id, reviewId));

  return db.query.courseReview.findFirst({ where: eq(courseReview.id, reviewId) });
}

export async function updateAdminCourseReviewStatus(reviewId: string, status: "VISIBLE" | "HIDDEN") {
  await db
    .update(courseReview)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(courseReview.id, reviewId));

  return db.query.courseReview.findFirst({ where: eq(courseReview.id, reviewId) });
}

export async function getAdminSystemSettings() {
  return db.query.systemSetting.findMany({
    orderBy: [asc(systemSetting.key)],
  });
}

export async function updateAdminSystemSetting(key: string, value: string, _adminId: string) {
  const existing = await db.query.systemSetting.findFirst({ where: eq(systemSetting.key, key) });

  if (existing) {
    await db
      .update(systemSetting)
      .set({
        value,
        updatedAt: new Date(),
      })
      .where(eq(systemSetting.key, key));
  } else {
    await db.insert(systemSetting).values({
      key,
      value,
      updatedAt: new Date(),
    });
  }

  return db.query.systemSetting.findFirst({ where: eq(systemSetting.key, key) });
}

export async function getAdminUsersModeration() {
  return db.query.user.findMany({
    orderBy: [desc(user.createdAt)],
  });
}

export async function getAdminAuditLogs() {
  return db.query.adminAuditLog.findMany({
    orderBy: [desc(adminAuditLog.createdAt)],
  });
}
