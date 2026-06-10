import { db } from "@/db";
import { userAiUsage, write, writingSubmission, aiApiLog, user, systemSetting } from "@/db/schema";
import { and, eq, gte, sql, count, sum, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { course, module, lesson } from "@/db/schema/learning-content";

function getTodayStringGmt7(): string {
  const date = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function checkAiQuota(
  userId: string,
  writeId: string,
): Promise<QuotaCheckResult> {
  const student = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  if (student?.status === "BANNED") {
    return { allowed: false, reason: "Tài khoản của bạn đã bị khóa do vi phạm chính sách hệ thống." };
  }

  const globalSetting = await db.query.systemSetting.findFirst({
    where: eq(systemSetting.key, "global_daily_limit"),
  });
  const globalDailyLimit = globalSetting ? parseInt(globalSetting.value, 10) : 20;

  const today = getTodayStringGmt7();
  const usageRecord = await db.query.userAiUsage.findFirst({
    where: and(eq(userAiUsage.userId, userId), eq(userAiUsage.usageDate, today)),
  });
  const currentDailyCount = usageRecord ? usageRecord.count : 0;

  if (currentDailyCount >= globalDailyLimit) {
    return {
      allowed: false,
      reason: "Bạn đã hết lượt chấm bài bằng AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai.",
    };
  }

  const exercise = await db.query.write.findFirst({
    where: eq(write.id, writeId),
  });
  if (!exercise) {
    return { allowed: false, reason: "Bài tập không tồn tại." };
  }

  const submission = await db.query.writingSubmission.findFirst({
    where: and(eq(writingSubmission.userId, userId), eq(writingSubmission.writeId, writeId)),
  });

  const revisionsUsed = submission ? submission.aiRevisionsUsed : 0;
  if (revisionsUsed >= exercise.maxAiRevisions) {
    return {
      allowed: false,
      reason: "Bạn đã vượt quá số lần AI hỗ trợ chấm bài cho bài tập này.",
    };
  }

  return { allowed: true };
}

export async function incrementAiUsage(userId: string, writeId: string) {
  const today = getTodayStringGmt7();

  await db.transaction(async (tx) => {
    const existingUsage = await tx.query.userAiUsage.findFirst({
      where: and(eq(userAiUsage.userId, userId), eq(userAiUsage.usageDate, today)),
    });

    if (existingUsage) {
      await tx
        .update(userAiUsage)
        .set({ count: existingUsage.count + 1, updatedAt: new Date() })
        .where(eq(userAiUsage.id, existingUsage.id));
    } else {
      await tx.insert(userAiUsage).values({
        id: nanoid(),
        userId,
        usageDate: today,
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const submission = await tx.query.writingSubmission.findFirst({
      where: and(eq(writingSubmission.userId, userId), eq(writingSubmission.writeId, writeId)),
    });

    if (submission) {
      await tx
        .update(writingSubmission)
        .set({
          aiRevisionsUsed: submission.aiRevisionsUsed + 1,
          updatedAt: new Date(),
        })
        .where(eq(writingSubmission.id, submission.id));
    }
  });
}

export async function logAiApiCall(data: {
  userId: string;
  writeId?: string;
  promptId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  isError: boolean;
  errorMessage?: string;
}) {
  await db.insert(aiApiLog).values({
    id: nanoid(),
    ...data,
    createdAt: new Date(),
  });
}

export interface CourseCost {
  courseId: string;
  courseTitle: string;
  totalTokens: number;
  totalCostUsd: number;
  callsCount: number;
}

export interface ExerciseCost {
  writeId: string;
  promptText: string;
  totalTokens: number;
  totalCostUsd: number;
  callsCount: number;
}

export interface AiCostAnalytics {
  errorRatePercent: number;
  totalCalls10m: number;
  errorCalls10m: number;
  courseCosts: CourseCost[];
  exerciseCosts: ExerciseCost[];
}

export async function getAiCostAnalytics(): Promise<AiCostAnalytics> {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const last10MinCalls = await db
    .select({
      total: count(),
      errors: sql<number>`sum(case when ${aiApiLog.isError} = true then 1 else 0 end)`,
    })
    .from(aiApiLog)
    .where(gte(aiApiLog.createdAt, tenMinutesAgo));

  const totalCalls = last10MinCalls[0]?.total ?? 0;
  const errorCalls = Number(last10MinCalls[0]?.errors ?? 0);
  const errorRatePercent = totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0;

  const courseCosts = await db
    .select({
      courseId: course.id,
      courseTitle: course.title,
      totalTokens: sum(aiApiLog.totalTokens),
      totalCostUsd: sum(aiApiLog.costUsd),
      callsCount: count(aiApiLog.id),
    })
    .from(aiApiLog)
    .innerJoin(write, eq(aiApiLog.writeId, write.id))
    .innerJoin(lesson, eq(write.lessonId, lesson.id))
    .innerJoin(module, eq(lesson.moduleId, module.id))
    .innerJoin(course, eq(module.courseId, course.id))
    .groupBy(course.id, course.title);

  const exerciseCosts = await db
    .select({
      writeId: write.id,
      promptText: write.prompt,
      totalTokens: sum(aiApiLog.totalTokens),
      totalCostUsd: sum(aiApiLog.costUsd),
      callsCount: count(aiApiLog.id),
    })
    .from(aiApiLog)
    .innerJoin(write, eq(aiApiLog.writeId, write.id))
    .groupBy(write.id)
    .orderBy(desc(sql`sum(${aiApiLog.costUsd})`))
    .limit(10);

  return {
    errorRatePercent,
    totalCalls10m: totalCalls,
    errorCalls10m: errorCalls,
    courseCosts: courseCosts.map((c) => ({
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      totalTokens: Number(c.totalTokens ?? 0),
      totalCostUsd: Number(c.totalCostUsd ?? 0),
      callsCount: c.callsCount,
    })),
    exerciseCosts: exerciseCosts.map((e) => ({
      writeId: e.writeId,
      promptText: e.promptText.substring(0, 80) + (e.promptText.length > 80 ? "..." : ""),
      totalTokens: Number(e.totalTokens ?? 0),
      totalCostUsd: Number(e.totalCostUsd ?? 0),
      callsCount: e.callsCount,
    })),
  };
}
