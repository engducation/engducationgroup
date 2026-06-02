/**
 * AI Writing Assistant Service - Groq + Vercel AI SDK
 *
 * Tech stack: Groq API (llama3-70b-8192) + Vercel AI SDK (generateObject)
 * Replaces OpenAI for cost optimization (90% cost reduction) and ultra-low latency.
 *
 * Follows groq.md spec Section 2.2:
 * - SHA-256 caching to avoid duplicate API calls
 * - Zod schema for strict JSON output
 * - Agentic two-layer workflow (analyze errors + suggest style)
 */

import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import crypto from "crypto";
import { env } from "@/env";

// ─── Groq Client ─────────────────────────────────────────────────────────────

const groq = createGroq({
  apiKey: env.GROQ_API_KEY ?? "",
});

if (!env.GROQ_API_KEY) {
  console.warn("[AI Service] GROQ_API_KEY is not set. AI features will not work.");
}

// ─── Output Schema ────────────────────────────────────────────────────────────

const writingAnalysisSchema = z.object({
  hasError: z.boolean(),
  score: z.number().min(0).max(100),
  correctedText: z.string(),
  errors: z.array(
    z.object({
      original: z.string(),
      replacement: z.string(),
      type: z.enum(["grammar", "spelling", "style"]),
      explanation: z.string(),
    })
  ),
  suggestions: z.array(z.string()),
});

// ─── In-Memory Response Cache ──────────────────────────────────────────────────

// Simple SHA-256 cache to avoid duplicate API calls for the same text input.
// Key: SHA-256 hash of trimmed text. Value: serialized JSON string.
const responseCache = new Map<string, string>();

// ─── Core Analysis Function ───────────────────────────────────────────────────

export async function analyzeWritingContent(textInput: string): Promise<z.infer<typeof writingAnalysisSchema>> {
  if (!textInput || textInput.trim().length < 5) {
    throw new Error("Văn bản đầu vào quá ngắn để phân tích (tối thiểu 5 ký tự).");
  }

  const cleanText = textInput.trim();
  const textHash = crypto.createHash("sha256").update(cleanText).digest("hex");

  // Return cached result if available
  if (responseCache.has(textHash)) {
    return JSON.parse(responseCache.get(textHash)!) as z.infer<typeof writingAnalysisSchema>;
  }

  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env.");
  }

  try {
    const { object } = await generateObject({
      model: groq("llama3-70b-8192"),
      schema: writingAnalysisSchema,
      system: `You are an expert ESL Writing Assistant Agent. Your role is to analyze English sentences
provided by Vietnamese students.
- Analyze spelling errors, grammar mistakes, and writing style issues.
- Provide all explanations and suggestions strictly in Vietnamese.
- Be concise, direct, and pragmatic.
- Score reflects overall writing quality from 0 (broken) to 100 (perfect).
- If the text has no errors, set hasError to false and correctedText to the original.
- Suggest up to 3 style improvements when text is grammatically correct but could be more polished.`,
      prompt: `Analyze this English text and return a structured analysis:
"${cleanText}"

For each error found, provide:
- original: the exact error text
- replacement: the corrected version
- type: one of "grammar", "spelling", or "style"
- explanation: brief explanation in Vietnamese (tiếng Việt)

Also provide:
- correctedText: the fully corrected version of the entire text
- score: quality score 0-100
- suggestions: up to 3 style suggestions (in Vietnamese) if no major errors exist
- hasError: true if any grammar/spelling errors were found`,
      temperature: 0.2,
    });

    // Cache the result before returning
    const serialized = JSON.stringify(object);
    responseCache.set(textHash, serialized);

    // Evict oldest entries if cache grows too large (max 500 entries)
    if (responseCache.size > 500) {
      const firstKey = responseCache.keys().next().value;
      if (firstKey) responseCache.delete(firstKey);
    }

    return object as z.infer<typeof writingAnalysisSchema>;
  } catch (error) {
    console.error("[AI Service] Groq API error:", error);
    throw new Error("Không thể hoàn thành phân tích văn bản vào lúc này. Vui lòng thử lại sau.");
  }
}

// ─── Types Export ─────────────────────────────────────────────────────────────

export type WritingAnalysis = z.infer<typeof writingAnalysisSchema>;
