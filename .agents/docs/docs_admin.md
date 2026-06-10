# Admin Codebase Documentation

Tài liệu này mô tả cấu trúc codebase cho phân hệ **Admin** trong ứng dụng `engducationgroup`.

---

## 1. Tổng Quan Kiến Trúc

Phân hệ Admin được xây dựng theo mô hình **Feature-Driven Architecture** với các tầng rõ ràng:

```
[UI Components / Pages]
        ↓
[Custom Hooks (TanStack Query)]
        ↓
[API Client Layer]
        ↓
[API Routes (Next.js)]
        ↓
[Service Layer]
        ↓
[Database (Drizzle ORM)]
```

---

## 2. Cấu Trúc Thư Mục

```
apps/web/src/features/admin/
├── api/                    # API Client Layer
│   ├── admin-api.ts       # Main API client object
│   ├── client.ts          # Axios client configuration
│   ├── endpoints.ts       # API endpoint definitions
│   └── route-helpers.ts   # Route handler utilities
│
├── hooks/                  # Custom Hooks
│   ├── use-admin-api.ts   # Admin data fetching hooks
│   └── use-api-query.ts   # Generic query hooks
│
├── services/               # Service Layer (Business Logic)
│   ├── index.ts           # Re-exports all services
│   │
│   │   # Course Management
│   ├── course.service.ts         # Course CRUD operations
│   │
│   │   # Module Management
│   ├── module.service.ts          # Module CRUD operations
│   │
│   │   # Lesson Management
│   ├── lesson.service.ts         # Lesson CRUD + content (read/write/video/quiz)
│   │
│   │   # Vocabulary Management (Module-specific)
│   ├── vocabulary-admin.service.ts # Vocabulary CRUD for modules
│   │
│   │   # Vocabulary Management (Global)
│   ├── vocabulary-global.service.ts # Global vocabulary CRUD
│   │
│   │   # Quiz Management
│   ├── quiz.service.ts          # Quiz + questions CRUD
│   │
│   │   # Order Management
│   ├── order.service.ts          # Order processing + subscription activation
│   │
│   │   # Review Management
│   ├── review.service.ts         # Course review management
│   │
│   │   # AI Management
│   ├── ai-prompt.service.ts     # AI prompt CRUD
│   ├── ai-quota.service.ts      # AI usage tracking + analytics
│   │
│   │   # Support System
│   ├── support.service.ts       # Support tickets + writing review
│   │
│   │   # User Management
│   ├── user-moderation.service.ts # User ban/unban + audit logs
│   │
│   │   # Integration Layer
│   └── admin-v2.service.ts      # Aggregated service (re-exports + workspace)
│
├── actions.ts             # Server Actions (CRUD operations)
└── actions-v2.ts          # Server Actions v2 (content management)

apps/web/src/app/admin/
├── layout.tsx              # Admin layout (sidebar, header)
├── page.tsx               # Admin dashboard home
├── dashboard/
│   └── page.tsx          # Dashboard overview
├── courses/
│   ├── page.tsx          # Course list management
│   └── [courseId]/
│       ├── content/
│       │   ├── page.tsx        # Server component wrapper
│       │   ├── workspace-client.tsx # Main workspace UI
│       │   └── components/     # Workspace UI components
│       │       ├── index.ts
│       │       ├── module-card.tsx
│       │       ├── lesson-card.tsx
│       │       ├── vocabulary-card.tsx
│       │       ├── module-form.tsx
│       │       ├── lesson-form.tsx
│       │       └── vocabulary-form.tsx
├── orders/
│   └── page.tsx          # Order management
├── reviews/
│   └── page.tsx          # Review management
└── moderation/
    └── page.tsx          # User moderation

apps/web/src/app/api/admin/
├── courses/
│   ├── route.ts              # GET list, POST create
│   └── [courseId]/
│       ├── route.ts          # GET one, PATCH update, DELETE
│       ├── publish/route.ts  # POST publish
│       ├── unpublish/route.ts # POST unpublish
│       └── archive/route.ts  # POST archive
├── lessons/
│   ├── route.ts              # POST create
│   └── [lessonId]/
│       ├── route.ts          # PATCH update, DELETE
│       ├── read/route.ts     # PUT upsert text content
│       ├── write/route.ts    # PUT upsert writing content
│       ├── video/route.ts    # PUT upsert video
│       └── quiz/route.ts     # PUT upsert quiz questions
├── modules/
│   ├── route.ts              # POST create
│   └── [moduleId]/
│       ├── route.ts         # PATCH update, DELETE
│       └── vocabulary/route.ts # Vocabulary CRUD
├── orders/
│   ├── route.ts             # GET list, POST manual create
│   ├── analytics/route.ts   # GET order analytics
│   ├── transaction-logs/route.ts # GET logs
│   └── [orderId]/
│       ├── approve/route.ts # POST approve
│       └── reject/route.ts  # POST reject
└── reviews/
    ├── route.ts             # GET list
    └── [reviewId]/
        ├── reply/route.ts  # POST reply
        └── status/route.ts # PATCH status
```

---

## 3. Chi Tiết Các Tầng

### 3.1 Service Layer (`services/`)

Mỗi service file chứa business logic cho một domain cụ thể:

#### **course.service.ts**
- `getAdminCourses()` - Lấy danh sách khóa học
- `createAdminCourse(input)` - Tạo khóa học mới
- `updateAdminCourse(courseId, input)` - Cập nhật khóa học
- `deleteAdminCourse(courseId)` - Xóa khóa học
- `publishCourse(courseId)` - Xuất bản khóa học
- `unpublishCourse(courseId)` - Bỏ xuất bản
- `archiveCourse(courseId)` - Lưu trữ khóa học
- Types: `PublicationStatus`, `AdminCourseInput`, `CourseStats`

#### **module.service.ts**
- `getModulesByCourse(courseId)` - Lấy modules theo khóa học
- `createAdminModule(input)` - Tạo module mới
- `updateAdminModule(moduleId, input)` - Cập nhật module
- `deleteAdminModule(moduleId)` - Xóa module
- Types: `AdminModuleInput`

#### **lesson.service.ts**
- `getLessonsByModule(moduleId)` - Lấy bài học theo module
- `createAdminLesson(input)` - Tạo bài học
- `updateAdminLesson(lessonId, input)` - Cập nhật bài học
- `deleteAdminLesson(lessonId)` - Xóa bài học
- **Content Management:**
  - `upsertLessonRead(lessonId, input)` - Tạo/cập nhật nội dung text
  - `upsertLessonWrite(lessonId, input)` - Tạo/cập nhật bài writing
  - `upsertLessonVideo(lessonId, input)` - Tạo/cập nhật video
  - `upsertLessonQuiz(lessonId, input)` - Tạo/cập nhật quiz
- Types: `AdminLessonInput`, `AdminQuizQuestionInput`

#### **vocabulary-admin.service.ts**
- `getVocabulariesByModule(moduleId)` - Lấy từ vựng theo module
- `createAdminModuleVocabulary(input)` - Tạo từ vựng
- `updateAdminModuleVocabulary(vocabularyId, input)` - Cập nhật
- `deleteAdminModuleVocabulary(vocabularyId)` - Xóa
- Types: `AdminModuleVocabularyInput`

#### **vocabulary-global.service.ts**
- `getVocabulary()` - Lấy tất cả từ vựng
- `createVocabulary(data)` - Tạo từ vựng mới
- `updateVocabulary(id, data)` - Cập nhật từ vựng
- `deleteVocabulary(id)` - Xóa từ vựng
- `bulkImportVocabulary(records)` - Nhập hàng loạt

#### **quiz.service.ts**
- `getQuizzes(lessonId)` - Lấy quizzes theo bài học
- `getQuizById(quizId)` - Lấy quiz theo ID
- `createQuiz(lessonId)` - Tạo quiz mới
- `deleteQuiz(id)` - Xóa quiz
- `getQuizQuestions(quizId)` - Lấy câu hỏi theo quiz
- `createQuizQuestion(data)` - Tạo câu hỏi
- `updateQuizQuestion(id, data)` - Cập nhật câu hỏi
- `deleteQuizQuestion(id)` - Xóa câu hỏi

#### **order.service.ts**
- `getAdminOrders()` - Lấy danh sách đơn hàng
- `createAdminManualOrder(userId, packageType, amount, adminId)` - Tạo đơn thủ công
- `approveAdminOrder(orderId, adminId)` - Duyệt đơn hàng
- `rejectAdminOrder(orderId, reason, adminId)` - Từ chối đơn hàng
- `getAdminOrderAnalytics()` - Thống kê đơn hàng
- `grantSubscriptionForOrderSuccess(orderId, adminId)` - Kích hoạt subscription
- Types: `OrderStatus`, `OrderStats`, `PackageDistribution`

#### **review.service.ts**
- `getAdminReviews()` - Lấy danh sách reviews
- `replyCourseReview(reviewId, reply)` - Trả lời review
- `updateReviewStatus(reviewId, status)` - Cập nhật trạng thái

#### **ai-prompt.service.ts**
- `getPrompts()` - Lấy danh sách prompts
- `createPrompt(data)` - Tạo prompt mới
- `updatePrompt(id, data)` - Cập nhật prompt
- `deletePrompt(id)` - Xóa prompt
- Types: `PromptInput`

#### **ai-quota.service.ts**
- `checkAiQuota(userId, writeId)` - Kiểm tra quota AI
- `incrementAiUsage(userId, writeId)` - Tăng usage counter
- `logAiApiCall(data)` - Log API call
- `getAiCostAnalytics()` - Thống kê chi phí AI
- Types: `QuotaCheckResult`, `AiCostAnalytics`, `CourseCost`, `ExerciseCost`

#### **support.service.ts**
- `createReviewTicket(input)` - Tạo ticket khiếu nại
- `getReviewTickets()` - Lấy danh sách tickets
- `resolveWritingReview(ticketId, score, feedback, teacherId)` - Giải quyết khiếu nại
- `createSupportTicket(input)` - Tạo ticket hỗ trợ
- `getSupportTickets()` - Lấy tickets hỗ trợ
- `getSupportTicketDetails(ticketId)` - Chi tiết ticket
- `updateTicketStatus(ticketId, status)` - Cập nhật status
- `replySupportTicket(ticketId, senderId, message)` - Trả lời ticket

#### **user-moderation.service.ts**
- `banUser(input)` - Khóa user
- `unbanUser(input)` - Mở khóa user
- `getUsersWithModeration()` - Lấy danh sách users (non-admin)
- `getSystemSettings()` - Lấy settings
- `updateSystemSetting(input)` - Cập nhật setting
- `getAdminAuditLogs(limit?)` - Lấy audit logs
- Types: `BanUserInput`, `UnbanUserInput`, `UpdateSystemSettingInput`

---

### 3.2 API Client Layer (`api/`)

#### **admin-api.ts**
Export object `adminApi` chứa tất cả API methods:
- Courses: `getCourses()`, `createCourse()`, `updateCourse()`, `deleteCourse()`, `publishCourse()`, `unpublishCourse()`, `archiveCourse()`
- Modules: `createModule()`, `updateModule()`, `deleteModule()`
- Lessons: `createLesson()`, `updateLesson()`, `deleteLesson()`, `upsertLessonRead()`, `upsertLessonWrite()`, `upsertLessonVideo()`, `upsertLessonQuiz()`
- Vocabulary: `getModuleVocabulary()`, `createModuleVocabulary()`, `updateModuleVocabulary()`, `deleteModuleVocabulary()`
- Orders: `getOrders()`, `getOrderAnalytics()`, `createManualOrder()`, `approveOrder()`, `rejectOrder()`, `getTransactionLogs()`
- Reviews: `getReviews()`, `replyReview()`, `updateReviewStatus()`

#### **client.ts**
Axios instance với interceptors cho request/response.

#### **endpoints.ts**
Định nghĩa URL endpoints:
```typescript
ADMIN_API_ENDPOINTS = {
  courses: "/api/admin/courses",
  courseDetail: (id) => `/api/admin/courses/${id}`,
  coursePublish: (id) => `/api/admin/courses/${id}/publish`,
  // ... more endpoints
}
```

---

### 3.3 Custom Hooks (`hooks/`)

#### **use-admin-api.ts**
- `useAdminDashboard()` - Dashboard data
- `useAdminCourses()` - Courses list
- `useAdminCourseContentWorkspace(courseId)` - Course workspace
- `useAdminOrders()` - Orders list
- `useAdminOrderAnalytics()` - Order analytics
- `useAdminReviews()` - Reviews list
- `useAdminTransactionLogs()` - Transaction logs

#### **use-api-query.ts**
Generic hook cho data fetching với TanStack Query.

---

### 3.4 Workspace Components (`courses/[courseId]/content/components/`)

Components được tách nhỏ để dễ bảo trì:

| Component | Mô tả |
|-----------|--------|
| `module-card.tsx` | Card hiển thị module với lessons và vocabularies |
| `lesson-card.tsx` | Card hiển thị bài học với badges |
| `vocabulary-card.tsx` | Card hiển thị từ vựng |
| `module-form.tsx` | Dialog tạo module mới |
| `lesson-form.tsx` | Dialog tạo/sửa bài học (text/video/quiz/writing) |
| `vocabulary-form.tsx` | Dialog tạo/sửa từ vựng |

---

## 4. Luồng Xử Lý Dữ Liệu

### 4.1 Tạo Khóa Học Mới

```
User clicks "Tạo khóa học"
    ↓
Dialog form filled
    ↓
handleCreateCourse() in page.tsx
    ↓
adminApi.createCourse(payload)
    ↓
POST /api/admin/courses
    ↓
createAdminCourse() in course.service.ts
    ↓
db.insert(course)
    ↓
Return created course
```

### 4.2 Xuất Bản Khóa Học (Cascade)

```
User clicks "Publish toàn khóa"
    ↓
handlePublishCourse() in workspace-client.tsx
    ↓
adminApi.publishCourse(courseId)
    ↓
POST /api/admin/courses/{courseId}/publish
    ↓
publishAdminCourse() in admin-v2.service.ts
    ↓
Transaction:
  - Update course.status = "PUBLISHED"
  - Update all modules.status = "PUBLISHED"  
  - Update all lessons.status = "PUBLISHED"
  - Update all vocabularies.status = "PUBLISHED"
    ↓
Return updated course
```

### 4.3 Duyệt Đơn Hàng

```
Admin clicks "Duyệt"
    ↓
adminApi.approveOrder(orderId)
    ↓
POST /api/admin/orders/{orderId}/approve
    ↓
approveAdminOrder() in order.service.ts
    ↓
grantSubscriptionForOrderSuccess()
    ↓
Transaction:
  - Update packageOrder.status = "SUCCESS"
  - Calculate new expiresAt for user
  - Update user.expiresAt
  - Insert subscriptionAuditLog
    ↓
Return success
```

---

## 5. Các Loại Dữ Liệu Quan Trọng

### PublicationStatus
```typescript
type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "PAUSED";
// PAUSED trên UI = ARCHIVED trong DB
```

### OrderStatus
```typescript
type OrderStatus = "PENDING" | "SUCCESS" | "FAILED";
```

### LessonType
```typescript
type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING";
```

---

## 6. Quy Tắc Quan Trọng

1. **Không viết business logic trong API routes** - Chỉ validate input, gọi service
2. **Không viết business logic trong UI components** - Chỉ handle user interaction, gọi API
3. **Service layer là nơi duy nhất** chứa business logic
4. **Dùng transaction** cho các operations có nhiều bước database
5. **Serialization functions** để chuyển đổi status từ DB (PAUSED ↔ ARCHIVED)
6. **File size limit: 250 lines** - Tách file nếu vượt quá

---

## 7. Debugging Tips

### Kiểm tra lỗi API
1. Mở DevTools → Network tab
2. Tìm request đến `/api/admin/*`
3. Check Response status và body

### Kiểm tra lỗi Service
1. Thêm console.log vào service function
2. Check stack trace trong terminal

### Kiểm tra lỗi Hooks
1. Check TanStack Query devtools
2. Verify cache invalidation

---

## 8. Migration Guide

### Khi thêm feature mới

1. Tạo service mới trong `services/`
2. Thêm API endpoint trong `app/api/admin/`
3. Thêm method vào `admin-api.ts`
4. Tạo custom hook nếu cần
5. Sử dụng component trong UI

### Khi refactor service

1. Cập nhật `index.ts` để export functions mới
2. Update `admin-v2.service.ts` để re-export
3. Verify tất cả consumers sử dụng đúng exports
