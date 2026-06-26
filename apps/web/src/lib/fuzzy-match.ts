/**
 * Tiny fuzzy matcher for the spelling practice.
 *
 * Strategy:
 *  1. Trim whitespace, lowercase both sides.
 *  2. If exact match → score 1.
 *  3. Otherwise compute Levenshtein distance and normalize to [0..1]
 *     where 1 == identical.
 */

export function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Use a flat array for speed; rows × cols.
  const m = a.length;
  const n = b.length;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export type SpellResult =
  | { status: "exact"; score: 1 }
  | { status: "close"; score: number; expected: string; actual: string; diff: number }
  | { status: "wrong"; score: number; expected: string; actual: string; diff: number };

/**
 * Returns a SpellResult. We treat score >= 0.85 as "close enough"
 * (typos like "teh" vs "the"), and score < 0.85 as wrong.
 */
export function checkSpelling(expected: string, actual: string): SpellResult {
  const e = normalize(expected);
  const a = normalize(actual);
  if (e === a) return { status: "exact", score: 1 };
  const maxLen = Math.max(e.length, a.length, 1);
  const dist = levenshtein(e, a);
  const score = 1 - dist / maxLen;
  if (score >= 0.85) {
    return { status: "close", score, expected: e, actual: a, diff: dist };
  }
  return { status: "wrong", score, expected: e, actual: a, diff: dist };
}