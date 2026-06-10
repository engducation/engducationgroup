import { db } from "@/db";
import { vocabulary } from "@/db/schema/learning-content";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function getVocabulary() {
  return db
    .select()
    .from(vocabulary)
    .orderBy(desc(vocabulary.createdAt));
}

export async function createVocabulary(data: {
  word: string;
  partOfSpeech: string;
  phonetic?: string;
  meaning: string;
  examples?: string;
  overwrite?: boolean;
}) {
  if (data.overwrite) {
    const existing = await db
      .select({ id: vocabulary.id })
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.word, data.word),
          eq(vocabulary.partOfSpeech, data.partOfSpeech)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(vocabulary)
        .set({
          phonetic: data.phonetic ?? null,
          meaning: data.meaning,
          examples: data.examples ?? null,
          updatedAt: new Date(),
        })
        .where(eq(vocabulary.id, existing[0].id));
      return existing[0].id;
    }
  }

  const id = nanoid();
  await db.insert(vocabulary).values({
    id,
    word: data.word,
    partOfSpeech: data.partOfSpeech,
    phonetic: data.phonetic ?? null,
    meaning: data.meaning,
    examples: data.examples ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateVocabulary(
  id: string,
  data: {
    word?: string;
    partOfSpeech?: string;
    phonetic?: string;
    meaning?: string;
    examples?: string;
  }
) {
  await db
    .update(vocabulary)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vocabulary.id, id));
  return { success: true };
}

export async function deleteVocabulary(id: string) {
  await db.delete(vocabulary).where(eq(vocabulary.id, id));
  return { success: true };
}

export async function bulkImportVocabulary(
  records: Array<{
    word: string;
    partOfSpeech: string;
    phonetic?: string;
    meaning: string;
    examples?: string;
  }>
) {
  const errors: Array<{ row: number; reason: string }> = [];
  let successCount = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    try {
      if (!rec.word || !rec.partOfSpeech || !rec.meaning) {
        errors.push({
          row: i + 2,
          reason: "Thiếu trường bắt buộc: word, partOfSpeech, hoặc meaning",
        });
        continue;
      }

      const id = nanoid();
      await db.insert(vocabulary).values({
        id,
        word: rec.word,
        partOfSpeech: rec.partOfSpeech,
        phonetic: rec.phonetic ?? null,
        meaning: rec.meaning,
        examples: rec.examples ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      successCount++;
    } catch {
      errors.push({ row: i + 2, reason: "Lỗi khi thêm từ vào database" });
    }
  }

  return { successCount, errors };
}
