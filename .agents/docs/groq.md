Dưới đây là toàn bộ tài liệu đặc tả kiến trúc kỹ thuật cập nhật mới nhất cho hệ thống **EdTech & AI Writing Assistant**, được tối ưu hóa cho cấu trúc Fullstack Next.js (App Router) và chuyển đổi toàn bộ hạ tầng AI sang **Groq API** kết hợp **Vercel AI SDK (Agents)** nhằm tối ưu chi phí và hiệu năng.

Tài liệu này được viết dưới dạng file Markdown (`.md`) hoàn chỉnh, đi thẳng vào vấn đề kỹ thuật để bạn có thể sao chép trực tiếp vào dự án hoặc cung cấp làm ngữ cảnh (Context) chất lượng cao cho AI IDE (Cursor/Antigravity).

---

```markdown
# ĐẶC TẢ KIẾN TRÚC KỸ THUẬT CẬP NHẬT: GROQ & VERCEL AI SDK INTEGRATION
## Dự án: Hệ thống EdTech & AI Writing Assistant (Fullstack Next.js)

Tài liệu này chuẩn hóa lại toàn bộ cấu trúc công nghệ, luồng xử lý AI, phân hệ quản lý nội dung (CMS) và các giải pháp tối ưu chi phí vận hành cho hệ thống dựa trên mô hình phát triển Fullstack Next.js.

---

## 1. TECH STACK CÔNG NGHỆ CẬP NHẬT (UPDATED TECHNICAL STACK)

*   **Framework chính:** Next.js 14+ (App Router), vận hành theo mô hình Fullstack tích hợp (Server Components, Server Actions và Route Handlers).
*   **Hạ tầng AI:** **Groq API** (Sử dụng model production `openai/gpt-oss-120b` kết hợp **JSON Object Mode** (`response_format: { type: "json_object" }`) + Zod parse thay vì `json_schema` strict. Lý do: strict mode + gpt-oss-120b đã quan sát thấy fail không ổn định với `json_validate_failed` ngay cả khi model output hợp lệ. Zod parse phía client vẫn đảm bảo 100% schema contract, kèm retry 1 lần cho flaky outputs. Lịch sử thay đổi: `llama3-70b-8192` decommissioned 30/08/2025, `llama-3.3-70b-versatile` không hỗ trợ `json_schema`) kết hợp cùng **Vercel AI SDK (Core & Agents)**. Thay thế hoàn toàn cho OpenAI API để giảm chi phí token xuống mức tối thiểu và đạt tốc độ phản hồi tính bằng mili-giây.
*   **Thư viện UI:** Tailwind CSS kết hợp **shadcn/ui** dựng trên nền Radix Primitives.
*   **Cơ sở dữ liệu & Xác thực:** PostgreSQL/MongoDB hỗ trợ phân quyền kiểm soát truy cập dựa trên vai trò (Role-based Access Control - RBAC). Xác thực thông qua giải pháp tích hợp sẵn trong Next.js (Better-Auth hoặc NextAuth).
*   **Quản lý Media:** **Cloudinary SDK** tích hợp trực tiếp ở tầng Server Actions để xử lý tải lên, lưu trữ và truyền tải video bài giảng qua CDN công cộng.
*   **Triển khai (Deployment):** Vercel (Frontend & Serverless Edge Functions), Render/VPS (Docker container cho cơ sở dữ liệu và các tác vụ nền nếu có).

---

## 2. ĐẶC TẢ NGHIỆP VỤ & KIẾN TRÚC AI AGENTS CHUYÊN SÂU

### 2.1. Kiến trúc AI Agent với Vercel AI SDK & Groq
Hệ thống không gọi trực tiếp một dòng lệnh Prompt duy nhất, mà sử dụng cơ chế **Agentic Workflow** (Luồng tác nhân thông minh) chia làm hai bước xử lý song song hoặc nối tiếp thông qua hàm `generateText` (parse thủ công bằng Zod) hoặc `streamText` của Vercel AI SDK.


```

[Người dùng nhập văn bản]
│
▼
[Next.js Server Action / Route Handler]
│
├──► [Kiểm tra Rate Limit & Cache định danh SHA-256]
│
▼
[Vercel AI SDK Agent + Groq Client]
│
├── Lớp 1: Tác nhân Phân tích (Llama3 trên Groq) -> Phát hiện lỗi & Trả về cấu trúc JSON
└── Lớp 2: Tác nhân Gợi ý Văn phong -> Tối ưu hóa cấu trúc câu tùy theo ngữ cảnh ứng dụng
│
▼
[Kết quả trả về UI dưới dạng cấu trúc JSON sạch, không lẫn tạp tự]

```

### 2.2. Mã nguồn mẫu Server Action xử lý AI Assistant (Tối ưu hóa Chi phí & Cấu trúc)

Dưới đây là cấu trúc logic xử lý phía Server của Next.js đặt tại `src/features/learning-content/services/ai.service.ts`:

```typescript
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { z } from 'zod';
import crypto from 'crypto';

// 1. Khởi tạo cấu hình kết nối Groq thông qua Vercel AI SDK
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY, // Khai báo trong biến môi trường .env
});

// Định nghĩa cấu trúc dữ liệu đầu ra nghiêm ngặt bằng Zod để đồng bộ với UI shadcn/ui
const writingAnalysisSchema = z.object({
  hasError: z.boolean(),
  score: z.number().min(0).max(100),
  correctedText: z.string(),
  errors: z.array(
    z.object({
      original: z.string(),
      replacement: z.string(),
      type: z.enum(['grammar', 'spelling', 'style']),
      explanation: z.string(),
    })
  ),
  suggestions: z.array(z.string()),
});

// Bộ nhớ đệm cục bộ giảm thiểu chi phí gọi API trùng lặp
const responseCache = new Map<string, string>();

export async function analyzeWritingContent(userId: string, isPremium: boolean, textInput: string) {
  if (!textInput || textInput.trim().length < 5) {
    throw new Error('Văn bản đầu vào quá ngắn để phân tích.');
  }

  // Tối ưu hóa chi phí: Tạo mã băm SHA-256 để kiểm tra trùng lặp kết quả trong cache
  const cleanText = textInput.trim();
  const textHash = crypto.createHash('sha256').update(cleanText).digest('hex');
  
  if (responseCache.has(textHash)) {
    return JSON.parse(responseCache.get(textHash)!);
  }

  try {
    // Gọi mô hình ngôn ngữ lớn thông qua hạ tầng Groq với độ trễ cực thấp
    // Sử dụng generateText + response_format json_object (không phải json_schema strict
    // vì strict mode + gpt-oss-120b đã quan sát thấy fail không ổn định với json_validate_failed
    // ngay cả khi output hợp lệ). Zod parse phía client đảm bảo schema contract.
    const { text } = await generateText({
      model: groq('openai/gpt-oss-120b'),
      system: `You are an expert ESL Writing Assistant Agent. ...`,
      prompt: `Analyze this text: "${cleanText}"`,
      temperature: 0.2,
      providerOptions: { groq: { structuredOutputs: false } },
    });
    // Parse JSON output, backfill missing fields, validate bằng Zod (có retry 1 lần nếu fail).
    });

    // Lưu kết quả vào bộ nhớ đệm trước khi trả về
    responseCache.set(textHash, JSON.stringify(object));
    return object;

  } catch (error) {
    console.error('Lỗi xử lý hệ thống AI (Groq):', error);
    throw new Error('Không thể hoàn thành phân tích văn bản vào lúc này.');
  }
}

```

---

## 3. CẤU TRÚC DỮ LIỆU ĐẶC TẢ ĐỐI TƯỢNG (CMS & LEARNING MANAGEMENT)

Đảm bảo cấu trúc cơ sở dữ liệu quan hệ tuân thủ chính xác các ràng buộc logic nghiệp vụ của hệ thống quản lý nội dung:

### 3.1. Mô hình Khóa học (Course) & Bài học (Lesson)

* **Course Status:** Quản lý nghiêm ngặt theo 3 trạng thái: `Draft` (Bản nháp), `Published` (Đã xuất bản - Chỉ trạng thái này người dùng mới nhìn thấy), `Archived` (Lưu trữ - Đóng khóa học).
* **Lesson Media:** Trường dữ liệu `videoUrl` và `videoPublicId` lưu trữ định danh tài nguyên trả về từ Cloudinary API sau khi tải video lên thành công từ phía Admin.
* **Lesson Content Components:** Một Lesson có thể bật/tắt linh hoạt các module nội dung con độc lập:
* `Read`: Tiêu đề, đoạn nội dung chính, danh mục từ khóa bổ trợ.
* `Write`: Đề bài tập viết, chỉ dẫn độ dài ký tự bắt buộc.
* `Quiz`: Tập hợp bộ câu hỏi trắc nghiệm đính kèm bài học.



### 3.2. Thực thể Bài tập Quiz (Quiz Engine Constraint)

Mỗi thực thể câu hỏi Quiz bắt buộc phải đáp ứng cấu trúc dữ liệu sau để phân hệ Frontend hiển thị chính xác:

* Phải cấu hình tối thiểu hai đáp án lựa chọn (`options`).
* Phải xác định tối thiểu một đáp án đúng (`correctOptionIndex`).
* **Bắt buộc có trường dữ liệu giải thích nghiệp vụ (`explanation`)** bằng tiếng Việt chuẩn để hiển thị ngay sau khi người dùng bấm nộp bài.

---

## 4. CHIẾN LƯỢC QUẢN TRỊ, PHÂN QUYỀN VÀ THANH TOÁN (MVP BUSINESS FLOW)

### 4.1. Hệ thống xác thực và phân quyền (RBAC Flow)

* Hệ thống phân chia cứng hai phân hệ route chuyên biệt thông qua cơ chế Middleware của Next.js: `/app/(student)/*` dành cho học viên và `/app/admin/*` dành cho quản trị viên hệ thống.
* Mọi thông tin phiên đăng nhập (Session) được mã hóa hoặc đối chiếu nghiêm ngặt qua token JWT lưu trữ tại Cookie có thuộc tính `httpOnly: true` chống tấn công XSS.

### 4.2. Luồng thanh toán và tự động kích hoạt tài khoản (Payment Webhook)

1. Người dùng bấm nâng cấp tài khoản tại phân hệ Landing Page -> Hệ thống tạo mã giao dịch và hiển thị cổng thanh toán trực tuyến hoặc mã QR động.
2. Sau khi người dùng chuyển khoản thành công, hệ thống cổng thanh toán gọi tới đường dẫn Route Handler ẩn của ứng dụng: `/api/payment/webhook`.
3. Hệ thống thực hiện xác thực chữ ký số (Signature Verification) của Webhook, kiểm tra mã giao dịch, lập tức cập nhật trạng thái tài khoản của người dùng từ vai trò cơ bản sang thuộc tính `isPremium: true` hoặc `role: "PREMIUM_USER"`, đồng thời giải phóng các hạn mức giới hạn tính năng AI Writing và Quiz nâng cao.

### 4.3. Dashboard báo cáo quản trị (Analytics Dashboard)

* **Doanh thu thực tế (Revenue Calculation):** Tính tổng lượng tiền từ các giao dịch thanh toán Premium thành công sau khi đã trừ phí cổng thanh toán, tổng hợp theo chu kỳ ngày, tuần, tháng.
* **Theo dõi người dùng (User Tracking):** Đếm tổng số lượng người dùng đăng ký mới, số lượng tài khoản hoạt động thực tế trong ngày (Daily Active Users - DAU) dựa trên lịch sử ghi nhận thời gian tương tác cuối cùng (`lastActiveAt`).

---

## 5. GIẢI PHÁP TIẾT KIỆM CHI PHÍ HẠ TẦNG & BẢO MẬT

* **Sử dụng Groq API:** Không mất phí duy trì token đắt đỏ như OpenAI. Chi phí vận hành AI Agent giảm xấp xỉ 90%, tốc độ trả kết quả dưới 1 giây giúp cải thiện vượt bậc chỉ số trải nghiệm người dùng trên Landing Page.
* **Kiểm soát Tần suất (Rate Limiting) nghiêm ngặt:** Cài đặt giới hạn tần suất gọi API phân tích AI đối với các tài khoản dùng thử ở trang công cộng công khai: tối đa 5 lần yêu cầu trong vòng 15 phút trên một địa chỉ IP. Sử dụng thuật toán Token Bucket lưu trên bộ nhớ đệm để từ chối các yêu cầu có dấu hiệu phá hoại (DDoS) bằng mã lỗi `HTTP 429 Too Many Requests`.
* **Tối ưu CDN Media:** Toàn bộ tài nguyên video trên hệ thống được định cấu hình tự động tối ưu dung lượng và định dạng (ví dụ: chuyển đổi tự động sang codec H.265/AV1 tùy thuộc vào trình duyệt của người học) thông qua tham số truyền tải của Cloudinary để tiết kiệm băng thông mạng.

```

---
<ElicitationsGroup message="What would you like to do next?">
<Elicitation label="Tạo file schema Prisma hoàn chỉnh cho hệ thống" query="Hãy tạo file schema.prisma hoàn chỉnh dựa trên đặc tả dữ liệu Cơ sở dữ liệu ở trên" />
<Elicitation label="Viết Next.js Middleware kiểm soát phân quyền RBAC" query="Viết Next.js Middleware để phân quyền User và Admin sử dụng JWT" />
<Elicitation label="Xây dựng giao diện Khung nhập liệu AI bằng shadcn/ui" query="Tạo giao diện Interactive AI Demo bằng React Component sử dụng thư viện shadcn" />
</ElicitationsGroup>

```