import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { write, writingSubmission } from "@/db/schema/learning-content";
import { WritingAssistantClient } from "@/features/learning-content/components/writing/writing-assistant-client";
import { parseFeedback } from "@/features/learning-content/services/writing.service";

export default async function AIAssistantPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Lấy bài write mới nhất đã xuất bản để làm đề bài mặc định cho AI Assistant.
  // Nếu DB chưa có bài nào, hiển thị empty state hướng dẫn user vào lesson
  // có bài viết trước.
  const latestWrite = await db.query.write.findFirst({
    orderBy: [desc(write.createdAt)],
  });

  if (!latestWrite) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Trợ lý AI Writing</h1>
        <p className="text-sm text-slate-500 mb-6">
          Chỉ ra lỗi sai và gợi ý sửa đổi đúng cho bài viết tiếng Anh của bạn.
        </p>
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <p className="text-sm text-slate-500">
            Chưa có bài viết nào được tạo. Vui lòng liên hệ giáo viên hoặc quay lại sau khi bài học có bài tập viết được xuất bản.
          </p>
        </div>
      </div>
    );
  }

  const prompt = latestWrite.prompt;
  const wordCountGuidance = latestWrite.wordCountGuidance ?? 150;
  const writeId = latestWrite.id;

  // Nếu user đã nộp bài cho write này trước đó, restore lại analysis.
  const lastSubmission = await db.query.writingSubmission.findFirst({
    where: and(
      eq(writingSubmission.userId, userId),
      eq(writingSubmission.writeId, writeId),
    ),
    orderBy: [desc(writingSubmission.createdAt)],
  });

  const initialAnalysis = lastSubmission ? parseFeedback(lastSubmission.aiFeedback) : null;
  const initialContent = lastSubmission?.content ?? "";

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Trợ lý AI Writing</h1>
        <p className="text-sm text-slate-500">
          Chỉ ra lỗi sai và gợi ý sửa đổi đúng cho bài viết tiếng Anh của bạn.
        </p>
      </div>
      <WritingAssistantClient
        writeId={writeId}
        prompt={prompt}
        wordCountGuidance={wordCountGuidance}
        initialAnalysis={initialAnalysis}
        initialContent={initialContent}
      />
    </div>
  );
}
