import { NextResponse } from "next/server";
import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as aiPromptService from "@/features/admin/services/ai-prompt.service";

export async function GET() {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const data = await aiPromptService.getAiPrompts();
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy danh sách AI prompts");
  }
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    
    if (!body.name || !body.systemPrompt || !body.userPromptTemplate) {
      return NextResponse.json(
        { error: "Name, systemPrompt và userPromptTemplate là bắt buộc" },
        { status: 400 }
      );
    }

    const data = await aiPromptService.createAiPrompt({
      name: body.name,
      description: body.description,
      systemPrompt: body.systemPrompt,
      userPromptTemplate: body.userPromptTemplate,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
    return apiOk(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Không thể tạo AI prompt");
  }
}
