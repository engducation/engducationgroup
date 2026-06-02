# ĐẶC TẢ GIAO DIỆN VÀ TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX) LANDING PAGE

## Dự án: Hệ thống EdTech & AI Writing Assistant

Tài liệu này đặc tả chi tiết toàn bộ nội dung văn bản (Text Content), cấu trúc phân bổ luồng (Layout Grid) và định hướng áp dụng hệ thống thành phần từ thư viện **shadcn/ui** nhằm xây dựng một trang Landing Page hiện đại, tối ưu tỷ lệ chuyển đổi cao.

---

## 1. THÔNG SỐ THIẾT KẾ TỔNG QUAN (DESIGN SYSTEM SUMMARY)

* **Phong cách thiết kế:** Hiện đại, Tối giản (Modern Minimalist), chú trọng khoảng trắng (Whitespace) để tạo độ thoáng cho thị giác.
* **Bảng màu chủ đạo (Theme):**
* *Nền chính:* Trắng (`bg-background`) và Xám nhẹ (`bg-muted/40`).
* *Màu thương hiệu chính:* Xanh Chàm Indigo / Xanh Dương Đậm (`text-primary` / `bg-primary`).
* *Màu tạo điểm nhấn:* Xanh Ngọc Mint hoặc Tím Violet (Dành cho các badge hoặc hiệu ứng gradient nhẹ).


* **Thành phần UI:** Toàn bộ nút, khung nhập liệu, bảng biểu được module hóa theo tiêu chuẩn thiết kế của thư viện **shadcn/ui**.

---

## 2. CHI TIẾT BỐ CỤC VÀ NỘI DUNG TỪNG PHÂN HỆ (SECTION-BY-SECTION SPECIFICATION)

### 2.1. Thanh điều hướng (Navigation Bar)

* **Bố cục (Layout):** Thanh ngang cố định ở trên cùng (Sticky Header), nền mờ hiệu ứng kính cường lực (`backdrop-blur-md`), có đường viền kẻ mờ phía dưới (`border-b`).
* **Vị trí thành phần:** * *Bên trái:* Logo hệ thống "Engducation ❄️" (Font chữ đậm, kèm icon định dạng SVG tối giản).
* *Ở giữa:* Các liên kết điều hướng nhanh bao gồm: Tính năng, Trải nghiệm AI, Bảng giá, Lộ trình học.
* *Bên phải:* Cụm nút hành động.


* **Component shadcn/ui áp dụng:** `NavigationMenu` (Cho các liên kết điều hướng), `Button` (Cho nút hành động).
* **Nội dung văn bản (Text content):**
* Nút phụ: "Đăng nhập" (Kiểu nút: `variant="ghost"`).
* Nút chính: "Bắt đầu miễn phí" (Kiểu nút: `variant="default"`).



---

### 2.2. Phân hệ Đầu trang (Hero Section)

* **Bố cục (Layout):** Chia làm 2 cột trên màn hình máy tính (Cột trái chiếm 55% chứa text, cột phải chiếm 45% chứa ảnh minh họa/giao diện chụp màn hình). Trên điện thoại tự động chuyển thành 1 cột dọc đứng.
* **Thành phần UI:** Sử dụng các thẻ Badge nhỏ nằm phía trên tiêu đề chính để thu hút sự chú ý.
* **Component shadcn/ui áp dụng:** `Badge` (Đánh dấu phiên bản hoặc thông báo), `Button`.
* **Nội dung văn bản (Text content):**
* *Nội dung Badge:* "Phiên bản 1.0 — Tích hợp mô hình GPT-4o và Perplexity API mới nhất"
* *Tiêu đề chính (Headline):* "Làm Chủ Kỹ Năng Viết Tiếng Anh Với Trợ Lý Trí Tuệ Nhân Tạo 24/7"
* *Tiêu đề phụ (Sub-headline):* "Nền tảng học tập trực tuyến đột phá. Học ngữ pháp qua video chất lượng cao, làm quiz tương tác và nâng tầm bài viết luận ngay lập tức với công nghệ AI sửa lỗi thông minh."
* *Nút hành động chính (CTA 1):* "Thử AI sửa lỗi ngay" (Màu Indigo nổi bật).
* *Nút hành động phụ (CTA 2):* "Xem video giới thiệu" (Dạng viền `variant="outline"` kèm icon Play).



---

### 2.3. Phân hệ Tính năng cốt lõi (Core Features Section)

* **Bố cục (Layout):** Lưới 3 cột đều nhau (`grid grid-cols-1 md:grid-cols-3 gap-8`). Mỗi cột là một thẻ thông tin độc lập có hiệu ứng đổ bóng nhẹ khi di chuột qua (Hover effect).
* **Component shadcn/ui áp dụng:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`.
* **Nội dung văn bản (Text content):**
* **Thẻ số 1: Bài giảng Video chất lượng cao**
* *Tiêu đề:* "Học Tập Trực Quan Qua Video"
* *Mô tả:* "Hệ thống bài giảng ngữ pháp và từ vựng phân cấp rõ ràng. Tích hợp công nghệ lưu trữ dữ liệu đám mây Cloudinary giúp truyền tải video mượt mà, không giật lag ở độ phân giải cao."


* **Thẻ số 2: Kho bài tập Quiz tương tác**
* *Tiêu đề:* "Luyện Tập Với Quiz Trắc Nghiệm"
* *Mô tả:* "Học đi đôi với hành. Hệ thống câu hỏi trắc nghiệm được thiết kế ngay sau mỗi bài học, giúp bạn củng cố kiến thức ngữ pháp và ghi nhớ từ vựng theo danh mục một cách khoa học."


* **Thẻ số 3: Trợ lý AI Writing thông minh**
* *Tiêu đề:* "Sửa Lỗi & Nâng Cấp Văn Phong AI"
* *Mô tả:* "Tiếp nhận văn bản, phân tích chuyên sâu qua Prompt Engineering để trả về kết quả so sánh lỗi chính tả, ngữ pháp và gợi ý thay đổi từ vựng theo các phong cách hành văn chuyên nghiệp."





---

### 2.4. Phân hệ Trải nghiệm thực tế (Interactive AI Demo Section)

* **Bố cục (Layout):** Thiết kế dạng một khung làm việc (Workspace) tập trung ở giữa trang (`max-w-4xl mx-auto`). Mô phỏng giao diện ứng dụng thực tế để kích thích người dùng dùng thử mà không cần đăng ký tài khoản trước.
* **Thành phần UI:** Một ô nhập văn bản lớn, một nút bấm kích hoạt xử lý bên dưới. Phía dưới cùng hiển thị kết quả phân tích chia làm 2 vùng đối chiếu trực quan.
* **Component shadcn/ui áp dụng:** `Tabs` (Chuyển đổi giữa chế độ Nhập liệu và Xem kết quả giải thích), `Textarea` (Khung nhập văn bản), `Button`, `Skeleton` (Hiển thị hiệu ứng tải dữ liệu giả lập khi AI đang xử lý).
* **Nội dung văn bản (Text content):**
* *Tiêu đề phân hệ:* "Trải nghiệm ngay sức mạnh của AI"
* *Mô tả ngắn:* "Nhập một đoạn văn tiếng Anh bất kỳ có lỗi sai vào ô bên dưới, hệ thống sẽ chỉ ra lỗi sai và tối ưu lại giúp bạn."
* *Nội dung văn bản gợi ý (Placeholder trong Textarea):* "Ví dụ: She go to school yesterday and she forget her book..."
* *Nội dung văn bản trên nút bấm:* "Phân tích bài viết bằng AI"
* *Tiêu đề vùng kết quả:* * "Văn bản đã tối ưu ngữ pháp" (Hiển thị chữ màu xanh lá).
* "Giải thích chi tiết từ chuyên gia AI" (Hiển thị các gạch đầu dòng phân tích lỗi cấu trúc, ví dụ: sửa 'go' thành 'went' do mệnh đề ở thì quá khứ).





---

### 2.5. Phân hệ Bảng giá và Gói dịch vụ (Pricing Pricing Section)

* **Bố cục (Layout):** Lưới 2 cột tương phản cao đặt ở trung tâm. Gói trả phí (Premium) được thiết kế kích thước lớn hơn một chút so với gói Miễn phí để tạo hiệu ứng tâm lý thị giác (Visual Anchor).
* **Component shadcn/ui áp dụng:** `Card`, `Button`, `Separator` (Đường kẻ phân tách các quyền lợi).
* **Nội dung văn bản (Text content):**
* **Cột 1: Gói Cơ Bản (Free Account)**
* *Giá tiền:* "0đ / Tháng"
* *Quyền lợi bao gồm:*
* Xem các video bài giảng công khai.
* Làm bài tập Quiz cơ bản theo danh mục công khai.
* Trải nghiệm giới hạn tính năng AI Writing Assistant (Hạn mức khắt khe theo ngày).


* *Nút hành động:* "Sử dụng miễn phí" (`variant="outline"`, chiều rộng toàn màn hình `w-full`).


* **Cột 2: Gói Cao Cấp (Premium Pro) — [Có gắn thêm Badge "Khuyên Dùng"]**
* *Giá tiền:* "199.000đ / Tháng"
* *Quyền lợi bao gồm:*
* Truy cập toàn bộ kho khóa học và video bài giảng chuyên sâu.
* Không giới hạn số lượt làm bài tập Quiz trắc nghiệm nâng cao.
* Sử dụng toàn diện AI Writing Assistant (Không giới hạn ký tự, ưu tiên tốc độ xử lý từ API OpenAI/Perplexity).
* Mở khóa Dashboard theo dõi tiến độ học tập và lịch sử sửa lỗi chi tiết.
* Tự động kích hoạt tài khoản ngay sau khi thanh toán thành công.


* *Nút hành động:* "Nâng cấp Premium ngay" (`variant="default"`, màu nền Indigo rực rỡ, hiệu ứng đổ bóng chìm).





---

### 2.6. Phân hệ Chân trang (Footer)

* **Bố cục (Layout):** Cấu trúc 4 cột truyền thống. Dòng bản quyền chạy ngang dưới cùng ngăn cách bằng đường kẻ thanh mảnh.
* **Nội dung văn bản (Text content):**
* *Cột 1:* Giới thiệu ngắn về dự án "Engducation ❄️ - Nền tảng học tập trực tuyến tích hợp AI sửa lỗi ngữ pháp toàn diện."
* *Cột 2 (Sản phẩm):* Khóa học, Tính năng AI, Bài tập Quiz, Bảng giá.
* *Cột 3 (Chính sách):* Điều khoản dịch vụ, Chính sách bảo mật dữ liệu cá nhân JWT, Cơ chế hoàn tiền.
* *Cột 4 (Liên hệ):* Đội ngũ phát triển dự án EdTech AI.
* *Dòng cuối cùng:* "© 2026 Engducation. Toàn bộ bản quyền hệ thống được bảo lưu."



---

## 3. CHI TIẾT TRẢI NGHIỆM NGƯỜI DÙNG (UX TWEAKS & RATE LIMIT NOTICE)

Để tối ưu hóa trải nghiệm thực tế và tránh rủi ro lạm dụng hệ thống làm tiêu hao ngân sách API, các chỉ dẫn thiết kế UX sau cần được tuân thủ chặt chẽ trên Landing Page:

* **Thông báo giới hạn tần suất (Rate Limit Alert):** Khi người dùng chưa đăng nhập cố tình bấm gọi API Demo quá 5 lần trong vòng 15 phút, giao diện sẽ xuất hiện một hộp thoại thông báo lỗi tinh tế của `shadcn/ui` tên là `Alert` hoặc thông báo đẩy `Toast`.
* *Tiêu đề Alert:* "Hạn mức thử nghiệm tạm thời đã hết"
* *Nội dung chi tiết:* "Để đảm bảo tài nguyên hệ thống, tính năng demo không đăng nhập bị giới hạn tần suất truy cập. Vui lòng đăng ký tài khoản miễn phí hoặc nâng cấp gói Premium để tiếp tục sử dụng không giới hạn."


* **Trạng thái tải dữ liệu mượt mà (Smooth Loading States):** Trong quá trình nút bấm phân tích AI hoạt động, văn bản trên nút chuyển thành "Hệ thống AI đang phân tích..." kèm biểu tượng xoay nhẹ (Spinner), đồng thời vùng hiển thị kết quả bên dưới xuất hiện các thanh xám mờ chuyển động (`Skeleton`) tạo cảm giác hệ thống đang tính toán theo thời gian thực một cách chân thực.