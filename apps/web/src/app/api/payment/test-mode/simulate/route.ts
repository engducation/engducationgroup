import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { simulateWebhookSchema } from "@/features/payment/types/schemas";
import {
  isSepayTransactionProcessed,
  listPendingOrders,
} from "@/features/payment/services/order.service";
import {
  processSepayWebhook,
} from "@/features/payment/services/sepay-webhook.service";
import { nanoid } from "nanoid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payment/test-mode/simulate
//
// Chỉ hoạt động khi NODE_ENV !== "production" (chống lộ test endpoint ở prod).
// Cần auth student. Dùng để verify end-to-end flow mà không cần SePay dashboard.
//
// Nếu body không truyền paymentMemo/orderCode: tự động lấy order PENDING gần nhất của user.
// Nếu body không truyền amount: dùng đúng amount của order đó.
export async function POST(request: Request) {
  if (env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Test mode không khả dụng ở production" },
      { status: 404 },
    );
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = simulateWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Body không hợp lệ", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const { getOrderByCode } = await import("@/features/payment/services/order.service");

    // Resolve order: ưu tiên paymentMemo, fallback orderCode
    let orderRow = input.paymentMemo
      ? await getOrderByMemoForTest(input.paymentMemo)
      : null;

    if (!orderRow && input.orderCode) {
      orderRow = await getOrderByCode(input.orderCode);
    }

    // Nếu không truyền gì, lấy order PENDING gần nhất của user
    if (!orderRow) {
      const pending = await listPendingOrders(100);
      const userPending = pending.find((o) => o.userId === session.user.id);
      if (!userPending) {
        return NextResponse.json(
          {
            success: false,
            error: "Không tìm thấy đơn PENDING nào của user. Hãy tạo đơn trước.",
          },
          { status: 404 },
        );
      }
      orderRow = await getOrderByCode(userPending.orderCode);
    }

    if (!orderRow) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy order" },
        { status: 404 },
      );
    }
    if (orderRow.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Order không thuộc về user hiện tại" },
        { status: 403 },
      );
    }

    const amount = input.amount ?? orderRow.amount;
    if (amount < orderRow.amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount (${amount}) nhỏ hơn order.amount (${orderRow.amount}). Hãy truyền amount chính xác.`,
        },
        { status: 400 },
      );
    }

    // Build SePay-style payload dùng paymentMemo (16 chars, đáng tin cậy)
    const transactionId = String(Date.now()); // unique per test
    const content = `${orderRow.paymentMemo ?? orderRow.orderCode} ${nanoid(4).toLowerCase()}`;
    const payload = {
      gateway: input.gateway,
      transactionDate:
        input.transactionDate ??
        new Date().toISOString().replace("T", " ").slice(0, 19),
      accountNumber: input.accountNumber ?? env.SEPAY_BANK_ACCOUNT,
      subAccount: null,
      code: orderRow.paymentMemo ?? orderRow.orderCode,
      content,
      transferType: input.transferType,
      description: input.description,
      transferAmount: amount,
      referenceCode: input.referenceCode ?? `REF${nanoid(8).toUpperCase()}`,
      accumulated: orderRow.amount * 10,
      id: transactionId,
    };

    // Idempotency: nếu id đã tồn tại, sinh id mới
    if (await isSepayTransactionProcessed(transactionId)) {
      payload.id = `${transactionId}-${nanoid(4)}`;
    }

    const rawBody = JSON.stringify(payload);

    // bypassAuth: true vì đây là test endpoint, không cần verify IP/API key
    const result = await processSepayWebhook({ rawBody, apiKey: null, bypassAuth: true });

    return NextResponse.json({
      success: true,
      data: {
        simulated: payload,
        processResult: result,
      },
    });
  } catch (error) {
    console.error("POST /api/payment/test-mode/simulate error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi server",
      },
      { status: 500 },
    );
  }
}

// Helper: get order by paymentMemo for test
async function getOrderByMemoForTest(paymentMemo: string) {
  const { getOrderByMemo } = await import("@/features/payment/services/order.service");
  return getOrderByMemo(paymentMemo);
}
