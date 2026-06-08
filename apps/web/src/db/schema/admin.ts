import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { write, writingSubmission } from "./learning-content";

// ─── Subscription Package Enum ───────────────────────────────────────────────

export const packageTypeEnum = ["MONTHLY", "6_MONTH", "YEAR"] as const;
export type PackageType = (typeof packageTypeEnum)[number];

export const PACKAGE_DURATIONS: Record<PackageType, number> = {
  MONTHLY: 30,
  "6_MONTH": 180,
  YEAR: 365,
};

export const PACKAGE_PRICES: Record<PackageType, number> = {
  MONTHLY: 49000,
  "6_MONTH": 269000,
  YEAR: 499000,
};

export const PACKAGE_LABELS: Record<PackageType, string> = {
  MONTHLY: "Monthly Package (30 ngày)",
  "6_MONTH": "6-Month Package (180 ngày)",
  YEAR: "1-Year Package (365 ngày)",
};

// ─── 1. AI Prompts ──────────────────────────────────────────────────────────

export const aiPrompt = pgTable("ai_prompt", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  temperature: real("temperature").default(0.7).notNull(),
  maxTokens: integer("max_tokens").default(1000).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── 2. Package Order (Subscription Purchase) ────────────────────────────────

export const packageOrder = pgTable("package_order", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  packageType: varchar("package_type", { length: 20 })
    .$type<PackageType>()
    .notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, SUCCESS, FAILED
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  rejectionReason: text("rejection_reason"),
  adminId: text("admin_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── 3. Subscription Audit Log (Append-Only) ───────────────────────────────

export const subscriptionAuditLog = pgTable("subscription_audit_log", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  userId: text("user_id").notNull(),
  packageType: varchar("package_type", { length: 20 })
    .$type<PackageType>()
    .notNull(),
  amount: integer("amount").notNull(),
  oldStatus: varchar("old_status", { length: 20 }).notNull(),
  newStatus: varchar("new_status", { length: 20 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  adminId: text("admin_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── 5. System Settings ─────────────────────────────────────────────────────

export const systemSetting = pgTable("system_setting", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── 6. User AI Daily Usage ─────────────────────────────────────────────────

export const userAiUsage = pgTable("user_ai_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  usageDate: varchar("usage_date", { length: 10 }).notNull(), // YYYY-MM-DD
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── 7. AI API Log (for Analytics Dashboard) ────────────────────────────────

export const aiApiLog = pgTable("ai_api_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  writeId: text("write_id"),
  promptId: text("prompt_id"),
  promptTokens: integer("prompt_tokens").default(0).notNull(),
  completionTokens: integer("completion_tokens").default(0).notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  costUsd: real("cost_usd").default(0).notNull(),
  isError: boolean("is_error").default(false).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── 8. Writing Review Tickets (Khiếu nại) ───────────────────────────────────

export const writingReviewTicket = pgTable("writing_review_ticket", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => writingSubmission.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  userMessage: text("user_message"),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, RESOLVED
  teacherScore: integer("teacher_score"),
  teacherFeedback: text("teacher_feedback"),
  assignedTeacherId: text("assigned_teacher_id").references(() => user.id, {
    onDelete: "set null",
  }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── 9. Helpdesk Ticket ─────────────────────────────────────────────────────

export const supportTicket = pgTable("support_ticket", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // ACCOUNT, VIDEO, QUIZ, SYSTEM_ERROR
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("OPEN").notNull(), // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  assigneeId: text("assignee_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const supportTicketMessage = pgTable("support_ticket_message", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTicket.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── 10. Admin Audit Logs (Append-Only) ───────────────────────────────────

export const adminAuditLog = pgTable("admin_audit_log", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  adminEmail: varchar("admin_email", { length: 255 }).notNull(),
  adminRole: varchar("admin_role", { length: 50 }).notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "BAN_USER", "APPROVE_ORDER", "CREATE_PROMPT"
  oldPayload: text("old_payload"), // JSON string
  newPayload: text("new_payload"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ─────────────────────────────────────────────────────────────

export const packageOrderRelations = relations(packageOrder, ({ one }) => ({
  user: one(user, {
    fields: [packageOrder.userId],
    references: [user.id],
  }),
  admin: one(user, {
    fields: [packageOrder.adminId],
    references: [user.id],
  }),
}));

export const subscriptionAuditLogRelations = relations(subscriptionAuditLog, ({ one }) => ({
  user: one(user, {
    fields: [subscriptionAuditLog.userId],
    references: [user.id],
  }),
}));

export const userAiUsageRelations = relations(userAiUsage, ({ one }) => ({
  user: one(user, {
    fields: [userAiUsage.userId],
    references: [user.id],
  }),
}));

export const aiApiLogRelations = relations(aiApiLog, ({ one }) => ({
  user: one(user, {
    fields: [aiApiLog.userId],
    references: [user.id],
  }),
}));

export const writingReviewTicketRelations = relations(writingReviewTicket, ({ one }) => ({
  submission: one(writingSubmission, {
    fields: [writingReviewTicket.submissionId],
    references: [writingSubmission.id],
  }),
  user: one(user, {
    fields: [writingReviewTicket.userId],
    references: [user.id],
  }),
  teacher: one(user, {
    fields: [writingReviewTicket.assignedTeacherId],
    references: [user.id],
  }),
}));

export const supportTicketRelations = relations(supportTicket, ({ one, many }) => ({
  user: one(user, {
    fields: [supportTicket.userId],
    references: [user.id],
  }),
  assignee: one(user, {
    fields: [supportTicket.assigneeId],
    references: [user.id],
  }),
  messages: many(supportTicketMessage),
}));

export const supportTicketMessageRelations = relations(supportTicketMessage, ({ one }) => ({
  ticket: one(supportTicket, {
    fields: [supportTicketMessage.ticketId],
    references: [supportTicket.id],
  }),
  sender: one(user, {
    fields: [supportTicketMessage.senderId],
    references: [user.id],
  }),
}));

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  admin: one(user, {
    fields: [adminAuditLog.adminId],
    references: [user.id],
  }),
}));
