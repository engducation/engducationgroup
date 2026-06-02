# QUY CHUẨN CẤU TRÚC MÃ NGUỒN VÀ TỐI ƯU HIỆU NĂNG NEXT.JS FULLSTACK

Tài liệu này quy định cấu trúc thư mục tiêu chuẩn, chiến lược phân lớp dữ liệu và các quy tắc tối ưu hóa hiệu năng vận hành (PageSpeed, LCP, CLS, TTFB) bắt buộc áp dụng cho phần mềm `engducationgroup` bên trong thư mục `apps/web`. AI IDE và lập trình viên phải tuân thủ nghiêm ngặt khi triển khai mã nguồn.

---

## 1. SƠ ĐỒ CẤU TRÚC THƯ MỤC TỐI ƯU (FEATURE-DRIVEN ARCHITECTURE)

Toàn bộ logic nghiệp vụ hệ thống tập trung hoàn toàn bên trong thư mục `apps/web/src/`.

```text
apps/web/src/
├── app/                      # Tầng Giao diện & Định tuyến (Routing - Server và Client Components)
│   ├── api/                  # Tầng REST API Endpoints (Ví dụ: Route Handler của Better-Auth)
│   │   └── auth/
│   ├── admin/                # Phân hệ Admin
│   ├── (auth)/               # Route Group cho xác thực (Login, Register)
│   ├── (student)/            # Route Group cho học viên (Dashboard, Courses, Learn)
│   ├── layout.tsx            # Root Layout toàn hệ thống
│   └── page.tsx              # Trang chủ ứng dụng
├── components/               # Linh kiện dùng chung mức ứng dụng (Global UI Components)
│   ├── layout/               # Header, Sidebar, Footer, UserMenu
│   ├── providers/            # ThemeProvider, CartProvider, QueryClientProvider
│   └── ui/                   # Linh kiện cơ bản nội bộ (nếu cần mở rộng từ packages/ui)
├── features/                 # Kiến trúc Feature-Driven (Tách biệt logic nghiệp vụ)
│   ├── learning-content/     # Nghiệp vụ quản lý/học khóa học, bài học, bài tập (Quiz, Writing)
│   │   ├── components/       # Linh kiện đặc thù của feature (ví dụ: LessonPlayer, QuizEngine)
│   │   ├── hooks/            # Custom Hooks xử lý state, mutations (useStudentLearning, useQuizEngine)
│   │   ├── services/         # Tầng giao tiếp dữ liệu (AI API client, Server Actions)
│   │   ├── types/            # Định nghĩa kiểu dữ liệu (API Contracts, Schemas)
│   │   └── index.ts          # Public API công khai các tài nguyên ra ngoài feature
│   ├── vocabulary/           # Nghiệp vụ quản lý từ vựng và Notebook
│   └── admin-dashboard/      # Nghiệp vụ thống kê, giám sát (Audit Logs, Moderation)
├── db/                       # Kết nối và cấu hình Database nội bộ (chuyển từ package ngoài vào)
├── lib/                      # Các cấu hình thư viện bên thứ ba (auth.ts, auth-client.ts, axios-client.ts)
└── utils/                    # Hàm tiện ích thuần túy (ExcelParser, formatters)