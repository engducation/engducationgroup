# QUY CHUẨN CẤU TRÚC MÃ NGUỒN, CLEAN CODE VÀ TỐI ƯU HIỆU NĂNG NEXT.JS FULLSTACK

Tài liệu này quy định cấu trúc thư mục tiêu chuẩn, chiến lược phân lớp dữ liệu và các quy tắc thiết kế phần mềm (SOLID, DRY, Clean Code) bắt buộc áp dụng cho phần mềm `engducationgroup` bên trong thư mục `apps/web`. Toàn bộ lập trình viên và AI IDE phải tuân thủ nghiêm ngặt để đảm bảo mã nguồn dễ bảo trì, dễ mở rộng và không có tình trạng tệp tin vượt quá giới hạn dòng code.

---

## 1. KIẾN TRÚC TỔNG THỂ: FEATURE-DRIVEN ARCHITECTURE (MODULAR DESIGN)

Để triệt tiêu hoàn toàn tình trạng gom tất cả logic vào một file duy nhất gây phình to mã nguồn, hệ thống áp dụng kiến trúc **Feature-Driven (Thiết kế hướng tính năng)**. Mỗi phân hệ nghiệp vụ là một module độc lập, cô lập hoàn toàn logic nội bộ và chỉ phơi bày các tài nguyên cần thiết ra ngoài thông qua một file Public API (`index.ts`).

### Sơ đồ cấu trúc thư mục tiêu chuẩn (`apps/web/src/`)

```text
apps/web/src/
├── app/                      # TẦNG ROUTING & VIEW (Next.js App Router)
│   ├── api/                  # REST API Route Handlers (Cô lập endpoint, gọi trực tiếp Service tầng dưới)
│   ├── admin/                # Phân hệ Layout & Pages dành cho Admin
│   ├── (auth)/               # Route Group xác thực người dùng (login, register,...)
│   └── (student)/            # Route Group học viên (dashboard, courses, learn, notebook, ai-assistant)
│
├── features/                 # TẦNG NGHIỆP VỤ CHÍNH (Core Business Modules - Áp dụng SOLID & DRY)
│   ├── admin/                # Quản trị hệ thống (Quản lý khóa học, bài học, phê duyệt đơn hàng, báo cáo)
│   ├── learning-content/     # Nghiệp vụ core (Học khóa học, xem bài giảng video, làm bài tập Quiz/Writing)
│   └── vocabulary/           # Nghiệp vụ quản lý từ vựng của hệ thống và Sổ tay từ vựng (Notebook) của học viên
│       ├── api/              # API Client hoặc Next.js Server Actions cục bộ của feature
│       ├── components/       # UI Components đặc thù được chia nhỏ theo Single Responsibility Principle (SRP)
│       ├── hooks/            # Custom hooks tách biệt State và Logic xử lý sự kiện ra khỏi UI
│       ├── services/         # Tầng xử lý Logic thuần túy, tương tác DB hoặc Gọi API bên thứ 3 (AI, Cloudinary)
│       ├── types/            # Định nghĩa kiểu dữ liệu và các Zod Schemas xác thực đầu vào
│       └── index.ts          # PUBLIC API (Chỉ export những thành phần cho phép các tính năng khác sử dụng)
│
├── components/               # CÁC THÀNH PHẦN UI DÙNG CHUNG TOÀN HỆ THỐNG (Global UI Components)
│   ├── layout/               # Giao diện khung hệ thống (Header, Footer, AppSidebar, NavMain, NavUser)
│   ├── providers/            # Cấu hình các Context Providers toàn cục (ThemeProvider, Providers tổng)
│   └── ui/                   # Các component UI nguyên tử, dùng chung (Button, Input, Dialog, Sheet từ Shadcn)
│
├── db/                       # TẦNG CƠ SỞ DỮ LIỆU TẬP TRUNG (Database Access Layer)
│   ├── schema/               # Khai báo cấu trúc bảng cơ sở dữ liệu tách biệt theo thực thể (auth, admin, learning-content)
│   ├── migrations/           # File lưu lịch sử dịch chuyển schema dữ liệu SQL
│   └── index.ts              # Khởi tạo kết nối dữ liệu Client (Drizzle ORM)
│
├── lib/                      # CẤU HÌNH THƯ VIỆN BÊN THỨ BA (Third-party Configurations)
│   ├── auth.ts               # Khởi tạo lõi xử lý xác thực phía Server (Better-Auth Server)
│   ├── auth-client.ts        # Client xác thực dùng cho Client Components
│   └── cloudinary.ts         # Khởi tạo thư viện quản lý, lưu trữ tệp tin đa phương tiện (Media Storage)
└── utils/                    # TIỆN ÍCH THUẦN TÚY (Pure Utility Functions - Tuyệt đối không chứa State)
    ├── formatters.ts         # Hàm định dạng chuỗi, ngày tháng, tiền tệ dùng chung
    └── ExcelParser.ts        # Bộ xử lý trích xuất dữ liệu tệp tin Excel độc lập

```

---

## 2. QUY TẮC THIẾT KẾ MÃ NGUỒN (SOLID, DRY & CLEAN CODE)

### 2.1. Quy tắc giới hạn kích thước tệp tin (File Size Boundaries)

* **Quy định cứng:** Không có bất kỳ tệp tin nguồn (`.ts`, `.tsx`) nào được phép vượt quá **250 dòng code**.
* **Giải pháp bắt buộc khi mã nguồn chạm ngưỡng giới hạn:**
* **Đối với UI Component:** Phải bẻ nhỏ thành các tiểu thành phần (Sub-components) đưa vào thư mục con hoặc thư mục `components/` cục bộ.
* **Đối với Logic/Trạng thái phức tạp:** Tách biệt hoàn toàn phần xử lý sự kiện, tính toán phức tạp sang một Custom Hook riêng biệt tại thư mục `hooks/`.
* **Đối với Tương tác dữ liệu:** Chuyển toàn bộ các hàm truy vấn DB, xử lý thuật toán hoặc gọi API bên thứ ba xuống tầng `services/`.



### 2.2. Áp dụng 5 nguyên lý SOLID vào Next.js

1. **S - Single Responsibility Principle (Đơn nhiệm):** Một tệp tin chỉ làm đúng một việc duy nhất. Một component chỉ đảm nhận hiển thị một phần nhỏ của giao diện. Tuyệt đối không viết gộp giao diện, truy vấn SQL, gọi API AI, và định dạng chuỗi dữ liệu trong cùng một file.
2. **O - Open/Closed Principle (Mở rộng/Đóng kín):** Hạn chế tối đa việc lạm dụng quá nhiều cờ điều hướng (`props` dạng booleans như `isAdmin`, `isPremium`, `hasSidebar`) trong một component lớn. Thay vào đó, ưu tiên thiết kế cấu trúc linh hoạt lồng nhau bằng cách sử dụng thuộc tính `children`.
3. **L - Liskov Substitution Principle (Thay thế Liskov):** Đảm bảo các cấu phần mở rộng từ component gốc (ví dụ: kế thừa các thuộc tính mở rộng từ component UI gốc của hệ thống) không làm thay đổi hay phá vỡ hành vi hoạt động cốt lõi vốn có của component đó.
4. **I - Interface Segregation Principle (Phân tách giao diện dữ liệu):** Component chỉ nhận vừa đủ các trường dữ liệu thực sự cần thiết để hiển thị thông qua thuộc tính `props`. Tuyệt đối không truyền cả một Object lớn từ Database (như truyền toàn bộ object dữ liệu `Course`) vào một component con chỉ cần hiển thị tiêu đề khóa học.
5. **D - Dependency Inversion Principle (Đảo ngược phụ thuộc):** Tầng giao diện người dùng (View) không được phụ thuộc trực tiếp vào các implementation cụ thể của Client API hay cấu hình cụ thể từ thư viện bên thứ ba. Toàn bộ các tương tác giao tiếp phải thông qua một lớp trừu tượng (như lớp Abstract Services hoặc Custom Hooks).

### 2.3. Triết lý DRY (Don't Repeat Yourself - Không lặp lại mã nguồn)

* **Tránh sao chép logic thủ công:** Khi một logic xử lý dữ liệu xuất hiện từ lần thứ hai trở lên ở các vị trí khác nhau, bắt buộc phải gom vào `utils/` (nếu là hàm thuần túy) hoặc đóng gói thành Custom Hook tại `hooks/` (nếu có chứa quản lý trạng thái).
* **Quản lý dữ liệu Schema tập trung:** Toàn bộ các Schema xác thực dữ liệu (ví dụ: Zod Schemas) chỉ được phép khai báo một lần duy nhất tại thư mục `types/schemas.ts` của Feature và tái sử dụng cho cả việc kiểm tra dữ liệu phía Client (Form validation) lẫn phía Server (Route Handlers / API Endpoints).

---

## 3. PHÂN TÁCH LỚP DỮ LIỆU & LUỒNG GIAO TIẾP (DATA FLOW)

Mọi luồng xử lý và trao đổi dữ liệu trong hệ thống bắt buộc phải đi theo một chiều nghiêm ngặt từ trên xuống dưới theo mô hình phân lớp kiến trúc. Không đi ngược luồng và không thực hiện nhảy cóc qua lớp:

```text
[Client View / UI Component] ──> [Custom Hook] ──> [API Client / Next.js Server Action]
                                                               │
                                                               ▼
[Hạ tầng Database / AI API]  <── [Service Layer] <── [Route Handler / API Endpoint]

```

### 3.1. Tầng hiển thị (View Layer - `src/app` và `components`)

* Chỉ chứa mã khai báo cấu trúc giao diện trực quan (JSX/TSX).
* Không lồng các khối try-catch lớn để gọi API, không viết các logic tính toán bóc tách dữ liệu phức tạp.
* Sử dụng Custom Hooks để lấy về dữ liệu sạch và các hàm trigger hành động xử lý sự kiện giao diện.

### 3.2. Tầng Logic trạng thái (State & Logic Layer - `hooks/`)

* Quản lý trạng thái hiển thị giao diện (UI State) và cơ chế bộ nhớ đệm (Caching/Revalidation) thông qua `@tanstack/react-query`.
* Đóng gói toàn bộ logic xử lý sự kiện tương tác của người dùng phía client.

### 3.3. Tầng định tuyến API (Routing/Endpoint Layer - `src/app/api`)

* Nhận yêu cầu (Request), thực hiện kiểm tra quyền truy cập (Authentication/Authorization) bằng phiên làm việc (Session).
* Gọi Zod Schema để xác thực dữ liệu đầu vào.
* Chuyển tiếp tham số đã chuẩn hóa xuống tầng Service để xử lý chuyên sâu và trả về phản hồi chuẩn hóa (Response) cho phía Client. Tuyệt đối không viết logic nghiệp vụ trực tiếp tại đây.

### 3.4. Tầng dịch vụ nghiệp vụ (Service Layer - `services/`)

* Nơi duy nhất tập trung toàn bộ các quy tắc và logic nghiệp vụ cốt lõi của hệ thống (Core Business Rules).
* Chứa toán toán chấm điểm bài kiểm tra Quiz, cơ chế prompt engineering gửi tới các mô hình AI, thuật toán kiểm soát giới hạn lượt gọi (Rate Limiting) để tối ưu chi phí tài nguyên hạ tầng.
* Các hàm xử lý thuộc tầng này chỉ nhận tham số đầu vào dạng dữ liệu thô (raw data), xử lý và trả ra kết quả sạch cho lớp gọi nó. Không can thiệp, không phụ thuộc hay xử lý các đối tượng HTTP Request/Response của Next.js (như không dùng `NextResponse`).

---

## 4. QUY TẮC PHÁT TRIỂN & GIÁM SÁT MÃ NGUỒN CỦA AI IDE

1. **Từ chối viết mã nguồn dạng gộp (Anti-Monolithic):** Khi lập trình viên yêu cầu phát triển một tính năng mới, AI IDE phải chủ động đề xuất và tạo lập đầy đủ cấu trúc thư mục dạng Modular bao gồm `types`, `services`, `hooks`, và `components` cục bộ riêng biệt cho phân hệ đó. Tuyệt đối không đổ dồn toàn bộ mã nguồn vào tệp giao diện chính (như `page.tsx`).
2. **Kiểm tra độ dài tệp tin tự động:** Trước khi thực hiện ghi hoặc ghi đè nội dung vào tệp tin (write file), AI IDE phải tính toán trước số lượng dòng mã nguồn dự kiến phát sinh. Nếu phát hiện cấu trúc logic chuẩn bị ghi vượt quá ngưỡng 250 dòng, phải lập tức dừng lại và thực hiện phân rã kiến trúc, chia nhỏ tệp tin trước khi triển khai.

```

```

---

## 5. GIẢI THÍCH CHI TIẾT CODEBASE HIỆN TẠI

Hệ thống hiện tại đang vận hành theo mô hình phân tách cực kỳ tường minh dựa trên cấu trúc thư mục quy chuẩn trên:

* **Tầng Database (`src/db`)**: Sử dụng cấu trúc schema bẻ nhỏ. Các thực thể chính của hệ thống được quản lý riêng biệt tại `auth.ts` (quản lý User, Session, Account), `admin.ts` (quản lý doanh thu, giao dịch, nhật ký hệ thống), và `learning-content.ts` (quản lý cấu trúc dữ liệu Khóa học, Chương học, Bài học Video, nội dung câu hỏi Quiz và Bài tập viết AI).
* **Tầng Modules Nghiệp vụ (`src/features`)**:
* `admin`: Đóng gói toàn bộ logic quản trị. Các logic truy vấn và mutate phức tạp được đưa xuống `admin.service.ts` và `admin-v2.service.ts` thay vì viết ở API Route. Các API Endpoint gọi trực tiếp từ Service này để trả về dữ liệu. Phía Client dùng Custom Hooks như `use-admin-api.ts` để bọc React Query giúp tự động quản lý trạng thái loading, lỗi.
* `learning-content`: Phân tách chi tiết thành các service chuyên biệt bao gồm `course.service.ts`, `lesson.service.ts`, `quiz.service.ts` (xử lý logic chấm điểm), `cloudinary.service.ts` (quản lý tệp đa phương tiện) và `ai.service.ts` (quản lý kết nối prompt skilling). Khối UI giao diện Client kết nối thông qua các hook đơn nhiệm như `useQuizEngine.ts` (quản lý trạng thái làm bài) và `useProgressTracking.ts` (theo dõi tiến độ học).
* `vocabulary`: Cô lập toàn bộ tính năng liên quan đến từ vựng thông qua `vocabulary.service.ts` độc lập.


* **Tầng API Endpoints (`src/app/api`)**: Đóng vai trò là các cổng chuyển tiếp trung gian (Gateways). Các route được phân chia theo cấu trúc thư mục phản chiếu của URL, chỉ làm nhiệm vụ parse dữ liệu đầu vào bằng Zod Schema lấy từ `types/schemas.ts`, kiểm tra Session người dùng thông qua Helper của `lib/auth.ts`, sau đó chuyển giao công việc tính toán cho tầng `services` tương ứng.
* **Tầng Tiện ích & Cấu hình (`src/utils`, `src/lib`)**: Chứa cấu hình cốt lõi của các thư viện lớn như `auth.ts` (Better-Auth Server), `auth-client.ts` (Xác thực Client), `cloudinary.ts` (Client kết nối lưu trữ video) và các helper thuần túy như `ExcelParser.ts` phục vụ import dữ liệu học liệu hàng loạt một cách cô lập.
