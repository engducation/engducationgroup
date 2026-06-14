/**
 * Server Actions - Writing Submissions (Student)
 *
 * Authenticate Server Actions như API Routes (Vercel React Best Practices §3.1).
 * Tách riêng khỏi `actions.ts` để giữ mỗi file dưới ngưỡng 250 dòng
 * (quy tắc trong structure_code.md §2.1).
 */

"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import * as writingService from "./services/writing.service";
import {
  submitWritingSchema,
  getWritingSubmissionSchema,
  loadWritingForLessonSchema,
  saveWritingDraftSchema,
} from "./types/schemas";
import type {
  ActionResult,
  WritingAnalysis,
} from "./types";

// ─── Auth Guard (local copy) ─────────────────────────────────────────────────

async function requireAuth(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Vui lòng đăng nhập để tiếp tục.");
  return session.user.id;
}

function zodIssues(err: { issues: Array<{ message: string }> }): string[] {
  return err.issues.map((e) => e.message);
}

// ─── Writing Actions (Student) ───────────────────────────────────────────────

export async function submitWritingAction(
  input: unknown,
): Promise<ActionResult<{ submissionId: string; analysis: WritingAnalysis }>> {
  const userId = await requireAuth();
  const parsed = submitWritingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }

  const { result, error } = await writingService.submitWriting({
    userId,
    writeId: parsed.data.writeId,
    content: parsed.data.content,
  });

  if (error || !result) {
    return { success: false, error: error ?? "Không thể nộp bài viết." };
  }

  revalidatePath("/ai-assistant");
  return { success: true, data: { submissionId: result.submissionId, analysis: result.analysis } };
}

export async function getLatestWritingSubmissionAction(
  input: unknown,
): Promise<
  ActionResult<{
    submissionId: string;
    content: string;
    score: number | null;
    status: string;
    createdAt: Date;
    analysis: WritingAnalysis | null;
  }>
> {
  const userId = await requireAuth();
  const parsed = getWritingSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }

  const submission = await writingService.getLatestSubmission(userId, parsed.data.writeId);
  if (!submission) {
    return { success: false, error: "Chưa có bài nộp nào cho bài viết này." };
  }

  return {
    success: true,
    data: {
      submissionId: submission.submission.id,
      content: submission.submission.content,
      score: submission.submission.aiScore,
      status: submission.submission.status,
      createdAt: submission.submission.createdAt,
      analysis: submission.analysis,
    },
  };
}

/**
 * One-shot loader used by the in-lesson WritingLesson UI: takes a lessonId,
 * resolves the attached writeId, and returns the latest submission (DRAFT or
 * graded) so the client can restore both text and AI feedback in a single
 * round-trip.
 */
export async function loadWritingForLessonAction(
  input: unknown,
): Promise<
  ActionResult<{
    writeId: string | null;
    submission: {
      submissionId: string;
      content: string;
      score: number | null;
      status: string;
      createdAt: Date;
      analysis: WritingAnalysis | null;
    } | null;
  }>
> {
  const userId = await requireAuth();
  const parsed = loadWritingForLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }

  const writeId = await writingService.getWriteIdForLesson(parsed.data.lessonId);
  if (!writeId) {
    return { success: true, data: { writeId: null, submission: null } };
  }

  const latest = await writingService.getLatestSubmission(userId, writeId);
  if (!latest) {
    return { success: true, data: { writeId, submission: null } };
  }

  return {
    success: true,
    data: {
      writeId,
      submission: {
        submissionId: latest.submission.id,
        content: latest.submission.content,
        score: latest.submission.aiScore,
        status: latest.submission.status,
        createdAt: latest.submission.createdAt,
        analysis: latest.analysis,
      },
    },
  };
}

/**
 * Persist a DRAFT submission. Does NOT call the AI and does NOT mark the
 * lesson complete — those happen only on `submitWritingAction`.
 */
export async function saveWritingDraftAction(
  input: unknown,
): Promise<
  ActionResult<{ submissionId: string; status: "DRAFT"; isNew: boolean }>
> {
  const userId = await requireAuth();
  const parsed = saveWritingDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }

  const { result, error } = await writingService.saveWritingDraft({
    userId,
    writeId: parsed.data.writeId,
    content: parsed.data.content,
  });

  if (error || !result) {
    return { success: false, error: error ?? "Không thể lưu bản nháp." };
  }

  return { success: true, data: result };
}
