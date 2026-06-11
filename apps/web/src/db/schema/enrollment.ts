import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { course } from "./learning-content";

// ─── Enrollment ──────────────────────────────────────────────────────────────

export const enrollment = pgTable(
  "enrollment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("enrollment_user_idx").on(table.userId),
    index("enrollment_course_idx").on(table.courseId),
    uniqueIndex("enrollment_unique").on(table.userId, table.courseId),
  ],
);

// ─── Transaction Log ──────────────────────────────────────────────────────────

export const transactionStatusEnum = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"] as const;
export type TransactionStatus = (typeof transactionStatusEnum)[number];

export const transactionLog = pgTable(
  "transaction_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    transactionCode: varchar("transaction_code", { length: 50 }).notNull().unique(),
    packageType: varchar("package_type", { length: 20 }).notNull(),
    amount: integer("amount").notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("BANK_TRANSFER"),
    paymentContent: text("payment_content").notNull(),
    status: varchar("status", { length: 20 })
      .$type<TransactionStatus>()
      .default("COMPLETED")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("transaction_log_user_idx").on(table.userId),
    index("transaction_log_code_idx").on(table.transactionCode),
    index("transaction_log_status_idx").on(table.status),
    index("transaction_log_created_idx").on(table.createdAt),
  ],
);

// ─── Revenue Log ─────────────────────────────────────────────────────────────

export const revenueLog = pgTable(
  "revenue_log",
  {
    id: text("id").primaryKey(),
    date: date("date").notNull(),
    category: varchar("category", { length: 50 }).notNull().default("PREMIUM_SUBSCRIPTION"),
    amount: integer("amount").notNull().default(0),
    currency: varchar("currency", { length: 10 }).notNull().default("VND"),
    transactionCount: integer("transaction_count").notNull().default(0),
    packageBreakdown: jsonb("package_breakdown").$type<Record<string, number>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("revenue_log_date_category_idx").on(table.date, table.category),
    index("revenue_log_date_idx").on(table.date),
  ],
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const enrollmentRelations = relations(enrollment, ({ one }) => ({
  user: one(user, {
    fields: [enrollment.userId],
    references: [user.id],
  }),
  course: one(course, {
    fields: [enrollment.courseId],
    references: [course.id],
  }),
}));

export const transactionLogRelations = relations(transactionLog, ({ one }) => ({
  user: one(user, {
    fields: [transactionLog.userId],
    references: [user.id],
  }),
}));

export const revenueLogRelations = relations(revenueLog, ({ one }) => ({
}));
