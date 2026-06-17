# Payment SePay — Context Tổng Quan

> **Mục đích**: File context để tham chiếu giữa các đoạn chat. Mô tả kiến
> trúc, các quyết định kỹ thuật, file quan trọng, và lịch sử thay đổi của
> hệ thống thanh toán SePay. Khi bắt đầu chat mới về payment, paste file
> này vào đầu để agent nắm context ngay.

---

## 1. Tổng quan nghiệp vụ

Hệ thống cho phép học viên nâng cấp **Premium** bằng cách quét QR ngân hàng
qua cổng SePay. Flow end-to-end:

```
Student tạo order  →  Server sinh orderCode + VietQR URL
                          ↓
       Hiển thị QR trong 15 phút (mặc định)
                          ↓
       Student CK qua app ngân hàng
                          ↓
       SePay nhận biến động số dư → gửi webhook HMAC
                          ↓
       Server verify HMAC → settle order → grant Premium
                          ↓
       Polling client phát hiện SUCCESS → refresh session → redirect
```

### 3 gói thanh toán

| Code | Label | VND | Ngày Premium |
|---|---|---|---|
| `MONTHLY` | Gói 1 Tháng | 49.000 | 30 |
| `6_MONTH` | Gói 6 Tháng | 269.000 | 180 |
| `YEAR` | Gói 1 Năm | 499.000 | 365 |

Định nghĩa tại `src/features/payment/services/vietqr.service.ts`:
- `PACKAGE_PRICES` (single source of truth)
- `PACKAGE_LABELS`
- `PACKAGE_DURATIONS`

---

## 2. Kiến trúc hệ thống

### 2.1. Layer chính

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (Student)                                           │
│  - /upgrade page → chọn gói                                │
│  - /upgrade/[orderId] page → hiển thị QR + polling         │
│  - useOrderStatus hook (poll API mỗi 3s)                   │
└─────────────────────────────────────────────────────────────┘
                          ↓ POST/GET
┌─────────────────────────────────────────────────────────────┐
│  API ROUTES (Next.js App Router)                           │
│  - POST /api/payment/orders         (tạo order)            │
│  - GET  /api/payment/orders         (list orders)          │
│  - GET  /api/payment/orders/[id]    (polling status)       │
│  - POST /api/payment/sepay-webhook  (SePay callback)        │
│  - GET  /api/cron/expire-orders     (cron 5 phút)          │
│  - /api/admin/payment/code-patterns (admin CRUD patterns)  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  SERVICES (src/features/payment/services/)                  │
│  - order.service.ts           (CRUD orders)                │
│  - vietqr.service.ts          (build QR URL)               │
│  - sepay-webhook.service.ts   (xử lý webhook, settle)      │
│  - subscription.service.ts    (grant Premium)              │
│  - order-code-pattern.service.ts (generate/parse orderCode)│
│  - admin-order.service.ts     (admin queries)              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  DATABASE (Neon Postgres + Drizzle ORM)                    │
│  - orders                  (đơn hàng)                      │
│  - sepay_transactions       (audit webhook)                 │
│  - payment_code_patterns   (prefix SePay cho phép)        │
│  - user.subscriptionPlan, expiresAt, role  (Premium state) │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Schema chính

File: `src/db/schema/payment.ts`

```typescript
// orders
{
  id: text PK,
  userId: text FK → user.id,
  orderCode: varchar(30) UNIQUE,   // "DAY12345678"
  packageType: varchar(20),         // "MONTHLY" | "6_MONTH" | "YEAR"
  amount: integer,                  // VND
  status: varchar(20),              // "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED"
  paymentMethod: varchar(50),       // "SEPAY" | "ADMIN_MANUAL"
  expiresAt: timestamp,             // 15 phút sau khi tạo
  subscriptionExpiresAt: timestamp, // set sau khi SUCCESS
  createdAt, updatedAt
}

// payment_code_patterns
{
  code: varchar(10) PK,             // "DAY", "MONTH", "YEAR"
  description: text,
  randomLength: integer DEFAULT 8,  // 6-10 chữ số
  isActive: integer DEFAULT 1,
  createdAt, updatedAt
}

// sepay_transactions (audit)
{
  id: text PK,                      // = SePay payload.id
  orderId FK → orders.id,
  orderCode, amountReceived, gateway, transactionDate,
  transferType, accountNumber, referenceCode, description, content,
  rawPayload: jsonb,
  receivedAt
}
```

---

## 3. OrderCode — Quy tắc sinh & parse

### 3.1. Format

```
orderCode = <PREFIX><RANDOM_NUMBER>
```

- **PREFIX** ∈ `{ DAY, MONTH, YEAR }` — khớp với mã đã khai báo trong
  SePay dashboard (my.sepay.vn → Cài đặt → Mã thanh toán).
- **RANDOM_NUMBER** = số nguyên 8 chữ số, sinh bằng `crypto.randomInt`,
  dải `[10^7, 10^8)`. Không bắt đầu bằng số 0.

**Ví dụ**: `DAY41354382`, `MONTH23889028`, `YEAR16596206`

### 3.2. Tại sao lưu trong DB thay vì env?

- Admin thêm/sửa pattern qua UI không cần redeploy.
- Soft-delete (set `isActive=0`) giữ audit cho orders cũ.
- Mỗi pattern có `randomLength` riêng nếu sau này cần (hiện đều 8).

### 3.3. Files liên quan

- **Schema**: `src/db/schema/payment.ts` → `paymentCodePatterns`
- **Service chính**: `src/features/payment/services/order-code-pattern.service.ts`
  - `getActivePatterns()` — query DB, cache 60s ở module scope
  - `generateOrderCode({ preferredCode? })` — random chọn 1 pattern
  - `buildOrderCodeFromPattern(pattern)` — sync, dùng `crypto.randomInt`
  - `parseOrderCodeFromContent(content)` — match theo tất cả pattern,
    có word-boundary (tránh match nhầm `DAY` trong `MONDAY`)
  - `isValidPatternCode(code)` — validate `^[A-Z0-9]{3,10}$`
  - `invalidatePatternCache()` — gọi sau CRUD
- **Wrapper async**: `src/features/payment/services/vietqr.service.ts`
  - `generateOrderCode()` — async, fallback `ENGPRMxxxxxxxx` nếu DB rỗng
  - `parseOrderCodeFromContent()` — async, fallback regex `ENGPRM[0-9]{8}`
- **SePay config trong dashboard**: thêm 3 dòng `DAY`, `MONTH`, `YEAR`
  (mỗi dòng là 1 mã SePay nhận diện).

### 3.4. Cảnh báo quan trọng

⚠️ **BẮT BUỘC** vào my.sepay.vn → Cài đặt → Mã thanh toán thêm 3 dòng:
`DAY`, `MONTH`, `YEAR`. Nếu không SePay sẽ **không gửi webhook** cho giao
dịch có nội dung bắt đầu bằng 3 mã này → đơn hàng treo PENDING mãi mãi.

---

## 4. Webhook SePay

### 4.1. Contract

- **URL**: `POST /api/payment/sepay-webhook`
- **Auth**: HMAC-SHA256 trong header `x-sepay-signature` (hoặc
  `x-sepay-webhook-signature` / `sepay-signature`)
- **Secret**: `env.SEPAY_WEBHOOK_SECRET`
- **Body**: JSON gồm `id`, `gateway`, `transactionDate`, `accountNumber`,
  `code`, `content`, `transferType`, `description`, `transferAmount`,
  `referenceCode`

### 4.2. Xử lý 5 bước (theo `processSepayWebhook`)

```
1. HMAC verify         → fail: 403, SePay retry
2. Idempotency check   → nếu payload.id đã có → return ok (200)
3. Tìm & đối soát      → resolve orderCode (ưu tiên payload.code, fallback parse content)
   3.5. Auto-expire    → nếu order.expiresAt < now → mark EXPIRED → return order_expired
4. Amount check        → nếu transferAmount < order.amount → reject
5. Settle              → trong transaction: grant sub + update order + insert tx
```

### 4.3. Response codes

| Tình huống | HTTP | Body |
|---|---|---|
| Thành công | 200 | `{ success: true }` |
| Signature sai | 403 | `{ success: false, error: "Invalid signature" }` |
| Payload invalid | 400 | error message |
| Order not found / settled / expired | 200 | `{ success: true }` (KHÔNG retry) |
| Server error | 500 | (SePay retry) |

---

## 5. Cron Job

### 5.1. Config

File: `vercel.json` (root)

```json
{
  "crons": [
    { "path": "/api/cron/expire-orders", "schedule": "*/5 * * * *" }
  ]
}
```

### 5.2. Logic

- Mỗi 5 phút scan orders `PENDING` có `expiresAt < now`
- Set status = `EXPIRED`
- Authorize qua header `Authorization: Bearer ${CRON_SECRET}`

### 5.3. Defense-in-depth (đã có)

Webhook SePay cũng check `expiresAt` ở bước 3.5 — nếu cron skip trên
Vercel Hobby, webhook vẫn expire đúng. **Không phụ thuộc cron 100%**.

---

## 6. Polling & Session Refresh

### 6.1. Polling (client)

- Hook: `src/features/payment/hooks/use-order-status.ts`
- Interval: 3000ms
- Endpoint: `GET /api/payment/orders/[orderId]`
- Cache: `no-store` + server set `Cache-Control: no-store, no-cache,
  must-revalidate, private` (3 lớp defense)

### 6.2. Session refresh sau SUCCESS

Khi detect `PENDING → SUCCESS`:
1. Hook gọi `POST /api/auth/refresh-session` (Better-Auth custom endpoint
   trong plugin `session-refresh` của `src/lib/auth.ts`)
2. Endpoint re-read user fresh từ DB, gọi `setSessionCookie` để refresh
   cookie với `subscriptionPlan` mới
3. Caller `handleSuccess` trong `payment-checkout-client.tsx` đã có sẵn
   `router.push("/courses") + router.refresh()` → RSC re-render với data mới

→ Học viên **KHÔNG cần logout/login lại** để thấy quyền Premium.

---

## 7. File quan trọng (cheat sheet)

### Services (logic nghiệp vụ)
- `src/features/payment/services/order.service.ts` — CRUD orders
- `src/features/payment/services/vietqr.service.ts` — QR URL + wrapper orderCode
- `src/features/payment/services/sepay-webhook.service.ts` — webhook handler
- `src/features/payment/services/subscription.service.ts` — grant Premium
- `src/features/payment/services/order-code-pattern.service.ts` — sinh/parse orderCode
- `src/features/payment/services/admin-order.service.ts` — admin queries
- `src/features/payment/services/vietqr.service.ts` — VietQR URL builder

### Schemas (DB)
- `src/db/schema/payment.ts` — orders, sepay_transactions, payment_code_patterns
- `src/db/schema/auth.ts` — user (role, subscriptionPlan, expiresAt)

### API routes
- `src/app/api/payment/orders/route.ts` — POST/GET
- `src/app/api/payment/orders/[orderId]/route.ts` — GET (polling)
- `src/app/api/payment/sepay-webhook/route.ts` — POST (SePay)
- `src/app/api/payment/test-mode/simulate/route.ts` — dev only
- `src/app/api/cron/expire-orders/route.ts` — cron
- `src/app/api/admin/payment/code-patterns/route.ts` — GET/POST
- `src/app/api/admin/payment/code-patterns/[code]/route.ts` — PATCH/DELETE

### Client UI
- `src/app/(student)/upgrade/page.tsx` — chọn gói
- `src/app/(student)/upgrade/[orderId]/payment-checkout-client.tsx` — QR + polling
- `src/features/payment/hooks/use-order-status.ts` — polling hook
- `src/features/payment/components/payment-shell.tsx` — context provider
- `src/app/admin/payment/patterns/page.tsx` — admin UI quản lý patterns
- `src/app/admin/orders/page.tsx` — admin UI xem orders

### Auth
- `src/lib/auth.ts` — Better-Auth config + plugin `session-refresh`
- `src/lib/auth-client.ts` — client SDK

### Scripts
- `scripts/seed-payment-patterns.ts` — seed 3 pattern mặc định
- `scripts/cleanup-patterns.ts` — soft-delete pattern thừa
- `scripts/test-patterns.ts` — test parser/generator
- `scripts/check-order-codes.ts` — debug orders cũ

### Env
- `SEPAY_WEBHOOK_SECRET` — HMAC secret
- `SEPAY_BANK_ACCOUNT` / `SEPAY_BANK_CODE` / `SEPAY_ACCOUNT_NAME` — TK nhận
- `ORDER_EXPIRY_MINUTES` — mặc định 15
- `CRON_SECRET` — auth cho cron endpoint

---

## 8. Lịch sử thay đổi gần đây

### 2026-06-15 → 2026-06-16: Payment refactor lớn

**Vấn đề gốc**:
1. Cron trên Vercel Hobby có thể bị skip nếu ít traffic → đơn PENDING treo.
2. Sau khi webhook grant Premium, session cookie còn cache role cũ → user
   phải logout/login lại mới thấy Premium.
3. SePay chỉ cho phép `ENGPRM` prefix cứng → nếu cấu hình thêm mã
   `DAY`/`MONTH`/`YEAR` thì giao dịch bị SePay bỏ qua.

**Đã fix**:
- **Fix 1**: Thêm `Cache-Control: no-store` (3 lớp) cho tất cả payment
  API routes (`/api/payment/orders`, `/api/payment/orders/[id]`).
- **Fix 2**: Thêm endpoint `POST /api/auth/refresh-session` (Better-Auth
  custom endpoint) → refresh cookie sau khi webhook settle. Hook
  `useOrderStatus` tự gọi khi detect SUCCESS.
- **Fix 3**: Thêm auto-expire fallback trong webhook (bước 3.5) — nếu
  order đã quá hạn khi SePay gửi CK, mark EXPIRED ngay thay vì settle.
- **Feature mới**: Bảng `payment_code_patterns` + lib
  `order-code-pattern.service.ts` cho phép nhiều prefix SePay.

**Sau đó đơn giản hóa** (theo feedback user):
- Chỉ giữ 3 pattern active: `DAY`, `MONTH`, `YEAR`
- Random là số nguyên 8 chữ số (thay vì alphanumeric)
- 4 pattern thừa (ENGPRM, PRM, VIP, COURSE) → soft-delete

### Migration

File: `src/db/migrations/0008_add_payment_code_patterns.sql`

```sql
CREATE TABLE "payment_code_patterns" (
  "code" varchar(10) PRIMARY KEY NOT NULL,
  "description" text,
  "random_length" integer DEFAULT 8 NOT NULL,
  "is_active" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "payment_code_patterns_active_idx"
  ON "payment_code_patterns" USING btree ("is_active");
```

---

## 9. Test & verify

### Type check

```bash
cd apps/web && npx tsc --noEmit
```

### Seed patterns (idempotent)

```bash
cd apps/web && pnpm db:seed-patterns
```

### Test parser/generator

```bash
cd apps/web && pnpm tsx scripts/test-patterns.ts
```

Output mong đợi:
- `DAY12345678 thanh toan` → `DAY12345678`
- `MONTH12345678 NH Premium` → `MONTH12345678`
- `PROMO DAY12345678` → `DAY12345678` (word-boundary OK)
- `DAYABC12345` → `null` (có chữ → fail)
- Generate: `MONTH23889028`, `YEAR16596206`, `DAY41354382` (chỉ số)

### Cleanup patterns thừa (1 lần)

```bash
cd apps/web && pnpm tsx scripts/cleanup-patterns.ts
```

---

## 10. Checklist khi debug

Khi có bug liên quan payment, kiểm tra theo thứ tự:

1. **Đơn treo PENDING mãi không SUCCESS**
   - [ ] SePay dashboard đã thêm đủ 3 mã `DAY`, `MONTH`, `YEAR`?
   - [ ] Webhook có vào `/api/payment/sepay-webhook`? Check Vercel logs.
   - [ ] HMAC signature đúng? Check `SEPAY_WEBHOOK_SECRET`.
   - [ ] `payment_code_patterns` có row active? Run `pnpm db:seed-patterns`.
   - [ ] Cron job có chạy? Check Vercel Dashboard → Settings → Cron Jobs.

2. **Thanh toán thành công nhưng UI không nhận Premium**
   - [ ] Hook `useOrderStatus` có gọi `/api/auth/refresh-session`? Check network tab.
   - [ ] Endpoint `/api/auth/refresh-session` có trả 200? Check logs.
   - [ ] `setSessionCookie` có chạy trong plugin? Check `src/lib/auth.ts`.
   - [ ] Caller có `router.refresh()`? Check `payment-checkout-client.tsx`.

3. **Lỗi amount mismatch**
   - [ ] `PACKAGE_PRICES` có khớp với giá thực tế SePay nhận?
   - [ ] Số tiền trong payload SePay có khớp với order.amount?

4. **Cron không expire order**
   - [ ] Vercel Hobby có thể skip cron khi ít traffic — đã có auto-expire
     trong webhook (bước 3.5) làm fallback.
   - [ ] Check `CRON_SECRET` env có set.
   - [ ] Check `expires_at < now` query có đúng.

5. **Cache trả về data cũ**
   - [ ] Tất cả payment API đã có `Cache-Control: no-store`?
   - [ ] Client fetch có `cache: "no-store"`?

---

## 11. Lưu ý tương lai

- Nếu cần đổi length random, update cột `random_length` trong DB
  (không cần code change).
- Nếu thêm pattern mới, vào admin UI `/admin/payment/patterns` → thêm.
  Đồng thời phải thêm dòng tương ứng trong SePay dashboard.
- Nếu upgrade Better-Auth lớn, kiểm tra internal `setSessionCookie` API
  (pattern trong plugin `session-refresh` dùng internal — có thể break).
- Cron chỉ là defense layer 1; webhook tự expire là layer 2 chính.
- Khi lên prod Vercel: kiểm tra tab Cron Jobs active, monitor logs mỗi 5p.
