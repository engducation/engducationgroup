/**
 * Order Service - Quản lý thứ tự Module và Lesson
 *
 * PRD Section 10.2: Thứ tự Module và Lesson phải liên tục và không trùng lặp.
 * Khi thay đổi thứ tự, hệ thống phải đảm bảo tính nhất quán.
 *
 * Lưu ý: Neon HTTP driver không hỗ trợ transactions,
 * nên cần dùng kỹ thuật "temporary offset" để tránh unique constraint violation.
 */

import { db } from "@/db";
import { module, lesson } from "@/db/schema/learning-content";
import { eq, and } from "drizzle-orm";

/**
 * Shift modules in a course to make room for a new order index.
 * mode:
 *  "insert"  — make space at `targetIndex`, shift existing ≥ targetIndex down by 1
 *  "shift"   — remove module from `targetIndex`, pull everything below up by 1
 *  "reorder" — bulk-reorder using `orderedIds` array (index = orderIndex)
 */
export async function reorderModulesInDb(
  courseId: string,
  targetIndex: number,
  mode: "insert" | "shift" | "reorder",
  orderedIds?: string[],
): Promise<void> {
  if (mode === "reorder" && orderedIds && orderedIds.length > 0) {
    // Use temporary offset to avoid unique constraint violation
    const TEMP_OFFSET = 100000;
    
    // Step 1: Set all to temp values (no conflicts)
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(module)
        .set({ orderIndex: TEMP_OFFSET + i, updatedAt: new Date() })
        .where(and(eq(module.id, orderedIds[i]), eq(module.courseId, courseId)));
    }
    
    // Step 2: Set to final values
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(module)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(and(eq(module.id, orderedIds[i]), eq(module.courseId, courseId)));
    }
    return;
  }

  if (mode === "shift") {
    // Remove from targetIndex: pull everything below up
    const rows = await db
      .select({ id: module.id, orderIndex: module.orderIndex })
      .from(module)
      .where(eq(module.courseId, courseId))
      .orderBy(module.orderIndex);

    for (const row of rows) {
      if (row.orderIndex > targetIndex) {
        await db
          .update(module)
          .set({ orderIndex: row.orderIndex - 1, updatedAt: new Date() })
          .where(eq(module.id, row.id));
      }
    }
    return;
  }

  if (mode === "insert") {
    // Make space at targetIndex: shift everything ≥ targetIndex down by 1
    const rows = await db
      .select({ id: module.id, orderIndex: module.orderIndex })
      .from(module)
      .where(eq(module.courseId, courseId))
      .orderBy(module.orderIndex);

    for (const row of rows) {
      if (row.orderIndex >= targetIndex) {
        await db
          .update(module)
          .set({ orderIndex: row.orderIndex + 1, updatedAt: new Date() })
          .where(eq(module.id, row.id));
      }
    }
  }
}

/**
 * Shift lessons in a module to make room for a new order index.
 * Same mode semantics as reorderModulesInDb.
 */
export async function reorderLessonsInDb(
  moduleId: string,
  targetIndex: number,
  mode: "insert" | "shift" | "reorder",
  orderedIds?: string[],
): Promise<void> {
  if (mode === "reorder" && orderedIds && orderedIds.length > 0) {
    // Use temporary offset to avoid unique constraint violation
    // The offset (100000) ensures no conflict with existing values
    const TEMP_OFFSET = 100000;
    
    // Step 1: Set all to temp values (no conflicts because each gets unique temp value)
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(lesson)
        .set({ orderIndex: TEMP_OFFSET + i, updatedAt: new Date() })
        .where(and(eq(lesson.id, orderedIds[i]), eq(lesson.moduleId, moduleId)));
    }
    
    // Step 2: Set to final values (now all old values are replaced)
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(lesson)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(and(eq(lesson.id, orderedIds[i]), eq(lesson.moduleId, moduleId)));
    }
    return;
  }

  if (mode === "shift") {
    const rows = await db
      .select({ id: lesson.id, orderIndex: lesson.orderIndex })
      .from(lesson)
      .where(eq(lesson.moduleId, moduleId))
      .orderBy(lesson.orderIndex);

    for (const row of rows) {
      if (row.orderIndex > targetIndex) {
        await db
          .update(lesson)
          .set({ orderIndex: row.orderIndex - 1, updatedAt: new Date() })
          .where(eq(lesson.id, row.id));
      }
    }
    return;
  }

  if (mode === "insert") {
    const rows = await db
      .select({ id: lesson.id, orderIndex: lesson.orderIndex })
      .from(lesson)
      .where(eq(lesson.moduleId, moduleId))
      .orderBy(lesson.orderIndex);

    for (const row of rows) {
      if (row.orderIndex >= targetIndex) {
        await db
          .update(lesson)
          .set({ orderIndex: row.orderIndex + 1, updatedAt: new Date() })
          .where(eq(lesson.id, row.id));
      }
    }
  }
}

/**
 * Validate that a course's modules have continuous, non-duplicate order indices.
 * Logs warnings for any violations (does not auto-fix).
 */
export async function validateModuleOrder(courseId: string): Promise<{
  isValid: boolean;
  violations: string[];
}> {
  const rows = await db
    .select({ id: module.id, orderIndex: module.orderIndex })
    .from(module)
    .where(eq(module.courseId, courseId))
    .orderBy(module.orderIndex);

  const violations: string[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const expected = i;
    const actual = rows[i].orderIndex;
    if (actual !== expected) {
      violations.push(
        `Module "${rows[i].id}" có thứ tự ${actual}, kỳ vọng ${expected}`,
      );
    }
    if (seen.has(actual)) {
      violations.push(`Module "${rows[i].id}" trùng thứ tự ${actual}`);
    }
    seen.add(actual);
  }

  return { isValid: violations.length === 0, violations };
}

/**
 * Validate that a module's lessons have continuous, non-duplicate order indices.
 */
export async function validateLessonOrder(moduleId: string): Promise<{
  isValid: boolean;
  violations: string[];
}> {
  const rows = await db
    .select({ id: lesson.id, orderIndex: lesson.orderIndex })
    .from(lesson)
    .where(eq(lesson.moduleId, moduleId))
    .orderBy(lesson.orderIndex);

  const violations: string[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const expected = i;
    const actual = rows[i].orderIndex;
    if (actual !== expected) {
      violations.push(
        `Lesson "${rows[i].id}" có thứ tự ${actual}, kỳ vọng ${expected}`,
      );
    }
    if (seen.has(actual)) {
      violations.push(`Lesson "${rows[i].id}" trùng thứ tự ${actual}`);
    }
    seen.add(actual);
  }

  return { isValid: violations.length === 0, violations };
}
