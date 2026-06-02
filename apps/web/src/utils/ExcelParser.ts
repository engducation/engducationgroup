import { z } from "zod";

// ─── Zod Validation Schemas (PRD Section 11) ───────────────────────────────

export const courseExcelRowSchema = z.object({
  ma_course: z.string().min(1, "Mã course không được để trống"),
  tieu_de: z.string().min(1, "Tiêu đề course không được để trống"),
  cap_do: z.string().min(1, "Cấp độ không được để trống"),
  trang_thai: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const moduleExcelRowSchema = z.object({
  ma_course: z.string().min(1, "Mã course không được để trống"),
  ten_module: z.string().min(1, "Tên module không được để trống"),
  thu_tu_module: z.coerce.number().int().positive("Thứ tự module phải là số nguyên dương"),
});

export const lessonExcelRowSchema = z.object({
  ma_course: z.string().min(1, "Mã course không được để trống"),
  ten_module: z.string().min(1, "Tên module không được để trống"),
  ten_lesson: z.string().min(1, "Tên lesson không được để trống"),
  thu_tu_lesson: z.coerce
    .number()
    .int()
    .positive("Thứ tự lesson phải là số nguyên dương")
    .optional(),
});

export const readExcelRowSchema = z.object({
  ma_lesson: z.string().min(1, "Mã lesson không được để trống"),
  tieu_de: z.string().min(1, "Tiêu đề Read không được để trống"),
  noi_dung: z.string().min(1, "Nội dung không được để trống"),
  tu_khoa: z.string().optional(),
  muc_tieu: z.string().optional(),
});

export const writeExcelRowSchema = z.object({
  ma_lesson: z.string().min(1, "Mã lesson không được để trống"),
  de_bai: z.string().min(1, "Đề bài không được để trống"),
  tieu_chi: z.string().optional(),
  huong_dan_do_dai: z.coerce.number().int().positive().optional(),
});

export const quizExcelRowSchema = z.object({
  ma_lesson: z.string().min(1, "Mã lesson không được để trống"),
  cau_hoi: z.string().min(1, "Câu hỏi không được để trống"),
  dap_an_1: z.string().min(1, "Phải có ít nhất 2 đáp án"),
  dap_an_2: z.string().min(1, "Phải có ít nhất 2 đáp án"),
  dap_an_3: z.string().optional(),
  dap_an_4: z.string().optional(),
  dap_an_5: z.string().optional(),
  dap_an_dung: z.coerce.number().int().min(1).max(5, "Chỉ hỗ trợ tối đa 5 đáp án"),
  giai_thich: z.string().min(1, "Giải thích bắt buộc phải có cho mỗi câu hỏi"),
});

export const vocabularyExcelRowSchema = z.object({
  tu_goc: z.string().min(1, "Từ gốc không được để trống"),
  tu_loai: z.string().min(1, "Từ loại không được để trống"),
  nghia: z.string().min(1, "Nghĩa không được để trống"),
  vi_du: z.string().min(1, "Ví dụ không được để trống"),
  cap_do: z.string().optional(),
  chu_de: z.string().optional(),
  phien_am: z.string().optional(),
});

// ─── Raw Excel Row Types ────────────────────────────────────────────────────

export type CourseExcelRow = z.infer<typeof courseExcelRowSchema>;
export type ModuleExcelRow = z.infer<typeof moduleExcelRowSchema>;
export type LessonExcelRow = z.infer<typeof lessonExcelRowSchema>;
export type ReadExcelRow = z.infer<typeof readExcelRowSchema>;
export type WriteExcelRow = z.infer<typeof writeExcelRowSchema>;
export type QuizExcelRow = z.infer<typeof quizExcelRowSchema>;
export type VocabularyExcelRow = z.infer<typeof vocabularyExcelRowSchema>;

// ─── Row Validation Result ─────────────────────────────────────────────────

export interface RowValidationResult<T = Record<string, unknown>> {
  rowIndex: number;
  data: T | null;
  errors: string[];
  isValid: boolean;
}

// ─── Excel Parse Result ─────────────────────────────────────────────────────

export interface ExcelParseResult<T = Record<string, unknown>> {
  validRows: RowValidationResult<T>[];
  errorRows: RowValidationResult<T>[];
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    errorRate: number;
  };
}

// ─── Excel Parser Core ──────────────────────────────────────────────────────

export type SheetType =
  | "COURSE"
  | "MODULE"
  | "LESSON"
  | "READ"
  | "WRITE"
  | "QUIZ"
  | "VOCABULARY";

const SHEET_SCHEMA_MAP: Record<SheetType, z.ZodSchema> = {
  COURSE: courseExcelRowSchema,
  MODULE: moduleExcelRowSchema,
  LESSON: lessonExcelRowSchema,
  READ: readExcelRowSchema,
  WRITE: writeExcelRowSchema,
  QUIZ: quizExcelRowSchema,
  VOCABULARY: vocabularyExcelRowSchema,
};

const SHEET_HEADER_MAP: Record<SheetType, string[]> = {
  COURSE: ["ma_course", "tieu_de", "cap_do", "trang_thai"],
  MODULE: ["ma_course", "ten_module", "thu_tu_module"],
  LESSON: ["ma_course", "ten_module", "ten_lesson", "thu_tu_lesson"],
  READ: ["ma_lesson", "tieu_de", "noi_dung", "tu_khoa", "muc_tieu"],
  WRITE: ["ma_lesson", "de_bai", "tieu_chi", "huong_dan_do_dai"],
  QUIZ: [
    "ma_lesson",
    "cau_hoi",
    "dap_an_1",
    "dap_an_2",
    "dap_an_3",
    "dap_an_4",
    "dap_an_5",
    "dap_an_dung",
    "giai_thich",
  ],
  VOCABULARY: ["tu_goc", "tu_loai", "nghia", "vi_du", "cap_do", "chu_de", "phien_am"],
};

/**
 * Normalize a raw Excel row object — strips BOM, trims all string values,
 * converts empty strings to undefined so Zod coercion can handle optional fields.
 */
function normalizeRow(
  raw: Record<string, unknown>,
  expectedHeaders: string[],
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const header of expectedHeaders) {
    const val = raw[header];
    if (typeof val === "string") {
      const trimmed = val.trim().replace(/^\uFEFF/, "");
      normalized[header] = trimmed === "" ? undefined : trimmed;
    } else {
      normalized[header] = val;
    }
  }
  return normalized;
}

/**
 * Validate a single raw row against its Zod schema.
 * Returns RowValidationResult with all errors collected (never throws).
 */
function validateRow<T>(
  rowIndex: number,
  raw: Record<string, unknown>,
  schema: z.ZodSchema,
  expectedHeaders: string[],
): RowValidationResult<T> {
  const normalized = normalizeRow(raw, expectedHeaders);
  const result = schema.safeParse(normalized);

  if (result.success) {
    return { rowIndex, data: result.data as T, errors: [], isValid: true };
  }

  const errors = result.error.issues.map(
    (e) => `Dòng ${rowIndex + 1}: ${e.message} (trường: ${e.path.join(".")})`,
  );

  return { rowIndex, data: null, errors, isValid: false };
}

/**
 * Parse an Excel sheet (as an array of row objects) and return typed results.
 *
 * Implements PRD Section 11.2:
 * - Row-by-row validation
 * - Valid rows are returned immediately
 * - Invalid rows are reported with explicit per-row errors
 * - Admin can import valid rows and skip error rows
 *
 * @param rows  Raw rows from xlsx.read() as array of row objects keyed by column header
 * @param sheetType  Which entity type these rows represent
 * @returns ExcelParseResult with validRows and errorRows separated
 */
export function parseExcelSheet<T extends Record<string, unknown>>(
  rows: Record<string, unknown>[],
  sheetType: SheetType,
): ExcelParseResult<T> {
  const schema = SHEET_SCHEMA_MAP[sheetType];
  const headers = SHEET_HEADER_MAP[sheetType];

  if (!schema || !headers) {
    return {
      validRows: [],
      errorRows: [],
      summary: { totalRows: 0, validCount: 0, errorCount: 0, errorRate: 1 },
    };
  }

  const validRows: RowValidationResult<T>[] = [];
  const errorRows: RowValidationResult<T>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = validateRow<T>(i, rows[i], schema, headers);
    if (result.isValid) {
      validRows.push(result);
    } else {
      errorRows.push(result);
    }
  }

  const totalRows = rows.length;
  const validCount = validRows.length;
  const errorCount = errorRows.length;

  return {
    validRows,
    errorRows,
    summary: {
      totalRows,
      validCount,
      errorCount,
      errorRate: totalRows > 0 ? errorCount / totalRows : 0,
    },
  };
}

/**
 * Parse a full workbook — multiple sheets — and return results per sheet.
 * Keys match the sheetType names.
 */
export function parseFullWorkbook(
  workbook: Record<string, Record<string, unknown>[]>,
): Partial<Record<SheetType, ExcelParseResult>> {
  const results: Partial<Record<SheetType, ExcelParseResult>> = {};

  for (const [sheetName, rows] of Object.entries(workbook)) {
    const type = sheetName.toUpperCase() as SheetType;
    if (SHEET_SCHEMA_MAP[type]) {
      results[type] = parseExcelSheet(rows, type);
    }
  }

  return results;
}

/**
 * Format a parse result into a human-readable summary string.
 * Used for logging and UI error reporting.
 */
export function formatParseSummary<T>(
  result: ExcelParseResult<T>,
  entityName: string,
): string {
  const { summary } = result;
  const lines: string[] = [
    `📊 Kết quả parse ${entityName}:`,
    `   Tổng số dòng: ${summary.totalRows}`,
    `   ✅ Dòng hợp lệ: ${summary.validCount}`,
    `   ❌ Dòng lỗi: ${summary.errorCount}`,
    `   Tỷ lệ lỗi: ${(summary.errorRate * 100).toFixed(1)}%`,
  ];

  if (result.errorRows.length > 0) {
    lines.push(`\n🔍 Chi tiết lỗi:`);
    for (const row of result.errorRows.slice(0, 20)) {
      lines.push(`   Dòng ${row.rowIndex + 1}: ${row.errors.join("; ")}`);
    }
    if (result.errorRows.length > 20) {
      lines.push(`   ... và ${result.errorRows.length - 20} dòng lỗi khác`);
    }
  }

  return lines.join("\n");
}

/**
 * Excel columns that must be present in each sheet type.
 * Used for pre-validation before parsing.
 */
export const SHEET_REQUIRED_HEADERS: Record<SheetType, string[]> = {
  COURSE: ["ma_course", "tieu_de", "cap_do"],
  MODULE: ["ma_course", "ten_module", "thu_tu_module"],
  LESSON: ["ma_course", "ten_module", "ten_lesson"],
  READ: ["ma_lesson", "tieu_de", "noi_dung"],
  WRITE: ["ma_lesson", "de_bai"],
  QUIZ: ["ma_lesson", "cau_hoi", "dap_an_1", "dap_an_2", "dap_an_dung", "giai_thich"],
  VOCABULARY: ["tu_goc", "tu_loai", "nghia", "vi_du"],
};

/**
 * Validate that the uploaded Excel file has the correct headers.
 * Returns list of missing or unexpected headers.
 */
export function validateExcelHeaders(
  actualHeaders: string[],
  sheetType: SheetType,
): string[] {
  const required = SHEET_REQUIRED_HEADERS[sheetType];
  const normalized = actualHeaders.map((h) => h.trim().replace(/^\uFEFF/, "").toLowerCase());
  const requiredLower = required.map((r) => r.toLowerCase());

  const missing = requiredLower.filter((r) => !normalized.includes(r));
  return missing;
}

/**
 * Quiz-specific validation: ensure at least 2 answer options exist per question.
 * Called after initial parse for quiz rows that passed Zod.
 */
export function validateQuizOptions(row: QuizExcelRow): string | null {
  const filledOptions = [
    row.dap_an_1,
    row.dap_an_2,
    row.dap_an_3,
    row.dap_an_4,
    row.dap_an_5,
  ].filter(Boolean);

  if (filledOptions.length < 2) {
    return `Dòng: Câu hỏi phải có ít nhất 2 đáp án (hiện tại: ${filledOptions.length})`;
  }

  if (row.dap_an_dung > filledOptions.length) {
    return `Dòng: Số đáp án đúng (${row.dap_an_dung}) vượt quá số đáp án hiện có (${filledOptions.length})`;
  }

  return null;
}

/**
 * Vocabulary-specific validation: duplicate word + partOfSpeech check.
 * Returns the duplicate message if a duplicate is detected, null otherwise.
 */
export function validateVocabularyUniqueness(
  word: string,
  partOfSpeech: string,
  seen: Set<string>,
): string | null {
  const key = `${word.toLowerCase().trim()}|${partOfSpeech.toLowerCase().trim()}`;
  if (seen.has(key)) {
    return `Từ "${word}" (${partOfSpeech}) bị trùng lặp trong file Excel`;
  }
  seen.add(key);
  return null;
}
