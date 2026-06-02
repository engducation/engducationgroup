# ĐẶC TẢ CẤU TRÚC LAYOUT VÀ TỐI ƯU PHÔNG CHỮ TIẾT KIỆM CHI PHÍ VẬN HÀNH

Tài liệu này quy định giải pháp phân tầng giao diện tách biệt (Layout Isolation), cấu trúc định tuyến và cấu hình phông chữ tiếng Việt chuẩn mực cho hệ thống Fullstack Next.js, đáp ứng toàn bộ yêu cầu nghiệp vụ MVP.

---

## 1. CẤU HÌNH PHÔNG CHỮ TIẾNG VIỆT CHUẨN (TYPOGRAPHY CONFIGURATION)

Để triệt tiêu hoàn toàn hiện tượng lỗi hiển thị dấu tiếng Việt (nhảy chữ, phông chữ bị răng cưa hoặc tự động chuyển về phông hệ thống mặc định), hệ thống sử dụng module `next/font/google` kết hợp cấu hình lớp biến môi trường trong Tailwind CSS. Điều này giúp tối ưu hóa chỉ số Cumulative Layout Shift (CLS) về mức 0 và tiết kiệm chi phí băng thông tải phông chữ từ máy chủ bên ngoài.

### 1.1. Cấu hình tại Root Layout (`src/app/layout.tsx`)

```tsx
import { Inter } from 'next/font/google';
import '@/app/globals.css';

// Khởi tạo phông chữ với tập hợp ký tự tiếng Việt (vietnamese) đầy đủ
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap', // Tránh hiện tượng mất chữ trong quá trình tải phông
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background font-sans antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}

```

### 1.2. Đồng bộ trong cấu hình Tailwind CSS (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        // Ghi đè phông chữ mặc định của Tailwind thành phông Inter đã cấu hình tiếng Việt
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
    },
  },
};
export default config;

```

---

## 2. GIẢI PHÁP PHÂN TẦNG LAYOUT TÁCH BIỆT (ROUTE GROUPS ISOLATION)

Next.js App Router hỗ trợ tính năng **Route Groups** (Sử dụng thư mục đóng ngoặc đơn như `(student)`, `(auth)`) để nhóm các tuyến đường cùng nghiệp vụ mà không làm thay đổi cấu trúc URL. Cơ chế này cho phép cô lập hoàn toàn giao diện của Admin và Học viên, loại bỏ hoàn toàn Header/Footer của Landing Page khỏi không gian làm việc của Admin mà không cần viết các câu lệnh điều kiện `if/else` phức tạp tại Runtime.

### 2.1. Sơ đồ phân nhánh Layout hệ thống

```text
src/app/
├── layout.tsx                # Root Layout tổng (Chỉ cấu hình phông chữ và Provider toàn cục)
├── page.tsx                  # Trang chủ Landing Page (Kèm Header/Footer công cộng)
├── (auth)/                   # Nhóm xác thực độc lập
│   ├── login/page.tsx
│   └── register/page.tsx
├── (student)/                # Phân hệ Học viên (Giao diện học tập)
│   ├── layout.tsx            # Layout riêng: Header học viên + Sidebar khóa học
│   ├── dashboard/page.tsx
│   └── learn/[courseId]/page.tsx
└── admin/                    # Phân hệ Quản trị (Cô lập hoàn toàn)
    ├── layout.tsx            # Layout riêng: Sidebar Dashboard cố định (shadcn Blocks)
    └── dashboard/page.tsx    # Nội dung Dashboard thống kê doanh thu/người dùng

```

---

## 3. CHI TIẾT TRIỂN KHAI CÁC FILE LAYOUT ĐẶC THÙ

### 3.1. Layout phân hệ Quản trị viên (`src/app/admin/layout.tsx`)

Layout này loại bỏ hoàn toàn các thành phần giao diện của học viên. Tích hợp trực tiếp cấu trúc Sidebar cố định từ thư viện thành phần cấu trúc của `shadcn/ui` Blocks.

```tsx
import React from 'react';
import Link from 'next/link';

// Cấu trúc Sidebar chuẩn cho Quản trị viên - Không chứa thành phần Landing Page
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      {/* CỘT SIDEBAR CỐ ĐỊNH (Bên Trái) */}
      <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r bg-slate-900 text-white">
        {/* Phần Logo Admin */}
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link href="/admin/dashboard" className="text-lg font-bold tracking-tight text-indigo-400">
            Engducation Admin ❄️
          </Link>
        </div>
        
        {/* Danh sách Menu Điều hướng Quản trị */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          <Link href="/admin/dashboard" className="flex items-center rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition">
            Tổng quan Hệ thống
          </Link>
          <Link href="/admin/courses" className="flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Quản lý Khóa học
          </Link>
          <Link href="/admin/vocabulary" className="flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Kho Từ Vựng (Excel)
          </Link>
          <Link href="/admin/users" className="flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">
            Giám Sát Người Dùng
          </Link>
        </nav>

        {/* Thông tin Tài khoản Đăng xuất phía dưới Sidebar */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">AD</div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Quản trị viên</span>
              <span className="text-[10px] text-slate-500">admin@engducation.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* KHÔNG GIAN NỘI DUNG CHÍNH (Bên Phải - Bắt đầu từ khoảng cách 64px của Sidebar) */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Header Ngang phía trên của trang Admin */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-white px-8 shadow-sm">
          <h1 className="text-sm font-semibold text-slate-700">Hệ Thống Quản Trị Hệ Thống</h1>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              Hệ thống hoạt động ổn định
            </span>
          </div>
        </header>

        {/* Toàn bộ nội dung Dashboard, Biểu đồ Doanh thu sẽ render tại đây */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

```

### 3.2. Layout phân hệ Học viên (`src/app/(student)/layout.tsx`)

Giao diện này tối ưu hóa cho việc học tập trực tuyến, sử dụng cấu trúc Header ngang tinh giản và Sidebar hiển thị danh sách bài học/tiến độ cá nhân.

```tsx
import React from 'react';
import Link from 'next/link';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER HỌC VIÊN - Tách biệt hoàn toàn với Header Landing Page */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-white/80 backdrop-blur-md px-6 sm:px-12">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-slate-900">
            Engducation ❄️
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="text-indigo-600 font-semibold">Lớp học của tôi</Link>
            <Link href="/notebook" className="hover:text-slate-900 transition">Sổ tay từ vựng</Link>
            <Link href="/ai-assistant" className="hover:text-slate-900 transition">Trợ lý AI</Link>
          </nav>
        </div>
        
        {/* Trạng thái gói tài khoản của học viên */}
        <div className="flex items-center gap-4">
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Premium Pro
          </span>
          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-medium text-sm text-slate-700 border">
            HV
          </div>
        </div>
      </header>

      {/* VÙNG CHỨA NỘI DUNG HỌC TẬP */}
      <div className="flex flex-1">
        <main className="flex-1 px-6 py-8 sm:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}

```

---

## 4. CHIẾN LƯỢC ĐIỀU HƯỚNG SAU ĐĂNG NHẬP (RBAC REDIRECTION LOGIC)

Để đảm bảo người dùng có vai trò `Admin` không bao giờ truy cập nhầm vào giao diện của `User` và ngược lại, logic chuyển hướng sau khi đăng nhập thành công được xử lý triệt để tại Middleware của Next.js hoặc tại Server Action của phân hệ xác thực.

### Logic xử lý chuyển hướng mẫu tại Route Handler Đăng nhập:

```typescript
import { NextResponse } from 'next/server';

export async function handlePostLoginRedirect(userRole: 'ADMIN' | 'USER') {
  // Thực hiện phân luồng URL ngay lập tức sau khi xác thực token thành công
  if (userRole === 'ADMIN') {
    // Chuyển hướng thẳng vào trang quản trị độc lập, kích hoạt AdminLayout
    return NextResponse.redirect(new URL('/admin/dashboard', process.env.NEXT_PUBLIC_APP_URL));
  }
  
  // Đối với học viên bình thường, điều hướng về không gian học tập StudentLayout
  return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL));
}

```

Mô hình phân lớp thư mục này giải quyết triệt để bài toán đồng bộ giao diện, giúp mã nguồn sạch, dễ dàng bảo trì cấu trúc code khi hệ thống phát triển quy mô lớn và tối ưu hóa tài nguyên phần cứng tối đa.

---


# ĐẶC TẢ GIAO DIỆN, BỐ CỤC VÀ LUỒNG CHỨC NĂNG PHÂN HỆ ADMIN CMS

Tài liệu này đặc tả chi tiết cấu trúc định tuyến, layout giao diện và luồng xử lý nghiệp vụ dành riêng cho vai trò **Quản trị viên (Admin)** trong hệ thống Fullstack Next.js.

---

## 1. LUỒNG XÁC THỰC VÀ TỰ ĐỘNG CHUYỂN HƯỚNG (POST-LOGIN REDIRECTION)

Để cô lập hoàn toàn không gian làm việc của Admin và ngăn chặn truy cập trái phép, luồng chuyển hướng và bảo mật được xử lý nghiêm ngặt ở tầng Server qua Middleware.

### 1.1. Cơ chế phân luồng sau Đăng nhập (Authentication Flow)

1. Admin thực hiện nhập thông tin tài khoản tại trang `/login`.
2. Hệ thống xác thực thông tin, cấp mã Token JWT đính kèm thông tin `role: "ADMIN"` vào HTTP-Only Cookie.
3. Server thực hiện kiểm tra quyền và lập tức điều hướng (Redirect 302) thẳng về tuyến đường độc lập: **`/admin/dashboard`**.

### 1.2. Middleware bảo vệ tầng quản trị (`apps/web/src/middleware.ts`)

```typescript
// Cấu trúc logic bảo vệ lớp Route Admin ở tầng Server
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ áp dụng kiểm tra cho các tuyến đường bắt đầu bằng /admin
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;

    // Trường hợp 1: Không có token -> Đá về trang login hệ thống
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Trường hợp 2: Giải mã token phát hiện role không phải ADMIN -> Chặn quyền truy cập
    const userRole = request.cookies.get('user_role')?.value; // Ví dụ minh họa giải mã nhanh
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url)); // Trả về trang học viên
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

```

---

## 2. KIẾN TRÚC UI LAYOUT TÁCH BIỆT (ADMIN SIDEBAR LAYOUT)

Phân hệ Admin được đặt trong thư mục riêng biệt `/app/admin/`, sử dụng cấu trúc **Sidebar Blocks** từ thư viện **shadcn/ui**. Layout này triệt tiêu hoàn toàn sự xuất hiện của Header, Footer hay bất kỳ thành phần nào của trang Landing Page bên ngoài.

### 2.1. Sơ đồ phân bổ không gian màn hình (Layout Grid)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR CỐ ĐỊNH (w-64)   │  THANH HEADER NGANG (Sticky, h-16)        │
│                           ├────────────────────────────────────────────┤
│  - Logo: Engducation ❄️    │  KHÔNG GIAN NỘI DUNG CHỨC NĂNG (Flex-1)    │
│  - Menu Quản trị (CMS)    │                                            │
│  - Trạng thái hệ thống    │  [Hiển thị biểu đồ, Bảng dữ liệu CRUD,     │
│  - Nút Đăng xuất          │   Khung tiến trình tải file Excel...]      │
│                           │                                            │
└────────────────────────────────────────────────────────────────────────┘

```

### 2.2. Thành phần UI sử dụng (shadcn/ui Components Mapping)

* **Khung chính:** `Sidebar`, `SidebarProvider`, `SidebarInset` (Cấu trúc khối điều hướng chuyên dụng).
* **Bảng dữ liệu:** `Table`, `TableHeader`, `TableBody`, `TableCell`, `TableRow` kết hợp phân trang.
* **Trạng thái & Hộp thoại:** `Dialog` (Khung pop-up thêm/sửa nhanh), `Alert` (Cảnh báo lỗi hệ thống), `Toast` (Thông báo đẩy khi CRUD thành công).

---

## 3. CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG CORE MVP DÀNH CHO ADMIN

Hệ thống quản trị chia làm 4 phân hệ màn hình cốt lõi tương ứng với các liên kết trên Sidebar:

### 3.1. Phân hệ 1: Tổng quan Hệ thống (`/admin/dashboard`)

Giao diện trung tâm giám sát hiệu năng kinh doanh và dữ liệu người dùng thực tế theo thời gian thực.

* **Khối thống kê (Card Grid):**
* *Thẻ Doanh thu:* Tổng số tiền thu được từ các giao dịch Premium thành công (Cập nhật tự động sau khi đối chiếu Webhook).
* *Thẻ Giao dịch:* Tổng số lượt thanh toán thành công/thất bại trong tháng.
* *Thẻ Người dùng:* Tổng số học viên đăng ký mới và số lượng tài khoản hoạt động thực tế (Daily Active Users - DAU).


* **Thành phần hiển thị:** Sử dụng các thẻ `Card` của shadcn phối hợp hiệu ứng đồ họa tinh giản để Admin có cái nhìn tổng quan lập tức.

### 3.2. Phân hệ 2: Quản trị Nội dung Học tập (`/admin/courses`)

Quản lý cây thư mục nội dung tuyến tính từ khóa học đến từng thành phần chi tiết bên trong bài học.

* **Nghiệp vụ CRUD Khóa học (Course):** Thiết lập Tên, Mô tả, Cấp độ và Trạng thái (`Draft` - Bản nháp, `Published` - Xuất bản công khai, `Archived` - Lưu trữ). Ràng buộc logic: *Không cho phép xóa Khóa học nếu bên trong đã khởi tạo Module hoặc Bài học.*
* **Nghiệp vụ CRUD Chương (Module):** Tạo mới, chỉnh sửa và sắp xếp thứ tự hiển thị của Module trong một Khóa học cụ thể.
* **Nghiệp vụ CRUD Bài học (Lesson):** Quản lý bật/tắt linh hoạt các cấu phần nội dung con:
* *Cấu phần Read:* Nhập tiêu đề, nội dung văn bản và ghi chú từ vựng.
* *Cấu phần Write:* Nhập đề bài, cấu hình tiêu chí chấm điểm tự động cho AI.
* *Cấu phần Lesson Video:* Tích hợp thư viện **Cloudinary SDK**. Giao diện cung cấp nút bấm chọn tệp tin video từ máy tính, đẩy trực tiếp lên Cloudinary Cloud, lưu lại chuỗi `videoUrl` và `videoPublicId` vào cơ sở dữ liệu. Admin có quyền thay thế video bất kỳ lúc nào.



### 3.3. Phân hệ 3: Quản trị Bộ câu hỏi và Quiz tương tác (`/admin/quizzes`)

Phân hệ xây dựng và kiểm tra chất lượng các bài kiểm tra trắc nghiệm đính kèm bài học.

* **Ràng buộc cấu trúc dữ liệu Quiz (Data Constraints):**
* Mỗi câu hỏi khởi tạo bắt buộc phải cung cấp tối thiểu **02 đáp án lựa chọn** (Options).
* Phải chỉ định chính xác tối thiểu **01 đáp án đúng** (Correct Option Index).
* **Bắt buộc phải điền trường văn bản Giải thích nghiệp vụ (Explanation)**. Nếu trường này trống, hệ thống sẽ chặn không cho phép lưu và đẩy thông báo nhắc nhở (`Toast` cảnh báo lỗi) nhằm đảm bảo trải nghiệm tự học tốt nhất cho học viên.



### 3.4. Phân hệ 4: Kho Từ Vựng & Nhập Dữ Liệu Hàng Loạt (`/admin/vocabulary`)

Phân hệ xử lý dữ liệu quy mô lớn, giúp tối ưu hóa thời gian nhập liệu thông qua tệp tin Excel.

* **Quy tắc nghiệp vụ kho từ vựng (Vocabulary Logic):** Hệ thống chấp nhận trùng từ gốc (ví dụ: 'desert') nếu chúng khác từ loại (Danh từ / Động từ). Nếu trùng cả từ gốc và từ loại, hệ thống tự động hiển thị hộp thoại `Dialog` yêu cầu Admin lựa chọn: *Từ chối ghi đè* hoặc *Cập nhật đè lên bản ghi cũ*.
* **Cơ chế Nhập dữ liệu hàng loạt (Excel Bulk Import Service):**
* Admin tải tệp tin Excel lên qua khung kéo thả (`src/utils/ExcelParser.ts`).
* Hệ thống thực hiện quét và kiểm tra tính hợp lệ của từng dòng dữ liệu theo đúng cấu trúc cột bắt buộc của PRD.
* *Cơ chế xử lý lỗi vị tha (Fault-tolerant):* Nếu phát hiện dòng dữ liệu bị lỗi (ví dụ: thiếu cột bắt buộc, sai định dạng), hệ thống **không hủy bỏ toàn bộ tệp tin**. Thay vào đó, backend tiếp tục xử lý, ghi nhận thành công tất cả các dòng hợp lệ vào cơ sở dữ liệu, đồng thời trả về một danh sách báo cáo chi tiết: chỉ rõ chính xác *Số thứ tự dòng bị lỗi* và *Lý do lỗi cụ thể* để Admin sửa đổi.



---

## 4. CHI TIẾT TRẠI NGHIỆM NGƯỜI DÙNG PHÂN HỆ QUẢN TRỊ (ADMIN UX UI)

* **Trạng thái xử lý ngầm (Loading States):** Khi Admin thực hiện tải lên tệp tin Excel dung lượng lớn hoặc đang đẩy video bài giảng dung lượng cao lên Cloudinary, hệ thống sẽ vô hiệu hóa (Disable) tạm thời các nút bấm hành động xung quanh, hiển thị thanh tiến trình xử lý (`Progress` hoặc `Skeleton` của shadcn) để thông báo trực quan cho Admin không tắt trình duyệt giữa chừng.
* **Hộp thoại xác nhận an toàn (Confirmation Dialogs):** Tất cả các hành động mang tính chất thay đổi vĩnh viễn cấu trúc dữ liệu hệ thống như Xóa khóa học, Hủy xuất bản (`Archive`) hoặc Xóa từ vựng gốc (Lưu ý: Xóa từ vựng gốc sẽ làm cascade xóa toàn bộ lượt lưu sổ tay từ vựng của học viên tương ứng) bắt buộc phải kích hoạt một hộp thoại xác nhận hai bước (`AlertDialog`) trước khi gửi lệnh xuống cơ sở dữ liệu.

---

# ĐẶC TẢ GIAO DIỆN, BỐ CỤC VÀ LUỒNG CHỨC NĂNG PHÂN HỆ ADMIN CMS

Tài liệu này đặc tả chi tiết cấu trúc định tuyến, layout giao diện và luồng xử lý nghiệp vụ dành riêng cho vai trò **Quản trị viên (Admin)** trong hệ thống Fullstack Next.js.

---

## 1. LUỒNG XÁC THỰC VÀ TỰ ĐỘNG CHUYỂN HƯỚNG (POST-LOGIN REDIRECTION)

Để cô lập hoàn toàn không gian làm việc của Admin và ngăn chặn truy cập trái phép, luồng chuyển hướng và bảo mật được xử lý nghiêm ngặt ở tầng Server qua Middleware.

### 1.1. Cơ chế phân luồng sau Đăng nhập (Authentication Flow)

1. Admin thực hiện nhập thông tin tài khoản tại trang `/login`.
2. Hệ thống xác thực thông tin, cấp mã Token JWT đính kèm thông tin `role: "ADMIN"` vào HTTP-Only Cookie.
3. Server thực hiện kiểm tra quyền và lập tức điều hướng (Redirect 302) thẳng về tuyến đường độc lập: **`/admin/dashboard`**.

### 1.2. Middleware bảo vệ tầng quản trị (`apps/web/src/middleware.ts`)

```typescript
// Cấu trúc logic bảo vệ lớp Route Admin ở tầng Server
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ áp dụng kiểm tra cho các tuyến đường bắt đầu bằng /admin
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;

    // Trường hợp 1: Không có token -> Đá về trang login hệ thống
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Trường hợp 2: Giải mã token phát hiện role không phải ADMIN -> Chặn quyền truy cập
    const userRole = request.cookies.get('user_role')?.value; // Ví dụ minh họa giải mã nhanh
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url)); // Trả về trang học viên
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

```

---

## 2. KIẾN TRÚC UI LAYOUT TÁCH BIỆT (ADMIN SIDEBAR LAYOUT)

Phân hệ Admin được đặt trong thư mục riêng biệt `/app/admin/`, sử dụng cấu trúc **Sidebar Blocks** từ thư viện **shadcn/ui**. Layout này triệt tiêu hoàn toàn sự xuất hiện của Header, Footer hay bất kỳ thành phần nào của trang Landing Page bên ngoài.

### 2.1. Sơ đồ phân bổ không gian màn hình (Layout Grid)

```
┌────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR CỐ ĐỊNH (w-64)   │  THANH HEADER NGANG (Sticky, h-16)        │
│                           ├────────────────────────────────────────────┤
│  - Logo: Engducation ❄️    │  KHÔNG GIAN NỘI DUNG CHỨC NĂNG (Flex-1)    │
│  - Menu Quản trị (CMS)    │                                            │
│  - Trạng thái hệ thống    │  [Hiển thị biểu đồ, Bảng dữ liệu CRUD,     │
│  - Nút Đăng xuất          │   Khung tiến trình tải file Excel...]      │
│                           │                                            │
└────────────────────────────────────────────────────────────────────────┘

```

### 2.2. Thành phần UI sử dụng (shadcn/ui Components Mapping)

* **Khung chính:** `Sidebar`, `SidebarProvider`, `SidebarInset` (Cấu trúc khối điều hướng chuyên dụng).
* **Bảng dữ liệu:** `Table`, `TableHeader`, `TableBody`, `TableCell`, `TableRow` kết hợp phân trang.
* **Trạng thái & Hộp thoại:** `Dialog` (Khung pop-up thêm/sửa nhanh), `Alert` (Cảnh báo lỗi hệ thống), `Toast` (Thông báo đẩy khi CRUD thành công).

---

## 3. CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG CORE MVP DÀNH CHO ADMIN

Hệ thống quản trị chia làm 4 phân hệ màn hình cốt lõi tương ứng với các liên kết trên Sidebar:

### 3.1. Phân hệ 1: Tổng quan Hệ thống (`/admin/dashboard`)

Giao diện trung tâm giám sát hiệu năng kinh doanh và dữ liệu người dùng thực tế theo thời gian thực.

* **Khối thống kê (Card Grid):**
* *Thẻ Doanh thu:* Tổng số tiền thu được từ các giao dịch Premium thành công (Cập nhật tự động sau khi đối chiếu Webhook).
* *Thẻ Giao dịch:* Tổng số lượt thanh toán thành công/thất bại trong tháng.
* *Thẻ Người dùng:* Tổng số học viên đăng ký mới và số lượng tài khoản hoạt động thực tế (Daily Active Users - DAU).


* **Thành phần hiển thị:** Sử dụng các thẻ `Card` của shadcn phối hợp hiệu ứng đồ họa tinh giản để Admin có cái nhìn tổng quan lập tức.

### 3.2. Phân hệ 2: Quản trị Nội dung Học tập (`/admin/courses`)

Quản lý cây thư mục nội dung tuyến tính từ khóa học đến từng thành phần chi tiết bên trong bài học.

* **Nghiệp vụ CRUD Khóa học (Course):** Thiết lập Tên, Mô tả, Cấp độ và Trạng thái (`Draft` - Bản nháp, `Published` - Xuất bản công khai, `Archived` - Lưu trữ). Ràng buộc logic: *Không cho phép xóa Khóa học nếu bên trong đã khởi tạo Module hoặc Bài học.*
* **Nghiệp vụ CRUD Chương (Module):** Tạo mới, chỉnh sửa và sắp xếp thứ tự hiển thị của Module trong một Khóa học cụ thể.
* **Nghiệp vụ CRUD Bài học (Lesson):** Quản lý bật/tắt linh hoạt các cấu phần nội dung con:
* *Cấu phần Read:* Nhập tiêu đề, nội dung văn bản và ghi chú từ vựng.
* *Cấu phần Write:* Nhập đề bài, cấu hình tiêu chí chấm điểm tự động cho AI.
* *Cấu phần Lesson Video:* Tích hợp thư viện **Cloudinary SDK**. Giao diện cung cấp nút bấm chọn tệp tin video từ máy tính, đẩy trực tiếp lên Cloudinary Cloud, lưu lại chuỗi `videoUrl` và `videoPublicId` vào cơ sở dữ liệu. Admin có quyền thay thế video bất kỳ lúc nào.



### 3.3. Phân hệ 3: Quản trị Bộ câu hỏi và Quiz tương tác (`/admin/quizzes`)

Phân hệ xây dựng và kiểm tra chất lượng các bài kiểm tra trắc nghiệm đính kèm bài học.

* **Ràng buộc cấu trúc dữ liệu Quiz (Data Constraints):**
* Mỗi câu hỏi khởi tạo bắt buộc phải cung cấp tối thiểu **02 đáp án lựa chọn** (Options).
* Phải chỉ định chính xác tối thiểu **01 đáp án đúng** (Correct Option Index).
* **Bắt buộc phải điền trường văn bản Giải thích nghiệp vụ (Explanation)**. Nếu trường này trống, hệ thống sẽ chặn không cho phép lưu và đẩy thông báo nhắc nhở (`Toast` cảnh báo lỗi) nhằm đảm bảo trải nghiệm tự học tốt nhất cho học viên.



### 3.4. Phân hệ 4: Kho Từ Vựng & Nhập Dữ Liệu Hàng Loạt (`/admin/vocabulary`)

Phân hệ xử lý dữ liệu quy mô lớn, giúp tối ưu hóa thời gian nhập liệu thông qua tệp tin Excel.

* **Quy tắc nghiệp vụ kho từ vựng (Vocabulary Logic):** Hệ thống chấp nhận trùng từ gốc (ví dụ: 'desert') nếu chúng khác từ loại (Danh từ / Động từ). Nếu trùng cả từ gốc và từ loại, hệ thống tự động hiển thị hộp thoại `Dialog` yêu cầu Admin lựa chọn: *Từ chối ghi đè* hoặc *Cập nhật đè lên bản ghi cũ*.
* **Cơ chế Nhập dữ liệu hàng loạt (Excel Bulk Import Service):**
* Admin tải tệp tin Excel lên qua khung kéo thả (`src/utils/ExcelParser.ts`).
* Hệ thống thực hiện quét và kiểm tra tính hợp lệ của từng dòng dữ liệu theo đúng cấu trúc cột bắt buộc của PRD.
* *Cơ chế xử lý lỗi vị tha (Fault-tolerant):* Nếu phát hiện dòng dữ liệu bị lỗi (ví dụ: thiếu cột bắt buộc, sai định dạng), hệ thống **không hủy bỏ toàn bộ tệp tin**. Thay vào đó, backend tiếp tục xử lý, ghi nhận thành công tất cả các dòng hợp lệ vào cơ sở dữ liệu, đồng thời trả về một danh sách báo cáo chi tiết: chỉ rõ chính xác *Số thứ tự dòng bị lỗi* và *Lý do lỗi cụ thể* để Admin sửa đổi.



---

## 4. CHI TIẾT TRẠI NGHIỆM NGƯỜI DÙNG PHÂN HỆ QUẢN TRỊ (ADMIN UX UI)

* **Trạng thái xử lý ngầm (Loading States):** Khi Admin thực hiện tải lên tệp tin Excel dung lượng lớn hoặc đang đẩy video bài giảng dung lượng cao lên Cloudinary, hệ thống sẽ vô hiệu hóa (Disable) tạm thời các nút bấm hành động xung quanh, hiển thị thanh tiến trình xử lý (`Progress` hoặc `Skeleton` của shadcn) để thông báo trực quan cho Admin không tắt trình duyệt giữa chừng.
* **Hộp thoại xác nhận an toàn (Confirmation Dialogs):** Tất cả các hành động mang tính chất thay đổi vĩnh viễn cấu trúc dữ liệu hệ thống như Xóa khóa học, Hủy xuất bản (`Archive`) hoặc Xóa từ vựng gốc (Lưu ý: Xóa từ vựng gốc sẽ làm cascade xóa toàn bộ lượt lưu sổ tay từ vựng của học viên tương ứng) bắt buộc phải kích hoạt một hộp thoại xác nhận hai bước (`AlertDialog`) trước khi gửi lệnh xuống cơ sở dữ liệu.