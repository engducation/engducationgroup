import { z } from "zod";

// ─── Package & Order Schemas ────────────────────────────────────────────────

export const PACKAGE_TYPES = ["MONTHLY", "6_MONTH", "YEAR"] as const;
export const packageTypeSchema = z.enum(PACKAGE_TYPES);
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const ORDER_STATUSES = ["PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SEPAY_TRANSFER_TYPES = ["in", "out"] as const;
export const sepayTransferTypeSchema = z.enum(SEPAY_TRANSFER_TYPES);

// ─── Create Order (Student → Server) ────────────────────────────────────────

export const createOrderSchema = z.object({
  packageType: packageTypeSchema,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ─── Order Response (Server → Student) ──────────────────────────────────────
// Minimal payload theo nguyên tắc "Minimize Serialization at RSC Boundaries"
// (vercel-react-best-practices §3.6). Không trả cả order object.

export const orderSummarySchema = z.object({
  id: z.string(),
  orderCode: z.string(),
  paymentMemo: z.string(),    // 16-char memo (EP_<12 chars>), dùng cho webhook lookup
  packageType: packageTypeSchema,
  packageLabel: z.string(),
  amount: z.number().int().positive(),
  status: orderStatusSchema,
  expiresAt: z.iso.datetime(),
  subscriptionExpiresAt: z.iso.datetime().optional().nullable(), // Chỉ có khi SUCCESS
  createdAt: z.iso.datetime(),
  qrUrl: z.url(),
  bank: z.object({
    accountNumber: z.string(),
    bankCode: z.string(),
    accountName: z.string(),
  }),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

// ─── SePay Webhook Payload ──────────────────────────────────────────────────
// Theo tài liệu Test mode: https://developer.sepay.vn/vi/tien-ich-khac/test-mode/mo-phong-giao-dich
// Một số trường nullable tuỳ gateway.

export const sepayWebhookPayloadSchema = z.object({
  gateway: z.string().min(1),
  transactionDate: z.string().min(1),                 // "2025-01-15 10:30:00"
  accountNumber: z.string().min(1),
  subAccount: z.string().nullable().optional(),
  code: z.string().nullable().optional(),              // Mã đơn hàng (orderCode) - có thể null
  content: z.string().min(1),                          // Toàn bộ nội dung CK
  transferType: sepayTransferTypeSchema,
  description: z.string().min(1),
  transferAmount: z.number().int().positive(),
  referenceCode: z.string().nullable().optional(),
  accumulated: z.number().int().nonnegative().optional(),
  id: z.union([z.string(), z.number()]).transform(String), // SePay id - ép string để làm PK
});
export type SepayWebhookPayload = z.infer<typeof sepayWebhookPayloadSchema>;

// ─── Test Mode Simulate (Dev only) ──────────────────────────────────────────

export const simulateWebhookSchema = z.object({
  // Cho phép tuỳ biến các trường trong payload để test edge cases
  paymentMemo: z.string().min(1).optional(),   // Ưu tiên dùng paymentMemo (16 chars)
  orderCode: z.string().min(1).optional(),    // Fallback cho orders cũ (trước khi có paymentMemo)
  amount: z.number().int().positive().optional(),
  gateway: z.string().min(1).default("MBBank"),
  transactionDate: z.string().min(1).optional(),
  transferType: sepayTransferTypeSchema.default("in"),
  accountNumber: z.string().min(1).optional(),
  description: z.string().min(1).default("Test giao dich SePay"),
  referenceCode: z.string().nullable().optional(),
});
export type SimulateWebhookInput = z.infer<typeof simulateWebhookSchema>;

// ─── Webhook Result (Internal) ──────────────────────────────────────────────

export type WebhookProcessResult =
  | { kind: "ok"; orderId: string; alreadyProcessed: boolean }
  | { kind: "ip_not_allowed"; clientIp: string }
  | { kind: "signature_invalid" }
  | { kind: "order_not_found"; paymentMemo: string }
  | { kind: "order_already_settled"; orderId: string }
  | { kind: "order_expired"; orderId: string; expiredAt: string }
  | { kind: "amount_mismatch"; expected: number; received: number; orderId: string }
  | { kind: "invalid_payload"; error: string };
