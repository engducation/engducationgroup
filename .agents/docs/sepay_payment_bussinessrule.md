Dưới đây là file đặc tả tài liệu cấu trúc nghiệp vụ (`PAYMENT_SYSTEM.md`) cực kỳ chi tiết và toàn diện, tập trung sâu vào Business Logic và kiến trúc tích hợp cổng thanh toán tự động hóa SePay (Sandbox & Live Mode) cho hệ thống EdTech của bạn.

---

# 💳 HỆ THỐNG TỰ ĐỘNG HÓA THANH TOÁN QR CODE QUA SEPAY

Tài liệu này đặc tả toàn bộ quy trình nghiệp vụ (Business Logic), kiến trúc luồng dữ liệu (Data Flow) và giải pháp tích hợp kỹ thuật cổng thanh toán VietQR qua hệ thống SePay dành cho dự án EdTech (Next.js, Drizzle ORM, PostgreSQL).

---

## 1. KIẾN TRÚC KẾT NỐI VÀ XÁC THỰC BẢO MẬT VỚI SEPAY

Hệ thống sử dụng cơ chế xử lý bất đồng bộ thông qua **Webhook** để nhận tín hiệu biến động số dư tức thời từ SePay. Tiền của học viên chuyển khoản qua ngân hàng sẽ vào thẳng 100% tài khoản cá nhân/doanh nghiệp của Admin.

### 1.1 Luồng dữ liệu tổng thể (Happy Path)

```
[Học viên]                    [Hệ thống Server]                 [Hạ tầng SePay]
    │                                 │                                │
    │ 1. Chọn gói Premium             │                                │
    ├────────────────────────────────>│                                │
    │                                 │ 2. Sinh đơn (PENDING)          │
    │                                 │    Tạo mã nội dung: ENGPRM...  │
    │                                 │                                │
    │ 3. Hiển thị mã VietQR động      │                                │
    Active (Polling trạng thái)       │                                │
    │                                 │                                │
    │ 4. Học viên quét QR bằng Ngân hàng                               │
    │ ────────────────────────────────────────────────────────────────>│
    │                                 │                                │
    │                                 │ 5. Nhận biến động số dư        │
    │                                 │    Bắn HTTP POST (Webhook)     │
    │                                 │<───────────────────────────────┤
    │                                 │                                │
    │                                 │ 6. Xác thực HMAC-SHA256        │
    │                                 │    Khớp Mã đơn hàng & Số tiền  │
    │                                 │    Cập nhật Đơn hàng (SUCCESS) │
    │                                 │    Nâng cấp Role User Premium  │
    │                                 │                                │
    │                                 │ 7. Trả về {"success": true}    │
    │                                 │───────────────────────────────>│
    │ 8. Nhận tín hiệu kết thúc       │                                │
    │    Hiển thị Popup chúc mừng     │                                │
    |<────────────────────────────────┤                                │

```

### 1.2 Xác thực an toàn tuyệt đối với Chữ ký số HMAC-SHA256

Để ngăn chặn tối đa việc hacker mạo danh SePay bắn request khống (Fraud Request) nhằm trục lợi kích hoạt gói Premium miễn phí, hệ thống **bắt buộc** phải xác thực chữ ký bảo mật được cấu hình trên giao diện Webhook SePay:

1. **Chuỗi Secret Key:** Trên Dashboard SePay, hệ thống cấp một chuỗi ký tự mật mã dạng `whsec_xxxxxxxx`. Chuỗi này được lưu trữ bảo mật trong file `.env` của Server với biến `SEPAY_WEBHOOK_SECRET`.
2. **Cơ chế băm dữ liệu phía Server:** Khi SePay gửi payload biến động số dư, chữ ký số nằm ở HTTP Header `x-sepay-signature`. Phía Server Next.js không được dùng `request.json()` trước, mà bắt buộc phải đọc chuỗi văn bản thô dạng `request.text()`. Sử dụng thuật toán mã hóa một chiều `sha256` kết hợp `rawBody` và `SEPAY_WEBHOOK_SECRET` để tái tạo chữ ký và so khớp trực tiếp. Nếu không khớp, trả về mã lỗi `403 Forbidden` lập tức.

---

## 2. NGHIỆP VỤ CÁC GÓI TÀI KHOẢN SUBSCRIPTION

Hệ thống phân tách rõ ràng quyền hạn sử dụng tính năng dựa trên **Gói tài khoản (Role-based & Feature-based)** nhằm thúc đẩy tỷ lệ chuyển đổi đơn hàng.

### 2.1 Bảng so sánh tính năng và nghiệp vụ phân quyền

| Tính năng cốt lõi | Tài khoản miễn phí (Basic User) | Tài khoản trả phí (Premium Subscriber) |
| --- | --- | --- |
| **Học qua Video / Text** | Chỉ xem được các bài học đánh dấu `Miễn phí` hoặc chương mở đầu. | Truy cập 100% kho khóa học, bài giảng trên hệ thống. |
| **Bài tập trắc nghiệm (Quiz)** | Giới hạn xem giải thích đáp án chi tiết. | Mở khóa toàn bộ lời giải thích chi tiết, chấm điểm tự động. |
| **AI Writing Assistant** | Giới hạn **3 lượt chấm/ngày**. Không mở tính năng Highlight lỗi sai chi tiết. | **Mở khóa hoàn toàn**. Cung cấp tính năng Highlight lỗi sai, gợi ý lỗi đúng (`replacement`), giải thích chi tiết bằng tiếng Việt. |
| **Hạn mức AI nâng cao** | Tối đa bài viết dưới 100 từ. | Hỗ trợ bài viết chuyên sâu lên tới **500 từ/lần**. |

### 2.2 Logic chu kỳ gia hạn và hết hạn gói (Subscription Lifecycle)

* **Gói tháng (Monthly Plan):** Kích hoạt cộng thêm đúng **30 ngày** vào trường thời gian hết hạn (`premium_expires_at`) của tài khoản người dùng kể từ thời điểm Webhook xác nhận thành công.
* **Gói năm (Yearly Plan):** Kích hoạt cộng thêm **365 ngày**.
* **Logic cộng dồn (Stacking Subscription):** Nếu học viên đang còn 10 ngày Premium cũ nhưng tiếp tục mua gói tháng mới, hệ thống sẽ lấy ngày hết hạn hiện tại cộng dồn thêm 30 ngày (Tổng mới = 40 ngày), chứ không đè mất số ngày cũ của học viên.
* **Cơ chế quét hết hạn (Cron Job):** Một tiến trình tự động chạy vào lúc 00:00 mỗi ngày để kiểm tra: Nếu `premium_expires_at` nhỏ hơn thời gian hiện tại, hệ thống tự động chuyển Role người dùng từ `PREMIUM` quay trở về gói `USER` (Basic).

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU ĐỒNG BỘ THANH TOÁN (POSTGRESQL)

Cấu trúc bảng dữ liệu thiết lập qua Drizzle ORM để quản lý chặt chẽ chuỗi đơn hàng, chống trùng lặp dữ liệu, và thống kê doanh thu cho vai trò Admin.

### 3.1 Bảng Quản lý Đơn hàng (`orders`)

Lưu vết tất cả các yêu cầu nâng cấp gói do người dùng tạo ra trên giao diện.

* `id`: Chuỗi định danh duy nhất (Khóa chính).
* `user_id`: Liên kết ngoại tới bảng `users` để xác định ai mua.
* `order_code`: Mã đơn hàng duy nhất phục vụ bóc tách nội dung (Ví dụ: `ENGPRM178204`). Trường này bắt buộc phải đánh chỉ mục `UNIQUE` để tối ưu tốc độ tìm kiếm.
* `amount`: Số tiền của gói (Kiểu `integer`).
* `plan_type`: Loại gói đăng ký (`MONTHLY`, `YEARLY`).
* `status`: Trạng thái đơn hàng (`PENDING`, `SUCCESS`, `FAILED`, `EXPIRED`).

### 3.2 Bảng Nhật ký giao dịch SePay (`sepay_transactions`)

Lưu vết dữ liệu lịch sử thô do Webhook SePay bắn sang nhằm phục vụ công tác đối soát dữ liệu và ngăn chặn lỗ hổng Idempotency (gửi trùng request).

* `id`: Khóa chính (Lấy chính xác ID giao dịch số của SePay truyền qua, ví dụ: `92704`). Đánh dấu thuộc tính `UNIQUE`.
* `order_code`: Mã đơn hàng trích xuất được từ SePay.
* `amount_received`: Số tiền thực tế học viên đã chuyển khoản thành công.
* `gateway`: Ngân hàng nhận tiền (Ví dụ: `Vietcombank`).
* `transaction_date`: Thời gian giao dịch diễn ra từ phía ngân hàng.
* `raw_payload`: Toàn bộ nội dung chuỗi dữ liệu JSON thô thu được từ đối tượng Webhook để lưu vết.

---

## 4. QUY TRÌNH XỬ LÝ ENDPOINT WEBHOOK (BACKEND BUSINESS LOGIC)

Khi hệ thống SePay gửi request đến đường dẫn `/api/payment/sepay-webhook`, Server Backend xử lý theo luồng nghiệp vụ 5 bước tuần tự sau:

### ⚙️ Bước 1: Bộ lọc Chữ ký số (HMAC Validation Guard)

* Đọc chuỗi ký tự thô từ `request.text()`.
* Chạy mã băm `crypto.createHmac("sha256", process.env.SEPAY_WEBHOOK_SECRET)`.
* So sánh chuỗi kết quả với Header `x-sepay-signature`.
* **Hệ quả:** Nếu sai lệch, dừng luồng xử lý lập tức và trả về mã lỗi `403 Forbidden`. Không ghi log sâu để tránh tấn công từ chối dịch vụ (DDoS).

### ⚙️ Bước 2: Bộ lọc Chống lặp giao dịch (Idempotency Guard)

* Trích xuất trường `id` (ID giao dịch của SePay) từ Payload.
* Truy vấn nhanh trong bảng `sepay_transactions` xem ID này đã tồn tại chưa.
* **Hệ quả:** Nếu ID giao dịch này đã có trong Database, điều này chứng tỏ đây là một request gửi lại (Retry) do SePay không nhận được phản hồi kịp thời từ lượt gọi trước, hoặc do Admin ấn bấm nút Replay giao dịch cũ trên Dashboard SePay. Backend dừng xử lý nghiệp vụ, ngay lập tức trả về phản hồi mã thành công `HTTP 200 {"success": true}` để báo cho SePay biết hệ thống của bạn đã xử lý xong, ngăn chặn việc nhân đôi số ngày sử dụng Premium của người dùng.

### ⚙️ Bước 3: Tìm kiếm và Đối soát thông tin đơn hàng

* Lấy trường dữ liệu mã giao dịch chuyển khoản `code` trong Payload.
* Sử dụng câu lệnh truy vấn tìm bản ghi đơn hàng trong bảng `orders` khớp với `order_code`.
* Kiểm tra trạng thái đơn hàng: Nếu đơn hàng hiện tại đã có trạng thái là `SUCCESS`, dừng luồng xử lý và trả về `HTTP 200 {"success": true}`.
* Thực hiện so khớp số tiền đối soát tài chính: Kiểm tra xem số tiền học viên chuyển thực tế (`amount` từ SePay) có **bằng hoặc lớn hơn** giá trị số tiền hóa đơn ghi nhận trong bảng `orders` hay không. Nếu nhỏ hơn số tiền quy định, chuyển trạng thái đơn hàng thành `FAILED`, ghi log lỗi và dừng luồng.

### ⚙️ Bước 4: Chạy cơ chế Transaction cập nhật tài khoản (Atomic DB Update)

Để đảm bảo tính toàn vẹn của dữ liệu (ngăn chặn tình trạng lỗi Server làm cập nhật đơn hàng thành công nhưng người dùng không lên được Premium), toàn bộ logic bước này phải được bọc trong một câu lệnh giao dịch duy nhất (**Database Transaction**):

1. Cập nhật trạng thái đơn hàng trong bảng `orders` từ `PENDING` thành `SUCCESS`.
2. Ghi một bản ghi mới vào bảng nhật ký giao dịch `sepay_transactions` để khóa đầu mục chống lặp.
3. Truy vấn bảng `users` của người mua, tính toán chu kỳ cộng dồn ngày hết hạn gói học dựa trên trường dữ liệu `plan_type` của hóa đơn, sau đó cập nhật vai trò `role` người dùng thành **`PREMIUM`** (hoặc cập nhật trường quyền hạn học tập tương đương).

### ⚙️ Bước 5: Phản hồi kết quả về cho hạ tầng SePay

* Sau khi Transaction DB chạy thành công và không xảy ra xung đột lỗi, Backend kết xuất và trả về dữ liệu định dạng JSON thuần túy có nội dung chính xác là: **`{"success": true}`** với HTTP Status code **`200 OK`**.
* **Thời gian giới hạn:** Toàn bộ chuỗi xử lý trên bắt buộc phải phản hồi về cho SePay trong vòng **dưới 30 giây**. Nếu quá thời gian này, SePay sẽ coi là đường truyền thất bại và sẽ tự động gửi lại Webhook liên tục sau đó.

---

## 5. NGHIỆP VỤ QUẢN TRỊ ADMIN (CMS PAYMENT & ANALYTICS)

Phân hệ dành riêng cho vai trò quản trị viên (Role Admin) giúp quản lý dòng tiền thực tế, theo dõi hiệu quả kinh doanh của nền tảng giáo dục EdTech.

### 5.1 Quản lý danh sách giao dịch (Order Management Table)

Giao diện quản trị cung cấp một màn hình bộ lọc nâng cao danh sách toàn bộ hóa đơn (`orders`) và nhật ký `sepay_transactions`:

* **Trạng thái trực quan:** Hiển thị danh sách hóa đơn theo các nhãn màu (Màu cam: `PENDING`, Màu xanh lá: `SUCCESS`, Màu đỏ: `FAILED`).
* **Hành vi can thiệp thủ công (Manual Approve):** Đề phòng trường hợp học viên chuyển khoản đúng số tiền nhưng ghi sai ký tự nội dung chuyển khoản khiến SePay không thể tự bóc tách mã đơn hàng. Giao diện Admin cung cấp nút **"Duyệt thủ công"** bên cạnh các giao dịch vô chủ. Khi Admin ấn nút này, hệ thống sẽ kích hoạt một hàm dịch vụ nội bộ chạy lại luồng cập nhật Transaction DB giống như luồng Webhook để nâng cấp Premium ngay cho học viên mà không cần đợi tín hiệu tự động.

### 5.2 Biểu đồ Dashboard Báo cáo doanh thu (Revenue Analytics)

Hệ thống tổng hợp dữ liệu từ các bản ghi có trạng thái `SUCCESS` trong bảng `orders` để kết xuất các chỉ số tài chính theo thời gian thực:

* **Tổng doanh thu tích lũy (Total Revenue):** Tính tổng (`SUM`) của tất cả các hóa đơn thành công từ trước đến nay.
* **Doanh thu định kỳ (MRR - Monthly Recurring Revenue):** Thống kê và nhóm dữ liệu doanh thu thu được theo từng tháng để vẽ biểu đồ cột (Bar Chart) hiển thị xu hướng tăng trưởng dòng tiền của hệ thống.
* **Tỷ lệ chuyển đổi gói (Plan Conversion Rate):** Thống kê tỷ lệ phần trăm số lượng người dùng chọn mua Gói tháng so với Gói năm để Admin có phương án tối ưu chiến lược giá sản phẩm.
* **Theo dõi tăng trưởng người dùng thực tế:** Đếm số lượng (`COUNT`) các bản ghi người dùng có thuộc tính `role === 'PREMIUM'` đang hoạt động để Admin kiểm soát được quy mô hệ thống và tính toán chi phí token gọi sang Groq API hợp lý.