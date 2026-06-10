# ĐẶC TẢ GIAO DIỆN UI/UX: KHÔNG GIAN QUẢN LÝ KHÓA HỌC CHO ADMIN (COURSE WORKSPACE CMS)

Tài liệu này định hình cấu trúc Layout, tư duy UI/UX và quy tắc đồng bộ dữ liệu trạng thái cho tính năng Quản lý Khóa học (`Course Management`) thuộc phân hệ Admin trong ứng dụng Next.js Fullstack. Mục tiêu: Sử dụng 100% không gian màn hình hiển thị ngang, loại bỏ tình trạng chia cột chật chội, hỗ trợ AI IDE tự động tạo mã nguồn sạch, trực quan và chuẩn thẩm mỹ.

---

## 1. NGUYÊN TẮC TRẠNG THÁI DỮ LIỆU NGHIỆP VỤ (BUSINESS STATUS RULES)

Để đảm bảo tính toàn vẹn của dữ liệu và không làm gián đoạn trải nghiệm của học viên bên ngoài hệ thống, toàn bộ các thao tác CRUD (Thêm, Sửa, Xóa) phải tuân thủ tuyệt đối quy định trạng thái sau:

* **Mặc định Khởi tạo (Default Draft Status):** Mọi thực thể khi được tạo mới—bao gồm Khóa học (`Courses`), Chương học (`Modules`), Bài học (`Lessons`), Bài tập trắc nghiệm (`Quizzes`), Câu hỏi (`QuizQuestions`), và Bài tập viết (`Writings`)—đều mang giá trị trạng thái mặc định là `"draft"` trong cơ sở dữ liệu.
* **Nguyên tắc Cô lập Chỉnh sửa:** Trong suốt quá trình Admin thực hiện chỉnh sửa, thêm mới, hoặc xóa bỏ các cấu phần nội dung bên trong, trạng thái của thực thể đó vẫn giữ nguyên là `"draft"`. Hệ thống không tự động chuyển trạng thái khi chưa có lệnh xác nhận từ người quản trị.
* **Cơ chế Xuất bản Tập trung (Master Publish Trigger):** Thay đổi trạng thái sang `"published"` chỉ được kích hoạt duy nhất khi Admin nhấn vào nút **"Xuất bản Khóa học" (Publish Course)** tại Thanh điều hướng đầu trang. Khi lệnh này được gọi:
  * Hệ thống thực hiện cập nhật đồng loạt trạng thái từ `"draft"` sang `"published"` cho Khóa học đó và toàn bộ các thành phần phụ thuộc bên trong (Modules, Lessons, Quizzes) có đủ điều kiện hiển thị.
  * Ngược lại, khi nhấn nút **"Hủy xuất bản" (Unpublish Course)**, trạng thái của toàn bộ chuỗi dữ liệu sẽ hoàn tác về lại `"draft"`.

---

## 2. KIẾN TRÚC ĐIỀU HƯỚNG PHÂN TẦNG ĐỘNG (DYNAMIC LAYERED WORKSPACE)

Hệ thống loại bỏ hoàn toàn việc chia nhỏ màn hình Desktop thành 3 cột cố định (gây chật hẹp không gian nhập liệu). Thay vào đó, giao diện vận hành theo cơ chế **Chuyển vùng Render (Workspace Toggle Flow)** để tận dụng trọn vẹn 100% chiều ngang màn hình.

### TẦNG 1: SƠ ĐỒ LỘ TRÌNH KHÓA HỌC TỔNG QUAN (COURSE OUTLINE WORKSPACE)
* **Định vị file:** `src/features/learning-content/components/admin/admin-course-detail-view.tsx`
* **Layout:** Chiếm 100% chiều rộng của trang làm việc, hiển thị thoáng đãng dưới dạng cấu trúc dòng hoặc các khối thẻ gộp (`Accordion` từ Shadcn UI).

#### Thành phần Giao diện chính:
1. **Thanh Lệnh Đầu Trang (Master Header Banner):**
   * Hiển thị Tiêu đề khóa học hiện tại (`h1`, `font-bold`), đi kèm một `Badge` chỉ định trạng thái trực quan: Màu xám (`bg-muted text-muted-foreground`) nếu là *Draft*, hoặc màu xanh lục lá (`bg-emerald-500/10 text-emerald-500`) nếu đã *Published*.
   * Góc phải chứa cụm nút hành động: Nút `[Chỉnh sửa thông tin chung]` (Mở Dialog sửa Tên, Mô tả, Giá tiền, Ảnh bìa) và Nút `[Xuất bản Khóa học]` hoặc `[Hủy xuất bản]`.
2. **Danh sách Chương học (Module Accordion List):**
   * Sử dụng thẻ `Accordion` mở rộng toàn màn hình. Mỗi hàng Chương học đại diện cho một khối hộp bao bọc vững chãi, có khoảng đệm (`padding`) thưa để dễ thao tác.
   * Trên thanh tiêu đề của từng Chương học, bên phải hiển thị nút `[+ Thêm bài học mới]` và nút ba chấm cấu hình nhanh (Đổi tên, Xóa).
3. **Danh sách Bài học Bên trong (Lesson Row Stack):**
   * Khi mở rộng Chương học, các Bài học (`Lessons`) hiển thị dạng danh sách hàng ngang xếp chồng dọc (`flex flex-col gap-2`).
   * Mỗi dòng Bài học chứa: Ký hiệu phân loại bài học (`Badge` hoặc Icon đại diện cho `Video`, `Quiz`, hoặc `AI Writing`), Tiêu đề bài học và một Nút trọng tâm: **`[Cấu hình nội dung học liệu]`**.
   * **UX Trạng thái:** Khi bấm vào nút này, hệ thống sẽ ẩn toàn bộ Sơ đồ tổng quan để kích hoạt Tầng 3.

---

### TẦNG 2: KHÔNG GIAN LẬP TRÌNH HỌC LIỆU CHUYÊN SÂU (FULL-SCREEN SUB-WORKSPACE)
Giao diện này chiếm trọn 100% không gian độc quyền của màn hình để phục vụ các biểu mẫu nhập liệu phức tạp, loại bỏ hoàn toàn các yếu tố gây nhiễu xung quanh.

* **Thanh Điều hướng Quay lại (Sub-Workspace Header):**
   * Luôn ghim cố định ở đầu trang một nút bấm lớn: `← Quay lại sơ đồ khóa học: [Tên Khóa Học]`. Khi Admin bấm vào nút này, hệ thống hoàn tác trạng thái hiển thị để đưa họ quay lại Tầng 1.
* **Cơ chế Render Động:** Dựa trên cấu trúc kiểu dữ liệu (`type`) của bài học được chọn, hệ thống tải cấu trúc Form tương ứng bên dưới thanh điều hướng.

#### 🛠️ Giao diện Cấu hình Bài học Video (`type: 'video'`)
* **Định vị file:** `src/features/learning-content/components/admin/admin-lesson-manager.tsx`
* **Bố cục:** Lưới 2 cột nội bộ (`grid grid-cols-1 xl:grid-cols-2 gap-8`).
  * **Cột trái (Form nhập liệu):** Ô nhập Tiêu đề bài giảng, Mô tả nội dung. Bên dưới là khu vực Kéo-thả tải lên tệp tin video (`Cloudinary Upload Zone`) bo tròn viền nét đứt. Khi đang tải, hiển thị một thanh tiến trình chạy mượt mà (`Progress` component từ Shadcn).
  * **Cột phải (Player Preview):** Khung hiển thị trình phát Video thu nhỏ. Ngay sau khi video tải lên thành công và trả về URL từ Cloudinary, video sẽ được nạp trực tiếp vào đây để Admin xem thử chất lượng hiển thị và âm thanh trước khi nhấn Lưu.

#### 🛠️ Giao diện Cấu hình Bài tập Trắc nghiệm (`type: 'quiz'`)
* **Định vị file:** `src/features/learning-content/components/admin/admin-quiz-builder.tsx`
* **Bố cục:** Lưới chia tỷ lệ không đối xứng (`grid grid-cols-12 gap-6`).
  * **Cột Danh mục Câu hỏi (Chiếm 3 cột - Grid Span 3):** Hiển thị danh sách số thứ tự câu hỏi dạng lưới thẻ nhỏ xếp dọc (Câu 1, Câu 2, Câu 3,...). Câu hỏi nào đang được chọn chỉnh sửa sẽ sáng viền xanh đậm (`border-primary`). Dưới cùng cột có nút lớn: `+ Thêm câu hỏi`.
  * **Cột Chi tiết Form (Chiếm 9 cột - Grid Span 9):**
    * Ô nhập nội dung câu hỏi chính và văn bản giải thích đáp án đúng (`Textarea` rộng rãi ở phía trên).
    * Khu vực Nhập Đáp án: Thiết lập một lưới $2 \times 2$ gồm 4 ô nhập text song song tương ứng với 4 đáp án A, B, C, D. Đầu mỗi ô text tích hợp một nút tròn `Radio Button` hoặc `Checkbox` giúp Admin nhấp chuột chọn trực tiếp đâu là đáp án chính xác của câu hỏi này. Bố cục này làm giảm tối đa chiều cao cuộn của trang web.

#### 🛠️ Giao diện Cấu hình Luyện viết AI (`type: 'write'`)
* **Định vị file:** `src/features/learning-content/components/admin/admin-writing-builder.tsx`
* **Bố cục:** Cấu trúc 2 phân vùng nội dung liền mạch.
  * **Phần 1 - Đề bài & Chỉ thị Hệ thống (Cấu hình Prompt):**
    * Form nhập tiêu đề bài viết, yêu cầu giới hạn số lượng từ tối thiểu/tối đa.
    * Hộp nhập liệu lớn dành cho **System Prompt Engineering**. Đây là không gian để Admin thiết lập cấu trúc câu lệnh điều hướng AI chuyên sâu cho riêng bài học đó (Ví dụ: *"Bạn là giám khảo IELTS Writing Task 2. Hãy phân tích đoạn văn sau..."*).
  * **Phần 2 - Hộp công cụ Chạy thử nghiệm Prompt (AI Playground Tool):**
    * Thiết kế một widget chia đôi màn hình giả lập. Một ô cho phép Admin nhập văn bản lỗi ngẫu nhiên do mình tự nghĩ ra, kế bên là nút `[Chạy thử nghiệm Prompt AI]`.
    * Khi click, hệ thống gọi trực tiếp đến API xử lý AI để xuất kết quả phân tích lỗi ngay tại màn hình quản trị. Giúp Admin tinh chỉnh, tối ưu câu lệnh prompt đạt độ chính xác cao nhất trước khi lưu lại.

---

## 3. QUY TẮC PHÁT TRIỂN & KIỂM SOÁT CHẤT LƯỢNG UI (AI IDE GENERATION RULES)

Để bảo vệ cấu trúc mã nguồn luôn sạch (`Clean Code`), tuân thủ nguyên lý `SOLID` và triết lý `DRY`, AI IDE khi sinh mã nguồn cho module này phải tuân thủ nghiêm ngặt các điều kiện sau:

1. **Tuyệt đối không gộp mã nguồn:** Cấm viết toàn bộ luồng hiển thị của Tầng 1 và các Form cấu hình của Tầng 2 vào trong cùng một file `page.tsx` duy nhất. Tệp `page.tsx` tại thư mục định tuyến chỉ thực hiện nhiệm vụ bóc tách các tham số ID khóa học từ URL (`courseId`, `lessonId`), sau đó đóng vai trò bọc lớp dữ liệu.
2. **Phân rã linh kiện đơn nhiệm (Single Responsibility):** Toàn bộ giao diện phải được chia nhỏ thành các tệp tin linh kiện biệt lập nằm trong thư mục `src/features/learning-content/components/admin/` như đã định vị ở mục 2. Không một file component giao diện nào được vượt quá kích thước **250 dòng code**.
3. **Quản lý Lưu trữ Tạm thời (Sticky Action Bar):** Để ngăn chặn việc cuộn trang làm khuất mất các thao tác cốt lõi, nút `[Lưu Thay Đổi]` và nút `[Hủy bỏ]` của tất cả các Form thuộc Tầng 2 phải được ghim cố định ở chân trang (`fixed bottom-0 right-0 w-full bg-background border-t`). Thanh này chỉ xuất hiện khi biểu mẫu ghi nhận có sự thay đổi dữ liệu từ phía Admin (`formState.isDirty`).