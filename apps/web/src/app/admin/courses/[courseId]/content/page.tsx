import AdminCourseContentWorkspaceClient from "./workspace-client";

export default async function AdminCourseContentPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  // Fetch AI prompts on the server for better performance
  const { adminApi } = await import("@/features/admin/api/admin-api");
  let aiPrompts: Array<{
    id: string;
    name: string;
    description?: string | null;
    systemPrompt: string;
    userPromptTemplate: string;
    temperature: number;
    maxTokens: number;
  }> = [];

  try {
    aiPrompts = (await adminApi.getAiPrompts()) as typeof aiPrompts;
  } catch {
    // AI prompts are optional, continue without them
  }

  return (
    <AdminCourseContentWorkspaceClient
      courseId={courseId}
      aiPrompts={aiPrompts}
    />
  );
}
