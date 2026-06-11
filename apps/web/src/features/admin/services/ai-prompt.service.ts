import { db } from "@/db";
import { aiPrompt } from "@/db/schema/admin";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface AiPromptInput {
  name: string;
  description?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature?: number;
  maxTokens?: number;
}

export async function getAiPrompts() {
  return db.select().from(aiPrompt).orderBy(aiPrompt.createdAt);
}

export async function getAiPromptById(id: string) {
  const [prompt] = await db.select().from(aiPrompt).where(eq(aiPrompt.id, id));
  return prompt || null;
}

export async function createAiPrompt(input: AiPromptInput) {
  const id = nanoid();
  await db.insert(aiPrompt).values({
    id,
    name: input.name,
    description: input.description || null,
    systemPrompt: input.systemPrompt,
    userPromptTemplate: input.userPromptTemplate,
    temperature: input.temperature ?? 0.7,
    maxTokens: input.maxTokens ?? 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return getAiPromptById(id);
}

export async function updateAiPrompt(id: string, input: Partial<AiPromptInput>) {
  await db.update(aiPrompt).set({
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.systemPrompt !== undefined ? { systemPrompt: input.systemPrompt } : {}),
    ...(input.userPromptTemplate !== undefined ? { userPromptTemplate: input.userPromptTemplate } : {}),
    ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
    ...(input.maxTokens !== undefined ? { maxTokens: input.maxTokens } : {}),
    updatedAt: new Date(),
  }).where(eq(aiPrompt.id, id));

  return getAiPromptById(id);
}

export async function deleteAiPrompt(id: string) {
  await db.delete(aiPrompt).where(eq(aiPrompt.id, id));
  return { id };
}
