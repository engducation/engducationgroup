import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { packageTypeEnum, type PackageType } from "./admin";

// ─── Package Pricing ─────────────────────────────────────────────────────────
// Bảng cho phép admin ghi đè giá mặc định của từng gói.
// Nếu không có record nào cho 1 packageType → dùng PACKAGE_PRICES mặc định.

export const packagePricing = pgTable(
  "package_pricing",
  {
    // MONTHLY | 6_MONTH | YEAR
    packageType: varchar("package_type", { length: 20 })
      .$type<PackageType>()
      .primaryKey(),
    // Giá hiện tại (sau khi admin chỉnh sửa hoặc áp dụng discount)
    currentPrice: integer("current_price").notNull(),
    // Giá gốc mặc định (tham khảo, không thay đổi)
    basePrice: integer("base_price").notNull(),
    // % giảm giá hiện tại (0 = không giảm)
    discountPercent: integer("discount_percent")
      .default(0)
      .notNull()
      .$defaultFn(() => 0),
    // Label tùy chỉnh (null = dùng mặc định từ PACKAGE_LABELS)
    customLabel: varchar("custom_label", { length: 100 }),
    // Mô tả tùy chỉnh
    customDescription: text("custom_description"),
    // Admin đã disable gói này không (không hiển thị trên UI)
    isEnabled: integer("is_enabled").default(1).notNull(),
    // Thời điểm áp dụng discount bắt đầu (null = đang áp dụng)
    discountStartsAt: timestamp("discount_starts_at"),
    // Thời điểm discount kết thúc (null = không có ngày kết thúc)
    discountEndsAt: timestamp("discount_ends_at"),
    // Admin note (ghi chú nội bộ)
    adminNote: text("admin_note"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("package_pricing_enabled_idx").on(table.isEnabled),
  ],
);

// ─── Vouchers ───────────────────────────────────────────────────────────────
// Mã giảm giá mà admin tạo để học viên sử dụng khi thanh toán.

export const voucherTypeEnum = ["PERCENTAGE", "FIXED"] as const;
export type VoucherType = (typeof voucherTypeEnum)[number];

export const voucher = pgTable(
  "voucher",
  {
    id: text("id").primaryKey(),
    // Mã voucher (VD: "SUMMER2024", "GIAM20")
    code: varchar("code", { length: 50 }).notNull().unique(),
    // Loại giảm: PERCENTAGE (%) hoặc FIXED (số tiền cố định VND)
    type: varchar("type", { length: 20 }).$type<VoucherType>().notNull(),
    // Giá trị giảm (VD: 10 = 10% hoặc 50000 = giảm 50K VND)
    value: integer("value").notNull(),
    // Giá trị giảm tối đa (chỉ áp dụng cho PERCENTAGE, null = không giới hạn)
    maxDiscount: integer("max_discount"),
    // Số lần sử dụng tối đa (null = không giới hạn)
    maxUsage: integer("max_usage"),
    // Số lần đã sử dụng
    usedCount: integer("used_count").default(0).notNull(),
    // Giá trị đơn hàng tối thiểu để áp dụng voucher
    minOrderAmount: integer("min_order_amount").default(0).notNull(),
    // Áp dụng cho những packageType nào (null = tất cả)
    applicablePackages: text("applicable_packages"), // JSON array: ["MONTHLY", "6_MONTH"]
    // Voucher có đang active không
    isActive: integer("is_active").default(1).notNull(),
    // Ngày bắt đầu (null = bắt đầu ngay)
    startsAt: timestamp("starts_at"),
    // Ngày kết thúc (null = không hết hạn)
    expiresAt: timestamp("expires_at"),
    // Mô tả/điều kiện sử dụng
    description: text("description"),
    // Admin note
    adminNote: text("admin_note"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("voucher_code_idx").on(table.code),
    index("voucher_active_idx").on(table.isActive),
    index("voucher_expires_idx").on(table.expiresAt),
  ],
);

// ─── Voucher Usage Log ─────────────────────────────────────────────────────
// Lưu vết việc sử dụng voucher để tránh reuse và audit.

export const voucherUsage = pgTable(
  "voucher_usage",
  {
    id: text("id").primaryKey(),
    voucherId: text("voucher_id")
      .notNull()
      .references(() => voucher.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderId: text("order_id"),
    // Số tiền được giảm khi sử dụng voucher này
    discountAmount: integer("discount_amount").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("voucher_usage_voucher_idx").on(table.voucherId),
    index("voucher_usage_user_idx").on(table.userId),
    index("voucher_usage_order_idx").on(table.orderId),
  ],
);

// ─── Relations ─────────────────────────────────────────────────────────────

export const packagePricingRelations = relations(packagePricing, () => ({}));

export const voucherRelations = relations(voucher, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [voucher.createdBy],
    references: [user.id],
  }),
  usages: many(voucherUsage),
}));

export const voucherUsageRelations = relations(voucherUsage, ({ one }) => ({
  voucher: one(voucher, {
    fields: [voucherUsage.voucherId],
    references: [voucher.id],
  }),
  user: one(user, {
    fields: [voucherUsage.userId],
    references: [user.id],
  }),
}));

// Re-export types
export { packageTypeEnum };
