/**
 * Student Support Ticket Service
 * Handles support ticket submission and management for students
 */

import { db } from "@/db";
import { supportTicket, supportTicketMessage } from "@/db/schema/admin";
import { user } from "@/db/schema/auth";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export type TicketCategory = "ACCOUNT" | "VIDEO" | "QUIZ" | "SYSTEM_ERROR" | "PAYMENT" | "OTHER";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface CreateSupportTicketInput {
  userId: string;
  title: string;
  category: TicketCategory;
  description: string;
}

export interface SupportTicketResponse {
  id: string;
  title: string;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessageResponse {
  id: string;
  message: string;
  senderName: string;
  senderRole: string;
  createdAt: Date;
}

export interface TicketWithMessages extends SupportTicketResponse {
  messages: TicketMessageResponse[];
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(input: CreateSupportTicketInput): Promise<SupportTicketResponse> {
  const id = nanoid();
  const now = new Date();

  await db.insert(supportTicket).values({
    id,
    userId: input.userId,
    title: input.title,
    category: input.category,
    description: input.description,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  });

  const [ticket] = await db
    .select()
    .from(supportTicket)
    .where(eq(supportTicket.id, id));

  return {
    id: ticket.id,
    title: ticket.title,
    category: ticket.category as TicketCategory,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

/**
 * Get all tickets for a user
 */
export async function getUserTickets(userId: string): Promise<SupportTicketResponse[]> {
  const tickets = await db
    .select()
    .from(supportTicket)
    .where(eq(supportTicket.userId, userId))
    .orderBy(desc(supportTicket.updatedAt));

  return tickets.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category as TicketCategory,
    description: t.description,
    status: t.status as TicketStatus,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

/**
 * Get ticket details with messages
 */
export async function getTicketDetails(ticketId: string, userId: string): Promise<TicketWithMessages | null> {
  const [ticket] = await db
    .select()
    .from(supportTicket)
    .where(eq(supportTicket.id, ticketId));

  // Verify ticket belongs to user
  if (!ticket || ticket.userId !== userId) {
    return null;
  }

  const ticketMessages = await db
    .select({
      id: supportTicketMessage.id,
      message: supportTicketMessage.message,
      senderId: supportTicketMessage.senderId,
      createdAt: supportTicketMessage.createdAt,
    })
    .from(supportTicketMessage)
    .where(eq(supportTicketMessage.ticketId, ticketId))
    .orderBy(supportTicketMessage.createdAt);

  // Get sender info for each message
  const messagesWithSender: TicketMessageResponse[] = await Promise.all(
    ticketMessages.map(async (m) => {
      const [sender] = await db
        .select({ name: user.name, role: user.role })
        .from(user)
        .where(eq(user.id, m.senderId))
        .limit(1);

      return {
        id: m.id,
        message: m.message,
        senderName: sender?.name ?? "Unknown",
        senderRole: sender?.role ?? "user",
        createdAt: m.createdAt,
      };
    })
  );

  return {
    id: ticket.id,
    title: ticket.title,
    category: ticket.category as TicketCategory,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    messages: messagesWithSender,
  };
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(ticketId: string, senderId: string, messageText: string): Promise<void> {
  const id = nanoid();
  const now = new Date();

  await db.insert(supportTicketMessage).values({
    id,
    ticketId,
    senderId,
    message: messageText,
    createdAt: now,
  });

  // Update ticket's updatedAt
  await db
    .update(supportTicket)
    .set({ updatedAt: now })
    .where(eq(supportTicket.id, ticketId));
}

/**
 * Get ticket statistics for a user
 */
export async function getUserTicketStats(userId: string) {
  const tickets = await db
    .select()
    .from(supportTicket)
    .where(eq(supportTicket.userId, userId));

  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED").length;
  const closed = tickets.filter((t) => t.status === "CLOSED").length;

  return {
    total: tickets.length,
    open,
    resolved,
    closed,
  };
}
