import { NextResponse } from "next/server";
import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as aiPromptService from "@/features/admin/services/ai-prompt.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ promptId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { promptId } = await context.params;
    const data = await aiPromptService.getAiPromptById(promptId);
    
    if (!data) {
      return NextResponse.json({ error: "AI Prompt không tồn tại" }, { status: 404 });
    }
    
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy thông tin AI prompt");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ promptId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { promptId } = await context.params;
    const body = await request.json();
    
    const existing = await aiPromptService.getAiPromptById(promptId);
    if (!existing) {
      return NextResponse.json({ error: "AI Prompt không tồn tại" }, { status: 404 });
    }
    
    const data = await aiPromptService.updateAiPrompt(promptId, {
      name: body.name,
      description: body.description,
      systemPrompt: body.systemPrompt,
      userPromptTemplate: body.userPromptTemplate,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể cập nhật AI prompt");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ promptId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { promptId } = await context.params;
    
    const existing = await aiPromptService.getAiPromptById(promptId);
    if (!existing) {
      return NextResponse.json({ error: "AI Prompt không tồn tại" }, { status: 404 });
    }
    
    const data = await aiPromptService.deleteAiPrompt(promptId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể xóa AI prompt");
  }
}
