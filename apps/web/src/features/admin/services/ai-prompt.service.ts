import { db } from "@/db";
import { aiPrompt } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface PromptInput {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}

export async function getPrompts() {
  return db.query.aiPrompt.findMany({
    orderBy: [desc(aiPrompt.createdAt)],
  });
}

export async function getPromptById(id: string) {
  return db.query.aiPrompt.findFirst({
    where: eq(aiPrompt.id, id),
  });
}

export async function createPrompt(data: PromptInput) {
  await db.insert(aiPrompt).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { success: true };
}

export async function updatePrompt(
  id: string,
  data: {
    name?: string;
    systemPrompt?: string;
    userPromptTemplate?: string;
    temperature?: number;
    maxTokens?: number;
  },
) {
  await db
    .update(aiPrompt)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(aiPrompt.id, id));
  return { success: true };
}

export async function deletePrompt(id: string) {
  await db.delete(aiPrompt).where(eq(aiPrompt.id, id));
  return { success: true };
}
