/**
 * Writing Service - Submit & fetch writing submissions with AI analysis.
 *
 * Data flow:
 *   1. Validate that the writeId exists.
 *   2. Call the AI service to analyse the student's content (Groq / LLaMA-3).
 *   3. Persist the raw student content + the AI analysis as JSON + score.
 *   4. Return the parsed analysis for the UI to render inline highlights.
 *
 * The full AI feedback is stored as a JSON string in `writing_submission.ai_feedback`
 * so the UI can re-hydrate the structured {errors, suggestions, ...} object on reload.
 */

import { db } from "@/db";
import { writingSubmission, write, studentProgress } from "@/db/schema/learning-content";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { analyzeWritingContent } from "./ai.service";
import type { WritingAnalysis } from "@/features/learning-content/types";

export interface SubmitWritingInput {
  userId: string;
  writeId: string;
  content: string;
}

export interface SubmitWritingResult {
  submissionId: string;
  analysis: WritingAnalysis;
  status: "SUBMITTED" | "AI_GRADED";
}

export interface PersistedWritingFeedback {
  hasError: boolean;
  score: number;
  correctedText: string;
  errors: WritingAnalysis["errors"];
  suggestions: WritingAnalysis["suggestions"];
}

/**
 * Submit a writing answer. The AI is invoked first, then the result is
 * persisted so the student can re-open the page and still see the same feedback.
 */
export async function submitWriting(
  input: SubmitWritingInput,
): Promise<{ result: SubmitWritingResult | null; error: string | null }> {
  const { userId, writeId, content } = input;

  // Verify the writeId exists so we don't accept orphan submissions.
  const writeRecord = await db.query.write.findFirst({ where: eq(write.id, writeId) });
  if (!writeRecord) return { result: null, error: "Bài viết không tồn tại." };

  // Invoke the AI. Caching inside ai.service keeps duplicate submissions free.
  const analysis = await analyzeWritingContent(content);

  const submissionId = nanoid();
  const now = new Date();

  await db.insert(writingSubmission).values({
    id: submissionId,
    userId,
    writeId,
    content,
    aiFeedback: JSON.stringify(analysis),
    aiScore: analysis.score,
    status: "AI_GRADED",
    createdAt: now,
    updatedAt: now,
  });

  // Best-effort progress update; ignore if no lesson is attached to the write.
  if (writeRecord.lessonId) {
    try {
      await upsertWriteProgress(userId, writeRecord.lessonId);
    } catch (err) {
      console.warn("[Writing Service] Failed to mark write progress:", err);
    }
  }

  return {
    result: { submissionId, analysis, status: "AI_GRADED" },
    error: null,
  };
}

/**
 * Fetch the most recent submission for a (user, write) pair so the UI can
 * restore the feedback view after navigation.
 */
export async function getLatestSubmission(userId: string, writeId: string) {
  const submission = await db.query.writingSubmission.findFirst({
    where: and(
      eq(writingSubmission.userId, userId),
      eq(writingSubmission.writeId, writeId),
    ),
    orderBy: [desc(writingSubmission.createdAt)],
  });
  if (!submission) return null;

  return {
    submission,
    analysis: parseFeedback(submission.aiFeedback),
  };
}

/**
 * Safely parse the JSON-stored AI feedback. Returns null when storage is
 * empty, malformed, or shaped incorrectly.
 */
export function parseFeedback(raw: string | null): WritingAnalysis | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WritingAnalysis;
    if (
      typeof parsed?.hasError === "boolean" &&
      typeof parsed?.score === "number" &&
      typeof parsed?.correctedText === "string" &&
      Array.isArray(parsed?.errors) &&
      Array.isArray(parsed?.suggestions)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function upsertWriteProgress(userId: string, lessonId: string): Promise<void> {
  const [existing] = await db
    .select({ id: studentProgress.id })
    .from(studentProgress)
    .where(and(eq(studentProgress.userId, userId), eq(studentProgress.lessonId, lessonId)));

  const now = new Date();
  if (existing) {
    await db
      .update(studentProgress)
      .set({ writeCompleted: true, updatedAt: now })
      .where(eq(studentProgress.id, existing.id));
  } else {
    await db.insert(studentProgress).values({
      id: nanoid(),
      userId,
      lessonId,
      writeCompleted: true,
    });
  }
}

/**
 * Look up the writeId attached to a lesson. Returns null when the lesson has
 * no writing exercise configured.
 */
export async function getWriteIdForLesson(lessonId: string): Promise<string | null> {
  const writeRecord = await db.query.write.findFirst({
    where: eq(write.lessonId, lessonId),
    columns: { id: true },
  });
  return writeRecord?.id ?? null;
}

export interface SaveWritingDraftResult {
  submissionId: string;
  status: "DRAFT";
  isNew: boolean;
}

/**
 * Persist (or update) a DRAFT submission for the current user. Drafts do not
 * trigger AI analysis — that only runs on `submitWriting`. We upsert on the
 * (user, write) pair keeping the most recent draft, so a refresh always
 * restores the latest text the student typed.
 */
export async function saveWritingDraft(input: {
  userId: string;
  writeId: string;
  content: string;
}): Promise<{ result: SaveWritingDraftResult | null; error: string | null }> {
  const { userId, writeId, content } = input;

  // Verify the writeId exists.
  const writeRecord = await db.query.write.findFirst({ where: eq(write.id, writeId) });
  if (!writeRecord) return { result: null, error: "Bài viết không tồn tại." };

  const existing = await db.query.writingSubmission.findFirst({
    where: and(
      eq(writingSubmission.userId, userId),
      eq(writingSubmission.writeId, writeId),
    ),
    orderBy: [desc(writingSubmission.createdAt)],
  });

  const now = new Date();

  if (existing && existing.status === "DRAFT") {
    await db
      .update(writingSubmission)
      .set({ content, updatedAt: now })
      .where(eq(writingSubmission.id, existing.id));
    return { result: { submissionId: existing.id, status: "DRAFT", isNew: false }, error: null };
  }

  // If the latest record is already graded/submitted, do NOT overwrite it.
  // The student must click "Viết lại" to start a new attempt.
  if (existing && existing.status !== "DRAFT") {
    return { result: null, error: "Bài viết đã được nộp. Vui lòng bấm 'Viết lại' để bắt đầu bản mới." };
  }

  const submissionId = nanoid();
  await db.insert(writingSubmission).values({
    id: submissionId,
    userId,
    writeId,
    content,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  });

  return { result: { submissionId, status: "DRAFT", isNew: true }, error: null };
}
