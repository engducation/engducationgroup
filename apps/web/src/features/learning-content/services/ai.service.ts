/**
 * AI Writing Assistant Service - Groq + Vercel AI SDK
 *
 * Tech stack: Groq API (openai/gpt-oss-120b) + Vercel AI SDK (generateText)
 * Replaces OpenAI for cost optimization (90% cost reduction) and ultra-low latency.
 *
 * Model history (see https://console.groq.com/docs/deprecations):
 *   - llama3-70b-8192 → decommissioned 30/08/2025
 *   - llama-3.3-70b-versatile → does not support `json_schema` response format
 *   - openai/gpt-oss-120b → currently in use with JSON Object Mode
 *     (`response_format: { type: "json_object" }`) and Zod parse instead of
 *     strict json_schema, because AI SDK 6 + gpt-oss-120b strict mode has
 *     been observed to fail intermittently with `json_validate_failed` even
 *     when the model output is schema-valid. JSON Object Mode is the fallback
 *     recommended by Groq docs for broader model support.
 *
 * Follows groq.md spec Section 2.2:
 * - SHA-256 caching to avoid duplicate API calls
 * - Zod schema for strict output validation
 * - Agentic two-layer workflow (analyze errors + suggest style)
 *
 * Output contract (validated via Zod after the call):
 *   - hasError, score, correctedText
 *   - errors[]: original (verbatim substring from input) + replacement + type + Vietnamese explanation
 *   - suggestions[]: up to 3 holistic style suggestions (Vietnamese)
 */

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";
import crypto from "crypto";
import { env } from "@/env";
import type { WritingAnalysis } from "@/features/learning-content/types";

// ─── Groq Client ─────────────────────────────────────────────────────────────

const groq = createGroq({
  apiKey: env.GROQ_API_KEY ?? "",
});

if (!env.GROQ_API_KEY) {
  console.warn("[AI Service] GROQ_API_KEY is not set. AI features will not work.");
}

// ─── Output Schema ────────────────────────────────────────────────────────────
//
// The schema forces the LLM to:
//   1. Surface every mistake as a pair (original -> replacement) so the UI can
//      highlight the exact substring in the student's text.
//   2. Classify the mistake so the UI can pick a colour per category.
//   3. Explain in Vietnamese (the student's native language) for pedagogy.
//   4. Provide a fully correctedText and 3 holistic style suggestions.

const errorTypeSchema = z.enum(["grammar", "spelling", "style"]);

const writingErrorSchema = z.object({
  original: z
    .string()
    .min(1)
    .describe(
      "The exact substring from the student's input that contains the error. Must appear verbatim in the source text."
    ),
  replacement: z
    .string()
    .min(1)
    .describe("The corrected version that should replace 'original'."),
  type: errorTypeSchema.describe(
    "Category of the error: 'spelling' (typo/character), 'grammar' (tense, agreement, preposition), 'style' (unnatural phrasing)."
  ),
  explanation: z
    .string()
    .min(1)
    .describe("Explanation in Vietnamese (tiếng Việt) of WHY it is wrong and HOW to fix it."),
});

// Internal schema: the strict contract fed to the LLM via Vercel AI SDK's
// generateObject. The public mirror lives in types/schemas.ts so the rest of
// the app can import a single source of truth for shapes.
const groqWritingAnalysisSchema = z.object({
  hasError: z
    .boolean()
    .describe("true if the text contains at least one grammar/spelling error; false if perfect."),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall writing quality score from 0 (broken) to 100 (perfect)."),
  correctedText: z
    .string()
    .describe("The full text after all detected errors have been corrected."),
  errors: z
    .array(writingErrorSchema)
    .describe("List of every individual error. Empty array when hasError is false."),
  suggestions: z
    .array(z.string())
    .max(3)
    .describe("Up to 3 holistic style suggestions in Vietnamese to improve overall writing."),
});

export type WritingErrorType = z.infer<typeof errorTypeSchema>;
export type WritingError = z.infer<typeof writingErrorSchema>;

// ─── Prompt Engineering ──────────────────────────────────────────────────────
//
// The system prompt sets the persona (ESL examiner for Vietnamese learners) and
// enforces the output contract. The user prompt frames the task narrowly so the
// model focuses on per-token diffing rather than free-form review.
//
// IMPORTANT: We use `response_format: { type: "json_object" }` (NOT `json_schema`)
// because Groq's strict json_schema mode has been unreliable in practice with
// gpt-oss-120b — see https://console.groq.com/docs/structured-outputs.
// With json_object we get valid JSON output (no syntax errors) and rely on Zod
// for the schema contract.

const SYSTEM_PROMPT = `You are an expert ESL Writing Assistant Agent for Vietnamese students.
Your absolute core duties are:
1. Identify specific spelling, grammar, and style errors.
2. Provide the exact wrong text ('original') and the exact corrected text ('replacement').
3. Explain why it is wrong and how to fix it strictly in Vietnamese ('explanation').

Guidelines:
- 'original' must be a substring from the student's input (verbatim, case-sensitive).
- 'explanation' must be professional, encouraging, and easy to understand for Vietnamese learners.
- If the sentence is grammatically correct but sounds unnatural, classify it as 'style'.
- If the text has no errors, set hasError=false, errors=[], correctedText=original text, and STILL provide exactly 3 style suggestions in 'suggestions'.
- ALWAYS include 'suggestions' as a non-empty array of exactly 3 short, actionable Vietnamese tips — even when there are errors.
- Score reflects overall writing quality from 0 (broken) to 100 (perfect).
- correctedText must be the entire text with all replacements applied.
- Inside the 'explanation' string field, use single quotes (') instead of double quotes (") to avoid JSON escaping issues.
- The JSON object must contain exactly these top-level keys, in this order: hasError, score, correctedText, errors, suggestions.
- Output ONLY the JSON object. No markdown, no prose, no code fences.`;

const buildUserPrompt = (cleanText: string) =>
  `Analyze this English text: "${cleanText}"
Break down every single mistake to point out the error and suggest the correction.`;

// ─── In-Memory Response Cache ──────────────────────────────────────────────────

// Simple SHA-256 cache to avoid duplicate API calls for the same text input.
// Key: SHA-256 hash of trimmed text. Value: serialized JSON string.
const responseCache = new Map<string, string>();
const CACHE_MAX_ENTRIES = 500;

function readFromCache(hash: string): WritingAnalysis | null {
  const cached = responseCache.get(hash);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as WritingAnalysis;
  } catch {
    // Corrupted cache entry: drop it.
    responseCache.delete(hash);
    return null;
  }
}

function writeToCache(hash: string, value: WritingAnalysis): void {
  responseCache.set(hash, JSON.stringify(value));
  if (responseCache.size > CACHE_MAX_ENTRIES) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
}

// ─── Core Analysis Function ───────────────────────────────────────────────────

export async function analyzeWritingContent(
  textInput: string,
): Promise<WritingAnalysis> {
  if (!textInput || textInput.trim().length < 5) {
    throw new Error("Văn bản đầu vào quá ngắn để phân tích (tối thiểu 5 ký tự).");
  }

  const cleanText = textInput.trim();
  const textHash = crypto.createHash("sha256").update(cleanText).digest("hex");

  // Return cached result if available (saves 100% API cost on duplicates)
  const cached = readFromCache(textHash);
  if (cached) return cached;

  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env.");
  }

  const callGroqOnce = async (): Promise<string> => {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(cleanText),
      temperature: 0.2,
      providerOptions: {
        groq: {
          structuredOutputs: false,
        },
      },
    });
    return text;
  };

  try {
    let text: string;
    try {
      text = await callGroqOnce();
      const result = parseAndValidate(text, cleanText);
      writeToCache(textHash, result);
      return result;
    } catch (parseError) {
      // Parse/validation failed — likely a flaky model output. Retry once.
      console.warn(
        "[AI Service] First attempt did not parse cleanly, retrying once:",
        parseError instanceof Error ? parseError.message : parseError,
      );
      text = await callGroqOnce();
      const result = parseAndValidate(text, cleanText);
      writeToCache(textHash, result);
      return result;
    }
  } catch (error) {
    console.error("[AI Service] Groq API error:", error);
    throw new Error("Không thể hoàn thành phân tích văn bản vào lúc này. Vui lòng thử lại sau.");
  }
}

/**
 * Parse the raw LLM output as JSON and validate against the Zod schema.
 * Strips any markdown code fences the model might wrap the JSON in despite
 * instructions. Throws a friendly error when the response can't be parsed.
 *
 * Tolerates missing or malformed fields by backfilling sensible defaults so
 * the UI never crashes on a slightly off model output. This is necessary
 * because the LLM occasionally drops fields like `suggestions`, `type`, or
 * `score` — and we want the user to still get usable feedback rather than a
 * 500 error.
 */
function parseAndValidate(rawText: string, fallbackCorrectedText: string): WritingAnalysis {
  // Strip ```json ... ``` fences if present
  const trimmed = rawText.trim();
  const jsonText = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error("[AI Service] Failed to parse LLM JSON output:", jsonText.slice(0, 500));
    throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI trả về dữ liệu không đúng cấu trúc. Vui lòng thử lại.");
  }

  const obj = parsed as Record<string, unknown>;

  // hasError: required boolean
  if (typeof obj.hasError !== "boolean") {
    obj.hasError = Array.isArray(obj.errors) && obj.errors.length > 0;
  }

  // score: required 0-100
  if (typeof obj.score !== "number" || !Number.isFinite(obj.score)) {
    obj.score = 0;
  } else {
    obj.score = Math.max(0, Math.min(100, obj.score));
  }

  // correctedText: required string
  if (typeof obj.correctedText !== "string" || obj.correctedText.length === 0) {
    obj.correctedText = fallbackCorrectedText;
  }

  // errors: backfill type for any missing, drop entries that lack original/replacement
  if (!Array.isArray(obj.errors)) {
    obj.errors = [];
  } else {
    obj.errors = obj.errors
      .filter(
        (e): e is Record<string, unknown> =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as Record<string, unknown>).original === "string" &&
          ((e as Record<string, unknown>).original as string).length > 0,
      )
      .map((e) => ({
        original: e.original,
        replacement:
          typeof e.replacement === "string" && e.replacement.length > 0
            ? e.replacement
            : e.original,
        type: ["grammar", "spelling", "style"].includes(e.type as string)
          ? (e.type as "grammar" | "spelling" | "style")
          : "style",
        explanation:
          typeof e.explanation === "string" && e.explanation.length > 0
            ? e.explanation
            : "Cần chỉnh sửa lỗi này.",
      }));
  }

  // suggestions: optional, default to empty
  if (!Array.isArray(obj.suggestions)) {
    obj.suggestions = [];
  } else {
    obj.suggestions = obj.suggestions
      .filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
      .slice(0, 3);
  }

  const result = groqWritingAnalysisSchema.safeParse(obj);
  if (!result.success) {
    console.error("[AI Service] LLM output did not match schema after backfill:", result.error.issues);
    throw new Error("AI trả về dữ liệu không đúng cấu trúc. Vui lòng thử lại.");
  }
  return result.data as WritingAnalysis;
}

// ─── Cache Management (exported for tests / admin tools) ─────────────────────

export function clearWritingCache(): void {
  responseCache.clear();
}

export function getWritingCacheSize(): number {
  return responseCache.size;
}
