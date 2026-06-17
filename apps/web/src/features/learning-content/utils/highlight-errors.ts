/**
 * highlight-errors - Bóc tách văn bản gốc thành các segment có/không lỗi.
 *
 * Đầu vào: text gốc + danh sách errors từ AI.
 * Đầu ra: mảng `TextSegment` sắp xếp theo thứ tự xuất hiện, mỗi segment
 *   đánh dấu `isError` và (nếu là error) kèm `errorIndex` trỏ về mảng errors.
 *
 * Thuật toán: quét tuyến tính, tại mỗi vị trí tìm error gần nhất có original
 *   khớp case-insensitive ở vị trí đó. Khi tìm thấy, cắt thành 3 segment
 *   [trước, lỗi, sau]; tiếp tục quét phần "sau". Độ phức tạp O(n*m) nhưng
 *   với input ≤ 500 từ (giới hạn trong submitWritingSchema) thì hoàn toàn
 *   chấp nhận được và tránh được edge-case chồng lấn mà regex diff phức tạp
 *   hay gặp.
 */

import type { WritingError } from "@/features/learning-content/types";

export type TextSegment =
  | { kind: "text"; value: string; key: string }
  | { kind: "error"; value: string; key: string; error: WritingError; errorIndex: number };

/**
 * Escape user-provided substring before using it inside a RegExp constructor.
 * Stops the LLM's `original` field from accidentally injecting regex syntax.
 */
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find the next occurrence of any error's `original` substring starting from
 * `fromIndex`. Returns the earliest match (lowest index) across all errors so
 * we always render text in left-to-right order.
 */
function findNextMatch(
  text: string,
  errors: WritingError[],
  fromIndex: number,
): { index: number; length: number; error: WritingError; errorIndex: number } | null {
  let best: { index: number; length: number; error: WritingError; errorIndex: number } | null = null;

  for (let i = 0; i < errors.length; i++) {
    const err = errors[i];
    const needle = err.original.trim();
    if (!needle) continue;
    const re = new RegExp(escapeRegExp(needle), "i");
    const match = re.exec(text.slice(fromIndex));
    if (!match) continue;
    const absoluteIndex = fromIndex + match.index;
    if (best === null || absoluteIndex < best.index) {
      best = {
        index: absoluteIndex,
        length: match[0].length,
        error: err,
        errorIndex: i,
      };
    }
  }

  return best;
}

export function buildTextSegments(text: string, errors: WritingError[]): TextSegment[] {
  if (!text) return [];
  if (!errors || errors.length === 0) {
    return [{ kind: "text", value: text, key: "t-0" }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  let segmentCounter = 0;

  while (cursor < text.length) {
    const match = findNextMatch(text, errors, cursor);
    if (!match) {
      segments.push({ kind: "text", value: text.slice(cursor), key: `t-${segmentCounter++}` });
      break;
    }

    if (match.index > cursor) {
      segments.push({
        kind: "text",
        value: text.slice(cursor, match.index),
        key: `t-${segmentCounter++}`,
      });
    }

    // Prefer the original-case substring from the text so the highlight matches
    // exactly what the student typed (rather than the lowercased regex hit).
    const originalSlice = text.slice(match.index, match.index + match.length);
    segments.push({
      kind: "error",
      value: originalSlice,
      key: `e-${segmentCounter++}-${match.errorIndex}`,
      error: match.error,
      errorIndex: match.errorIndex,
    });

    cursor = match.index + match.length;
  }

  return segments;
}
