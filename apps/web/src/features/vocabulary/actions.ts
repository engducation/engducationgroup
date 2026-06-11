/**
 * Vocabulary Server Actions - Quản lý từ vựng (Admin + Student)
 *
 * Tuân thủ Vercel React Best Practices (Section 3.1):
 * - Authenticate Server Actions như API Routes
 * - Không có async waterfalls
 */

"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/features/learning-content/types";
import { asSessionUser } from "@/types/session";
import type {
  CreateVocabularyInput,
  UpdateVocabularyInput,
  SearchVocabularyInput,
  AssignVocabToLessonInput,
} from "./types/schemas";
import {
  createVocabularySchema,
  updateVocabularySchema,
  searchVocabularySchema,
  assignVocabToLessonSchema,
} from "./types/schemas";
import * as vocabService from "./services/vocabulary.service";
import {
  parseExcelSheet,
  validateVocabularyUniqueness,
} from "@/utils/ExcelParser";
import type { VocabularyExcelRow } from "@/utils/ExcelParser";

// ─── Auth Guard ─────────────────────────────────────────────────────────────

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const user = asSessionUser(session.user);
  if (user.role !== "admin") throw new Error("Không có quyền thực hiện thao tác này");
  return session.user.id;
}

async function requireAuth(): Promise<string> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user.id;
}

function zodIssues(err: { issues: Array<{ message: string }> }): string[] {
  return err.issues.map((e) => e.message);
}

// ─── Vocabulary Admin Actions ────────────────────────────────────────────────

export async function adminCreateVocabulary(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createVocabularySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      details: zodIssues(parsed.error),
    };
  }
  const result = await vocabService.createVocabulary(parsed.data);
  revalidatePath("/admin/vocabulary");
  return result;
}

export async function adminUpdateVocabulary(
  vocabId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateVocabularySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      details: zodIssues(parsed.error),
    };
  }
  const result = await vocabService.updateVocabulary(vocabId, parsed.data);
  revalidatePath("/admin/vocabulary");
  return result;
}

export async function adminDeleteVocabulary(vocabId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await vocabService.deleteVocabulary(vocabId);
  revalidatePath("/admin/vocabulary");
  return result;
}

export async function adminSearchVocabulary(input: unknown) {
  await requireAdmin();
  const parsed = searchVocabularySchema.safeParse(input);
  if (!parsed.success) return { items: [], total: 0 };
  return vocabService.searchVocabulary(parsed.data);
}

export async function adminAssignVocabularyToLesson(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = assignVocabToLessonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      details: zodIssues(parsed.error),
    };
  }
  const result = await vocabService.assignVocabularyToLesson(
    parsed.data.lessonId,
    parsed.data.vocabularyId,
    parsed.data.orderIndex,
  );
  revalidatePath("/admin/courses");
  return result;
}

export async function adminUnassignVocabularyFromLesson(
  lessonId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const result = await vocabService.unassignVocabularyFromLesson(lessonId, vocabularyId);
  revalidatePath("/admin/courses");
  return result;
}

// ─── Excel Import ──────────────────────────────────────────────────────────────

export async function adminImportVocabularyFromExcel(
  rawRows: Record<string, unknown>[],
): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
  parseErrors: string[];
}> {
  await requireAdmin();

  // Step 1: Parse Excel rows
  const parseResult = parseExcelSheet<VocabularyExcelRow>(rawRows, "VOCABULARY");
  const parseErrors = parseResult.errorRows.flatMap((r) => r.errors);

  if (parseResult.validRows.length === 0) {
    return {
      imported: 0,
      skipped: 0,
      errors: [],
      parseErrors,
    };
  }

  // Step 2: Check uniqueness within the uploaded batch
  const seenKeys = new Set<string>();
  const duplicateBatchErrors: string[] = [];

  for (const row of parseResult.validRows) {
    const data = row.data!;
    const uniquenessError = validateVocabularyUniqueness(
      data.tu_goc,
      data.tu_loai,
      seenKeys,
    );
    if (uniquenessError) {
      duplicateBatchErrors.push(`Dòng ${row.rowIndex + 1}: ${uniquenessError}`);
      seenKeys.add(`${data.tu_goc.toLowerCase()}|${data.tu_loai.toLowerCase()}`);
    }
  }

  const allErrors = [...parseErrors, ...duplicateBatchErrors];

  // Step 3: Bulk import valid rows
  const rowsToImport = parseResult.validRows
    .filter((row) => !duplicateBatchErrors.some((e) => e.startsWith(`Dòng ${row.rowIndex + 1}`)))
    .map((row) => row.data!);

  const { imported, skipped, errors } = await vocabService.bulkImportVocabulary(
    rowsToImport.map((r) => ({
      word: r.tu_goc,
      partOfSpeech: r.tu_loai,
      meaning: r.nghia,
      examples: r.vi_du,
      level: r.cap_do,
      topic: r.chu_de,
      phonetic: r.phien_am,
    })),
    "UPDATE_EXISTING",
  );

  revalidatePath("/admin/vocabulary");

  return {
    imported,
    skipped: skipped + duplicateBatchErrors.length,
    errors: [...errors, ...duplicateBatchErrors],
    parseErrors,
  };
}

// ─── Student Vocabulary Actions ─────────────────────────────────────────────────

export async function getUserNotebook() {
  const userId = await requireAuth();
  return vocabService.getUserNotebook(userId);
}

export async function saveVocabularyToNotebook(vocabularyId: string): Promise<ActionResult> {
  const userId = await requireAuth();
  const result = await vocabService.saveToNotebook(userId, vocabularyId);
  revalidatePath("/learn/vocabulary");
  revalidatePath("/learn/notebook");
  return result;
}

export async function removeVocabularyFromNotebook(vocabularyId: string): Promise<ActionResult> {
  const userId = await requireAuth();
  const result = await vocabService.removeFromNotebook(userId, vocabularyId);
  revalidatePath("/learn/vocabulary");
  revalidatePath("/learn/notebook");
  return result;
}

export async function searchVocabulary(input: unknown) {
  const parsed = searchVocabularySchema.safeParse(input);
  if (!parsed.success) return { items: [], total: 0 };
  return vocabService.searchVocabulary(parsed.data);
}

export async function getVocabularyById(vocabId: string) {
  return vocabService.getVocabularyById(vocabId);
}

export async function getLessonVocabulary(lessonId: string) {
  return vocabService.getLessonVocabulary(lessonId);
}

export async function getNotebookCount() {
  const userId = await requireAuth();
  return vocabService.getNotebookCount(userId);
}
