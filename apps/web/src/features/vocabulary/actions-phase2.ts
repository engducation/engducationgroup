/**
 * Vocabulary Server Actions - Phase 2
 * (SRS, Collections, Tags, Note, Mastered, Bulk, Share)
 *
 * Kept in a separate file to respect the 250-line cap of actions.ts.
 * Re-exported from the main actions barrel.
 */

"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/features/learning-content/types";
import {
  createCollectionSchema,
  updateCollectionSchema,
  reviewInputSchema,
  tagsInputSchema,
  noteInputSchema,
  collectionMembershipSchema,
  bulkMembershipSchema,
  bulkRemoveSchema,
  togglePublicSchema,
  cloneSharedSchema,
  masteredInputSchema,
} from "./types/schemas";
import * as vocabService from "./services/vocabulary.service";

// ─── Auth Guard ───────────────────────────────────────────────────────────

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

async function requireAuth(): Promise<string> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user.id;
}

function zodIssues(err: { issues: Array<{ message: string }> }): string[] {
  return err.issues.map((e) => e.message);
}

function revalidateNotebookPaths() {
  revalidatePath("/notebook");
  revalidatePath("/notebook/review");
  revalidatePath("/notebook/quiz");
  revalidatePath("/notebook/spelling");
}

// ─── Notebook bulk & search helpers ───────────────────────────────────────

export async function getNotebookAction() {
  const userId = await requireAuth();
  return vocabService.getUserNotebook(userId);
}

export async function getDueReviewCountAction(): Promise<number> {
  const userId = await requireAuth();
  return vocabService.getDueReviewCount(userId);
}

// ─── SRS ──────────────────────────────────────────────────────────────────

export async function getDueReviewQueueAction(limit = 20) {
  const userId = await requireAuth();
  return vocabService.getDueReviews(userId, limit);
}

export async function submitReviewAction(
  vocabularyId: string,
  grade: 0 | 1 | 2 | 3,
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = reviewInputSchema.safeParse({ vocabularyId, grade });
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = vocabService.submitReview(userId, parsed.data.vocabularyId, parsed.data.grade);
  revalidateNotebookPaths();
  return { success: true, data: result };
}

// ─── Tags / Note / Mastered ──────────────────────────────────────────────

export async function updateTagsAction(
  vocabularyId: string,
  tags: string[],
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = tagsInputSchema.safeParse({ vocabularyId, tags });
  if (!parsed.success) {
    return { success: false, error: "Tag không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await vocabService.updateUserVocabTags(
    userId,
    parsed.data.vocabularyId,
    parsed.data.tags,
  );
  revalidatePath("/notebook");
  return result;
}

export async function updateNoteAction(
  vocabularyId: string,
  note: string,
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = noteInputSchema.safeParse({ vocabularyId, note });
  if (!parsed.success) {
    return { success: false, error: "Ghi chú không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await vocabService.updateUserVocabNote(
    userId,
    parsed.data.vocabularyId,
    parsed.data.note ?? "",
  );
  revalidatePath("/notebook");
  return result;
}

export async function markMasteredAction(vocabularyId: string): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = masteredInputSchema.safeParse({ vocabularyId });
  if (!parsed.success) return { success: false, error: "Dữ liệu không hợp lệ" };
  const result = await vocabService.markMastered(userId, parsed.data.vocabularyId);
  revalidateNotebookPaths();
  return result;
}

export async function unmarkMasteredAction(vocabularyId: string): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = masteredInputSchema.safeParse({ vocabularyId });
  if (!parsed.success) return { success: false, error: "Dữ liệu không hợp lệ" };
  const result = await vocabService.unmarkMastered(userId, parsed.data.vocabularyId);
  revalidateNotebookPaths();
  return result;
}

// ─── Collections ─────────────────────────────────────────────────────────

export async function listCollectionsAction() {
  const userId = await requireAuth();
  return vocabService.listCollections(userId);
}

export async function createCollectionAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireAuth();
  const parsed = createCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await vocabService.createCollection(userId, parsed.data);
  revalidatePath("/notebook");
  return result;
}

export async function updateCollectionAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = updateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await vocabService.updateCollection(userId, id, parsed.data);
  revalidatePath("/notebook");
  return result;
}

export async function deleteCollectionAction(id: string): Promise<ActionResult> {
  const userId = await requireAuth();
  const result = await vocabService.deleteCollection(userId, id);
  revalidatePath("/notebook");
  return result;
}

export async function addToCollectionAction(
  collectionId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = collectionMembershipSchema.safeParse({ collectionId, vocabularyId });
  if (!parsed.success) return { success: false, error: "Dữ liệu không hợp lệ" };
  const result = await vocabService.addToCollection(
    userId,
    parsed.data.collectionId,
    parsed.data.vocabularyId,
  );
  revalidatePath("/notebook");
  return result;
}

export async function removeFromCollectionAction(
  collectionId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = collectionMembershipSchema.safeParse({ collectionId, vocabularyId });
  if (!parsed.success) return { success: false, error: "Dữ liệu không hợp lệ" };
  const result = await vocabService.removeFromCollection(
    userId,
    parsed.data.collectionId,
    parsed.data.vocabularyId,
  );
  revalidatePath("/notebook");
  return result;
}

export async function bulkAddToCollectionAction(
  collectionId: string,
  vocabularyIds: string[],
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = bulkMembershipSchema.safeParse({ collectionId, vocabularyIds });
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await vocabService.bulkAddToCollection(
    userId,
    parsed.data.collectionId,
    parsed.data.vocabularyIds,
  );
  revalidatePath("/notebook");
  return result;
}

// ─── Bulk on the notebook itself ──────────────────────────────────────────

export async function bulkRemoveFromNotebookAction(
  vocabularyIds: string[],
): Promise<ActionResult> {
  const userId = await requireAuth();
  const parsed = bulkRemoveSchema.safeParse({ vocabularyIds });
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await vocabService.bulkRemoveFromNotebook(
    userId,
    parsed.data.vocabularyIds,
  );
  revalidateNotebookPaths();
  return result;
}

export async function bulkMarkMasteredAction(
  vocabularyIds: string[],
  mastered: boolean,
): Promise<ActionResult> {
  const userId = await requireAuth();
  const result = await vocabService.bulkMarkMastered(userId, vocabularyIds, mastered);
  revalidateNotebookPaths();
  return result;
}

// ─── Tags list (autocomplete) ────────────────────────────────────────────

export async function listUserTagsAction(): Promise<string[]> {
  const userId = await requireAuth();
  return vocabService.listUserTags(userId);
}

// ─── Share Collection ────────────────────────────────────────────────────

export async function toggleCollectionPublicAction(
  collectionId: string,
  isPublic: boolean,
): Promise<ActionResult<{ shareSlug: string | null }>> {
  const userId = await requireAuth();
  const parsed = togglePublicSchema.safeParse({ collectionId, isPublic });
  if (!parsed.success) return { success: false, error: "Dữ liệu không hợp lệ" };
  const result = await vocabService.toggleCollectionPublic(
    userId,
    parsed.data.collectionId,
    parsed.data.isPublic,
  );
  revalidatePath("/notebook");
  return result;
}

export async function cloneSharedCollectionAction(
  shareSlug: string,
): Promise<ActionResult<{ collectionId: string }>> {
  const userId = await requireAuth();
  const parsed = cloneSharedSchema.safeParse({ shareSlug });
  if (!parsed.success) return { success: false, error: "Dữ liệu không hợp lệ" };
  const result = await vocabService.cloneSharedCollection(userId, parsed.data.shareSlug);
  revalidatePath("/notebook");
  return result;
}

// ─── Quiz distractor helper ──────────────────────────────────────────────

export async function getRandomDistractorsAction(
  excludeVocabularyId: string,
  level: string | null,
  limit: number,
) {
  // Public endpoint but harmless to expose (no PII). We don't strictly need
  // auth here, but require it to mirror the rest of the API surface.
  await requireAuth();
  return vocabService.getRandomDistractors(excludeVocabularyId, level, limit);
}

// ─── Shared collection (public lookup, no auth required) ─────────────────

export async function getCollectionByShareSlugAction(shareSlug: string) {
  return vocabService.getCollectionByShareSlug(shareSlug);
}
