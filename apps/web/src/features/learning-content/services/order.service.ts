/**
 * Order Service - Quản lý thứ tự Module và Lesson
 *
 * PRD Section 10.2: Thứ tự Module và Lesson phải liên tục và không trùng lặp.
 * Khi thay đổi thứ tự, hệ thống phải đảm bảo tính nhất quán.
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
  if (mode === "reorder" && orderedIds) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(module)
          .set({ orderIndex: i })
          .where(and(eq(module.id, orderedIds[i]), eq(module.courseId, courseId)));
      }
    });
    return;
  }

  if (mode === "shift") {
    // Remove from targetIndex: pull everything below up
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: module.id, orderIndex: module.orderIndex })
        .from(module)
        .where(eq(module.courseId, courseId))
        .orderBy(module.orderIndex);

      const removed = rows.find((r) => r.orderIndex === targetIndex);
      if (!removed) return;

      for (const row of rows) {
        if (row.orderIndex > targetIndex) {
          await tx
            .update(module)
            .set({ orderIndex: row.orderIndex - 1 })
            .where(eq(module.id, row.id));
        }
      }
    });
    return;
  }

  if (mode === "insert") {
    // Make space at targetIndex: shift everything ≥ targetIndex down by 1
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: module.id, orderIndex: module.orderIndex })
        .from(module)
        .where(eq(module.courseId, courseId))
        .orderBy(module.orderIndex);

      for (const row of rows) {
        if (row.orderIndex >= targetIndex) {
          await tx
            .update(module)
            .set({ orderIndex: row.orderIndex + 1 })
            .where(eq(module.id, row.id));
        }
      }
    });
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
  if (mode === "reorder" && orderedIds) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(lesson)
          .set({ orderIndex: i })
          .where(and(eq(lesson.id, orderedIds[i]), eq(lesson.moduleId, moduleId)));
      }
    });
    return;
  }

  if (mode === "shift") {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: lesson.id, orderIndex: lesson.orderIndex })
        .from(lesson)
        .where(eq(lesson.moduleId, moduleId))
        .orderBy(lesson.orderIndex);

      for (const row of rows) {
        if (row.orderIndex > targetIndex) {
          await tx
            .update(lesson)
            .set({ orderIndex: row.orderIndex - 1 })
            .where(eq(lesson.id, row.id));
        }
      }
    });
    return;
  }

  if (mode === "insert") {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: lesson.id, orderIndex: lesson.orderIndex })
        .from(lesson)
        .where(eq(lesson.moduleId, moduleId))
        .orderBy(lesson.orderIndex);

      for (const row of rows) {
        if (row.orderIndex >= targetIndex) {
          await tx
            .update(lesson)
            .set({ orderIndex: row.orderIndex + 1 })
            .where(eq(lesson.id, row.id));
        }
      }
    });
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
