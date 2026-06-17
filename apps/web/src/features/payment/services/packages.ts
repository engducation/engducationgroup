import type { PackageType } from "@/db/schema";

/**
 * ─── Packages — Single Source of Truth ─────────────────────────────────────
 *
 * Toàn bộ dữ liệu gói (giá, label, duration, mô tả, tiết kiệm %) được gom
 * về đây để:
 *   1. UI chọn gói (`/upgrade`, `/account`) đọc cùng 1 nguồn.
 *   2. Service tạo order (`order.service.ts`) dùng giá từ đây.
 *   3. Khi cần đổi giá → sửa 1 chỗ, tất cả UI tự cập nhật.
 *
 * Quy tắc: 3 gói duy nhất — MONTHLY, 6_MONTH, YEAR.
 *
 * Lưu ý: KHÔNG tự ý thêm field mới mà không check cả 2 file UI
 * (premium-payment-form.tsx, account-client.tsx) + order.service.ts.
 */

export interface PackageInfo {
  type: PackageType;
  label: string;
  price: number;          // VND, số nguyên
  duration: number;        // số ngày Premium được cộng
  description: string;
  originalPrice?: number;  // giá gốc trước discount (nếu có)
  recommended?: boolean;   // gói "Phổ biến nhất" highlight
  features: string[];
}

export const PACKAGES: readonly PackageInfo[] = [
  {
    type: "MONTHLY",
    label: "Gói 1 Tháng",
    price: 49000,
    duration: 30,
    description: "Truy cập tất cả khóa học trong 30 ngày",
    features: [
      "Học từ vựng theo danh mục",
      "Làm quiz trắc nghiệm cơ bản",
      "Xem video bài giảng",
    ],
    recommended: false,
  },
  {
    type: "6_MONTH",
    label: "Gói 6 Tháng",
    price: 269000,
    duration: 180,
    originalPrice: 294000,
    description: "Tiết kiệm 8% - Truy cập trong 180 ngày",
    features: [
      "Tất cả quyền lợi gói 1 Tháng",
      "Xem không giới hạn video bài giảng",
      "Quiz trắc nghiệm nâng cao",
      "AI Writing Assistant (giới hạn)",
    ],
    recommended: true,
  },
  {
    type: "YEAR",
    label: "Gói 1 Năm",
    price: 499000,
    duration: 365,
    originalPrice: 588000,
    description: "Tiết kiệm 15% - Truy cập trong 365 ngày",
    features: [
      "Tất cả quyền lợi gói 6 Tháng",
      "AI Writing Assistant không giới hạn",
      "Báo cáo phân tích lộ trình học tập",
      "Hỗ trợ ưu tiên 24/7",
    ],
    recommended: false,
  },
] as const;

/** O(1) lookup theo packageType — dùng cho order.service.ts và UI. */
const PACKAGE_BY_TYPE: Map<PackageType, PackageInfo> = new Map(
  PACKAGES.map((p) => [p.type, p]),
);

/**
 * Lấy thông tin gói theo type. Trả về undefined nếu type không tồn tại
 * (defensive — dù Zod đã validate, đây là lớp bảo vệ cuối).
 */
export function getPackageByType(type: PackageType): PackageInfo | undefined {
  return PACKAGE_BY_TYPE.get(type);
}

/**
 * Lấy giá theo type. Throw error nếu không tìm thấy — đây là bug nghiêm
 * trọng (Zod schema lỏng hoặc code gọi sai) nên throw để lập trình viên biết.
 */
export function getPackagePrice(type: PackageType): number {
  const pkg = PACKAGE_BY_TYPE.get(type);
  if (!pkg) {
    throw new Error(
      `[packages] Unknown packageType: ${type}. ` +
      `Known: ${PACKAGES.map((p) => p.type).join(", ")}`,
    );
  }
  return pkg.price;
}
