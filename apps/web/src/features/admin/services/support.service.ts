import { db } from "@/db";
import { supportTicket, supportTicketMessage, writingReviewTicket, user, writingSubmission } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Writing Review Tickets

export interface CreateReviewTicketInput {
  submissionId: string;
  userId: string;
  message: string;
}

export async function createReviewTicket(input: CreateReviewTicketInput) {
  const id = nanoid();
  await db.insert(writingReviewTicket).values({
    id,
    submissionId: input.submissionId,
    userId: input.userId,
    userMessage: input.message,
    status: "PENDING",
    createdAt: new Date(),
  });
  return id;
}

export async function getReviewTickets() {
  return db
    .select({
      id: writingReviewTicket.id,
      submissionId: writingReviewTicket.submissionId,
      userMessage: writingReviewTicket.userMessage,
      status: writingReviewTicket.status,
      teacherScore: writingReviewTicket.teacherScore,
      teacherFeedback: writingReviewTicket.teacherFeedback,
      createdAt: writingReviewTicket.createdAt,
      studentName: user.name,
      studentEmail: user.email,
      originalText: writingSubmission.content,
      aiFeedback: writingSubmission.aiFeedback,
      aiScore: writingSubmission.aiScore,
    })
    .from(writingReviewTicket)
    .innerJoin(user, eq(writingReviewTicket.userId, user.id))
    .innerJoin(writingSubmission, eq(writingReviewTicket.submissionId, writingSubmission.id))
    .orderBy(desc(writingReviewTicket.createdAt));
}

export async function resolveWritingReview(
  ticketId: string,
  score: number,
  feedback: string,
  teacherId: string,
) {
  const ticket = await db.query.writingReviewTicket.findFirst({
    where: eq(writingReviewTicket.id, ticketId),
  });

  if (!ticket) throw new Error("Yêu cầu khiếu nại không tồn tại");

  await db.transaction(async (tx) => {
    await tx
      .update(writingReviewTicket)
      .set({
        status: "RESOLVED",
        teacherScore: score,
        teacherFeedback: feedback,
        assignedTeacherId: teacherId,
        resolvedAt: new Date(),
      })
      .where(eq(writingReviewTicket.id, ticketId));

    await tx
      .update(writingSubmission)
      .set({
        teacherScore: score,
        teacherFeedback: feedback,
        status: "RESOLVED",
        updatedAt: new Date(),
      })
      .where(eq(writingSubmission.id, ticket.submissionId));
  });

  return { success: true };
}

// Support Tickets

export interface CreateSupportTicketInput {
  userId: string;
  title: string;
  category: "ACCOUNT" | "VIDEO" | "QUIZ" | "SYSTEM_ERROR";
  description: string;
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const id = nanoid();
  await db.insert(supportTicket).values({
    id,
    userId: input.userId,
    title: input.title,
    category: input.category,
    description: input.description,
    status: "OPEN",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function getSupportTickets() {
  return db
    .select({
      id: supportTicket.id,
      title: supportTicket.title,
      category: supportTicket.category,
      description: supportTicket.description,
      status: supportTicket.status,
      createdAt: supportTicket.createdAt,
      updatedAt: supportTicket.updatedAt,
      studentName: user.name,
      studentEmail: user.email,
      assigneeName: sql<string>`(select name from "user" where id = ${supportTicket.assigneeId})`,
    })
    .from(supportTicket)
    .innerJoin(user, eq(supportTicket.userId, user.id))
    .orderBy(desc(supportTicket.updatedAt));
}

export async function getSupportTicketDetails(ticketId: string) {
  const ticket = await db
    .select({
      id: supportTicket.id,
      title: supportTicket.title,
      category: supportTicket.category,
      description: supportTicket.description,
      status: supportTicket.status,
      userId: supportTicket.userId,
      assigneeId: supportTicket.assigneeId,
      createdAt: supportTicket.createdAt,
      studentName: user.name,
      studentEmail: user.email,
    })
    .from(supportTicket)
    .innerJoin(user, eq(supportTicket.userId, user.id))
    .where(eq(supportTicket.id, ticketId));

  if (!ticket[0]) return null;

  const messages = await db
    .select({
      id: supportTicketMessage.id,
      message: supportTicketMessage.message,
      createdAt: supportTicketMessage.createdAt,
      senderName: user.name,
      senderRole: user.role,
    })
    .from(supportTicketMessage)
    .innerJoin(user, eq(supportTicketMessage.senderId, user.id))
    .where(eq(supportTicketMessage.ticketId, ticketId))
    .orderBy(supportTicketMessage.createdAt);

  return {
    ...ticket[0],
    messages,
  };
}

export async function updateTicketStatus(ticketId: string, status: string, assigneeId?: string) {
  await db
    .update(supportTicket)
    .set({
      status: status as any,
      ...(assigneeId !== undefined ? { assigneeId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(supportTicket.id, ticketId));
  return { success: true };
}

export async function replySupportTicket(ticketId: string, senderId: string, textMessage: string) {
  const id = nanoid();
  await db.transaction(async (tx) => {
    await tx.insert(supportTicketMessage).values({
      id,
      ticketId,
      senderId,
      message: textMessage,
      createdAt: new Date(),
    });

    const sender = await tx.query.user.findFirst({
      where: eq(user.id, senderId),
    });

    const ticket = await tx.query.supportTicket.findFirst({
      where: eq(supportTicket.id, ticketId),
    });

    if (ticket && ticket.status === "OPEN" && sender && sender.role === "admin") {
      await tx
        .update(supportTicket)
        .set({
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        })
        .where(eq(supportTicket.id, ticketId));
    }
  });

  return { success: true };
}
