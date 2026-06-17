import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { packageTypeEnum, type PackageType } from "./admin";

// ─── Orders ──────────────────────────────────────────────────────────────────
// Lưu vết yêu cầu nâng cấp gói do học viên tạo ra trên giao diện SePay.
// Bảng này song song với `package_order` (luồng admin manual) — `orders` là
// canonical cho luồng SePay webhook.

export const orderStatusEnum = ["PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;
export type OrderStatus = (typeof orderStatusEnum)[number];

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Mã đơn hàng duy nhất, ví dụ: "ENGPRMAB12CD34".
    // Field này được nhúng vào nội dung chuyển khoản để SePay trích xuất ngược
    // lại khi bắn webhook. UNIQUE để tra cứu O(log n) khi webhook đến.
    orderCode: varchar("order_code", { length: 30 }).notNull().unique(),
    packageType: varchar("package_type", { length: 20 })
      .$type<PackageType>()
      .notNull(),
    amount: integer("amount").notNull(),
    status: varchar("status", { length: 20 })
      .$type<OrderStatus>()
      .default("PENDING")
      .notNull(),
    paymentMethod: varchar("payment_method", { length: 50 })
      .default("SEPAY")
      .notNull(),
    // Thời điểm đơn hết hạn (mặc định 15 phút sau khi tạo). Cron job sẽ
    // đánh EXPIRED nếu quá thời gian mà vẫn PENDING.
    expiresAt: timestamp("expires_at").notNull(),
    // Sau khi SUCCESS, lưu lại thời điểm hết hạn Premium tương ứng để tra cứu.
    // Lưu ý: đây là expiresAt của USER, không phải của order — order chỉ tồn
    // tại để audit. expiresAt của order vẫn là field `expiresAt` ở trên.
    subscriptionExpiresAt: timestamp("subscription_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
    index("orders_expires_idx").on(table.expiresAt),
  ],
);

// ─── SePay Transactions ──────────────────────────────────────────────────────
// Lưu vết dữ liệu thô từ webhook SePay. Trường `id` chính là `id` giao dịch
// mà SePay truyền sang (vd: 92704) và được đánh UNIQUE → chống replay /
// idempotency.

export const sepayTransferTypeEnum = ["in", "out"] as const;
export type SepayTransferType = (typeof sepayTransferTypeEnum)[number];

export const sepayTransactions = pgTable(
  "sepay_transactions",
  {
    // = SePay payload.id. UNIQUE = PRIMARY KEY → idempotency guard.
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderCode: varchar("order_code", { length: 30 }).notNull(),
    amountReceived: integer("amount_received").notNull(),
    gateway: varchar("gateway", { length: 50 }),
    transactionDate: timestamp("transaction_date"),
    transferType: varchar("transfer_type", { length: 10 }).$type<SepayTransferType>(),
    accountNumber: varchar("account_number", { length: 30 }),
    referenceCode: varchar("reference_code", { length: 100 }),
    description: text("description"),
    content: text("content"),
    // Toàn bộ JSON gốc SePay gửi sang, dùng cho audit / replay debug.
    rawPayload: jsonb("raw_payload").notNull(),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
  },
  (table) => [
    index("sepay_tx_order_idx").on(table.orderId),
    index("sepay_tx_order_code_idx").on(table.orderCode),
    index("sepay_tx_received_idx").on(table.receivedAt),
  ],
);

// ─── Payment Code Patterns ───────────────────────────────────────────────────
//
// Danh sách các mẫu nội dung chuyển khoản mà SePay được cấu hình để nhận diện.
// Mỗi pattern là 1 chuỗi ngắn (vd: "ENGPRM", "DAY", "MONTH", "YEAR"). Khi SePay
// nhận được giao dịch, nó sẽ kiểm tra nội dung CK có bắt đầu bằng pattern nào
// không; nếu không khớp pattern nào → SePay bỏ qua (không gửi webhook).
//
// Lưu DB (thay vì hard-code env) để:
//   - Admin chỉnh pattern mà KHÔNG cần redeploy
//   - Dễ audit / xem pattern nào đang active
//   - Cho phép soft-disable pattern cũ thay vì xóa cứng
//
// Lưu ý: `code` rất ngắn, đây là PREFIX để SePay match nhanh, KHÔNG phải full
// orderCode. Full orderCode sinh ra sẽ là `<pattern><random>` (vd "ENGPRMAB12CD34").
// Khi webhook về, parser cũng dựa trên các pattern này để trích xuất orderCode.

export const paymentCodePatterns = pgTable(
  "payment_code_patterns",
  {
    // Mã ngắn (PREFIX) SePay dùng để nhận diện. UNIQUE, length 3-10.
    // VD: "ENGPRM", "DAY", "MONTH", "YEAR", "PRM", "VIP".
    code: varchar("code", { length: 10 }).primaryKey(),
    // Mô tả nội bộ cho admin biết pattern này dùng để làm gì.
    description: text("description"),
    // Độ dài phần random sinh ra sau prefix (vd: 8 → "ENGPRM" + 8 ký tự).
    // Cho phép mỗi pattern có độ dài khác nhau để dễ đọc khi CK.
    randomLength: integer("random_length").default(8).notNull(),
    // Pattern này còn được dùng để sinh mã đơn mới hay không. Admin có thể
    // soft-disable mà không xóa (giữ audit cho orders cũ).
    isActive: integer("is_active").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_code_patterns_active_idx").on(table.isActive),
  ],
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  transactions: many(sepayTransactions),
}));

export const sepayTransactionsRelations = relations(sepayTransactions, ({ one }) => ({
  order: one(orders, {
    fields: [sepayTransactions.orderId],
    references: [orders.id],
  }),
}));

// Re-export để tiện cho callers (admin schema đã export, nhưng cũng tiện nếu ai
// chỉ import từ payment schema).
export { packageTypeEnum };
