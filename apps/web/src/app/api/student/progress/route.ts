import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { studentProgress, quizAttempt, writingSubmission, quiz } from "@/db/schema/learning-content";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) {
    return Response.json({ error: "lessonId is required" }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [progress] = await db
      .select()
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.userId, session.user.id),
          eq(studentProgress.lessonId, lessonId)
        )
      );

    return Response.json({
      progress: progress
        ? {
            readCompleted: progress.readCompleted,
            writeCompleted: progress.writeCompleted,
            quizCompleted: progress.quizCompleted,
            videoCompleted: progress.videoCompleted,
            vocabularyReviewed: progress.vocabularyReviewed,
            completedAt: progress.completedAt?.toISOString() || null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return Response.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { lessonId, type, score, totalQuestions, answers, content } = body;

    if (!lessonId || !type) {
      return Response.json({ error: "lessonId and type are required" }, { status: 400 });
    }

    // Check if progress record exists
    const [existingProgress] = await db
      .select()
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.userId, session.user.id),
          eq(studentProgress.lessonId, lessonId)
        )
      );

    const now = new Date();
    let updatedFields: Record<string, unknown> = { updatedAt: now };

    // Update based on type
    switch (type) {
      case "video":
        updatedFields.videoCompleted = true;
        break;
      case "read":
        updatedFields.readCompleted = true;
        break;
      case "quiz":
        if (score !== undefined && totalQuestions !== undefined) {
          updatedFields.quizCompleted = true;
          // Record quiz attempt
          const quizRecord = await db.query.quiz.findFirst({
            where: eq(quiz.lessonId, lessonId),
          });
          if (quizRecord) {
            await db.insert(quizAttempt).values({
              id: nanoid(),
              userId: session.user.id,
              quizId: quizRecord.id,
              score,
              totalQuestions,
              answers: JSON.stringify(answers || []),
            });
          }
        }
        break;
      case "writing":
        if (content !== undefined) {
          updatedFields.writeCompleted = true;
          // Record writing submission
          // Note: This would need the writeId from the lesson
        }
        break;
      case "vocabulary":
        updatedFields.vocabularyReviewed = true;
        break;
      default:
        return Response.json({ error: "Invalid type" }, { status: 400 });
    }

    // Check if all required components are completed
    const isAllCompleted =
      updatedFields.readCompleted &&
      updatedFields.writeCompleted &&
      updatedFields.quizCompleted &&
      updatedFields.videoCompleted &&
      updatedFields.vocabularyReviewed;

    if (isAllCompleted) {
      updatedFields.completedAt = now;
    }

    if (existingProgress) {
      // Update existing record
      await db
        .update(studentProgress)
        .set(updatedFields)
        .where(eq(studentProgress.id, existingProgress.id));
    } else {
      // Create new record
      await db.insert(studentProgress).values({
        id: nanoid(),
        userId: session.user.id,
        lessonId,
        readCompleted: updatedFields.readCompleted as boolean || false,
        writeCompleted: updatedFields.writeCompleted as boolean || false,
        quizCompleted: updatedFields.quizCompleted as boolean || false,
        videoCompleted: updatedFields.videoCompleted as boolean || false,
        vocabularyReviewed: updatedFields.vocabularyReviewed as boolean || false,
        completedAt: updatedFields.completedAt as Date | undefined,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating progress:", error);
    return Response.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
