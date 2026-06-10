# User/Student Codebase Documentation

Tài liệu này mô tả cấu trúc codebase cho phân hệ **User/Student** trong ứng dụng `engducationgroup`.

---

## 1. Tổng Quan Kiến Trúc

Phân hệ Student được xây dựng theo mô hình **Feature-Driven Architecture** với Next.js App Router:

```
[UI Components / Pages]
        ↓
[Custom Hooks (TanStack Query)]
        ↓
[API Client Layer / Server Actions]
        ↓
[API Routes / Server Actions]
        ↓
[Service Layer]
        ↓
[Database (Drizzle ORM)]
```

---

## 2. Cấu Trúc Thư Mục

```
apps/web/src/features/
├── learning-content/           # Learning Content Feature
│   ├── actions.ts           # Server Actions (mutations)
│   ├── index.ts            # Feature exports
│   │
│   ├── api/               # API Client Layer (if needed)
│   │   └── ...
│   │
│   ├── components/         # Feature-specific components
│   │   └── ...
│   │
│   ├── hooks/             # Custom Hooks
│   │   ├── useQuizEngine.ts      # Quiz engine state management
│   │   ├── useProgressTracking.ts # Progress tracking
│   │   └── useStudentLearning.ts  # Student learning state
│   │
│   ├── services/          # Service Layer
│   │   ├── course.service.ts      # Course data fetching
│   │   ├── lesson.service.ts      # Lesson data
│   │   ├── quiz.service.ts       # Quiz logic + scoring
│   │   ├── order.service.ts      # Order management
│   │   └── cloudinary.service.ts # Video URL generation
│   │
│   └── types/             # Type definitions
│       ├── index.ts
│       └── schemas.ts     # Zod schemas
│
├── vocabulary/              # Vocabulary Feature
│   ├── actions.ts        # Server Actions
│   ├── index.ts
│   ├── hooks/
│   │   └── useVocabulary.ts
│   ├── services/
│   │   └── vocabulary.service.ts
│   └── types/
│       └── schemas.ts
│
└── admin/                   # (Xem docs_admin.md)

apps/web/src/app/(student)/    # Student Route Group
├── layout.tsx               # Student layout (sidebar, header)
├── dashboard/
│   └── page.tsx            # Student dashboard
├── learn/
│   └── [courseId]/
│       └── page.tsx       # Learning page (video, text, quiz)
├── notebook/
│   └── page.tsx           # Vocabulary notebook
└── ai-assistant/
    └── page.tsx           # AI writing assistant

apps/web/src/app/api/
├── (student)/
│   └── ...
├── orders/
│   └── route.ts           # Order creation API
└── ...
```

---

## 3. Chi Tiết Các Tầng

### 3.1 Service Layer (`services/`)

#### **course.service.ts**
- `getPublishedCourses()` - Lấy danh sách khóa học đã xuất bản
- `getCourseDetails(courseId)` - Chi tiết khóa học
- `getCourseProgress(courseId, userId)` - Tiến độ học của user
- Types: `CourseWithProgress`, `LessonProgress`

#### **lesson.service.ts**
- `getLessonDetails(lessonId)` - Chi tiết bài học
- `getLessonContent(lessonId)` - Nội dung bài học (text/video/quiz)
- `markLessonComplete(lessonId, userId)` - Đánh dấu hoàn thành
- Types: `LessonContent`, `LessonType`

#### **quiz.service.ts**
- `getQuizQuestions(lessonId)` - Lấy câu hỏi quiz
- `submitQuiz(lessonId, answers)` - Nộp quiz
- `calculateScore(quizId, answers)` - Tính điểm
- `canRetakeQuiz(lessonId, userId)` - Kiểm tra có được thi lại không
- Types: `QuizQuestion`, `QuizAnswer`, `QuizResult`

#### **order.service.ts**
- `createOrder(userId, packageType)` - Tạo đơn hàng
- `getUserOrders(userId)` - Lấy đơn hàng của user
- `checkSubscription(userId)` - Kiểm tra subscription
- Types: `Order`, `PackageType`

#### **cloudinary.service.ts**
- `getSignedVideoUrl(publicId)` - Tạo signed URL cho video
- `getVideoMetadata(publicId)` - Lấy metadata video
- Types: `VideoMetadata`

### 3.2 Custom Hooks (`hooks/`)

#### **useQuizEngine.ts**
```typescript
interface QuizEngineState {
  currentQuestion: number;
  answers: Record<string, number>;
  timeSpent: number;
  isSubmitted: boolean;
  score: number | null;
}

// Methods:
- startQuiz()
- selectAnswer(questionId, optionIndex)
- nextQuestion()
- previousQuestion()
- submitQuiz()
- resetQuiz()
```

#### **useProgressTracking.ts**
```typescript
// Methods:
- trackLessonView(lessonId)
- trackVideoProgress(lessonId, progress)
- trackQuizAttempt(lessonId, score)
- getCourseProgress(courseId)
- markLessonComplete(lessonId)
```

#### **useStudentLearning.ts**
```typescript
// Methods:
- loadCourse(courseId)
- loadLesson(lessonId)
- completeLesson(lessonId)
- getNextLesson(courseId)
- getPreviousLesson(courseId)
```

### 3.3 Server Actions (`actions.ts`)

#### **learning-content/actions.ts**
```typescript
// Lesson completion
async function completeLesson(lessonId: string): Promise<{ success: boolean }>

// Quiz submission
async function submitQuizAttempt(data: {
  lessonId: string;
  answers: Record<string, number>;
}): Promise<QuizResult>

// Writing submission
async function submitWriting(data: {
  lessonId: string;
  content: string;
}): Promise<{ success: boolean; submissionId: string }>

// AI grading request
async function requestAiGrading(submissionId: string): Promise<{
  success: boolean;
  feedback: string;
  score: number;
}>

// Progress tracking
async function trackProgress(data: {
  lessonId: string;
  progress: number;
}): Promise<{ success: boolean }>
```

#### **vocabulary/actions.ts**
```typescript
// Add word to notebook
async function addToNotebook(wordId: string): Promise<{ success: boolean }>

// Remove from notebook
async function removeFromNotebook(notebookId: string): Promise<{ success: boolean }>

// Update word status
async function updateWordStatus(
  notebookId: string,
  status: "LEARNING" | "MASTERED" | "REVIEW"
): Promise<{ success: boolean }>

// Get notebook
async function getStudentNotebook(): Promise<NotebookWord[]>
```

---

## 4. Chi Tiết Các Trang

### 4.1 Student Dashboard (`(student)/dashboard/page.tsx`)

**Chức năng:**
- Hiển thị khóa học đã đăng ký
- Progress bar cho mỗi khóa học
- Quick actions (tiếp tục học, xem notebook)
- Subscription status

**Components sử dụng:**
- `CourseCard` - Hiển thị khóa học với progress
- `SubscriptionBadge` - Trạng thái subscription
- `RecentActivity` - Hoạt động gần đây

### 4.2 Learning Page (`(student)/learn/[courseId]/page.tsx`)

**Chức năng:**
- Hiển thị nội dung bài học (text/video/quiz/writing)
- Navigation giữa các bài học
- Progress tracking
- Sidebar với lesson list

**Components sử dụng:**
- `LessonContent` - Render nội dung theo type
- `VideoPlayer` - Video player cho bài học video
- `QuizEngine` - Quiz engine với timer
- `WritingEditor` - Editor cho bài viết
- `LessonSidebar` - Sidebar navigation

### 4.3 Vocabulary Notebook (`(student)/notebook/page.tsx`)

**Chức năng:**
- Hiển thị từ vựng đã học
- Filter theo status (learning/mastered/review)
- Search từ vựng
- Flashcard mode

**Components sử dụng:**
- `VocabularyList` - Danh sách từ vựng
- `VocabularyCard` - Card từ vựng
- `FlashcardView` - Chế độ flashcard
- `VocabularyFilter` - Filter controls

### 4.4 AI Assistant (`(student)/ai-assistant/page.tsx`)

**Chức năng:**
- Hỗ trợ viết với AI
- Feedback tự động cho writing
- Suggestions cải thiện

**Components sử dụng:**
- `WritingPrompt` - Hiển thị đề bài
- `AIFeedback` - Kết quả từ AI
- `WritingEditor` - Editor với AI integration

---

## 5. Luồng Xử Lý Chính

### 5.1 Học Bài Học

```
Student clicks "Học bài"
    ↓
useStudentLearning.loadLesson(lessonId)
    ↓
Server Action: getLessonContent(lessonId)
    ↓
Return lesson data (text/video/quiz/write)
    ↓
Render appropriate content component
    ↓
Student completes lesson
    ↓
completeLesson(lessonId)
    ↓
trackProgress() - Update database
    ↓
Show next lesson
```

### 5.2 Làm Quiz

```
Student starts quiz
    ↓
useQuizEngine.startQuiz()
    ↓
loadQuizQuestions(lessonId)
    ↓
Student answers questions
    ↓
selectAnswer(questionId, optionIndex)
    ↓
Student submits quiz
    ↓
submitQuizAttempt(lessonId, answers)
    ↓
calculateScore() in quiz.service.ts
    ↓
Return result with feedback
    ↓
useQuizEngine.setResult(result)
    ↓
Show score + correct answers
```

### 5.3 Nộp Bài Viết

```
Student writes essay
    ↓
submitWriting(lessonId, content)
    ↓
Server Action creates writingSubmission
    ↓
Student requests AI grading
    ↓
requestAiGrading(submissionId)
    ↓
Server Action:
  1. checkAiQuota(userId, writeId)
  2. Call AI API
  3. incrementAiUsage()
  4. Save feedback to submission
    ↓
Return AI feedback
    ↓
Show feedback to student
```

### 5.4 Học Từ Vựng

```
Student opens notebook
    ↓
getStudentNotebook()
    ↓
Display vocabulary list
    ↓
Student clicks "Học từ"
    ↓
FlashcardView activates
    ↓
Student marks word:
  - "Đã nhớ" → status = MASTERED
  - "Cần ôn lại" → status = LEARNING
  - "Bỏ" → removeFromNotebook()
    ↓
updateWordStatus()
    ↓
Update UI + database
```

---

## 6. Các Loại Dữ Liệu Quan Trọng

### LessonType
```typescript
type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING";
```

### QuizResult
```typescript
interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  feedback: string;
  correctAnswers: Record<string, number>;
  timeSpent: number;
}
```

### WritingSubmission
```typescript
interface WritingSubmission {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  status: "DRAFT" | "SUBMITTED" | "AI_GRADED" | "RESOLVED";
  aiScore: number | null;
  aiFeedback: string | null;
  teacherScore: number | null;
  teacherFeedback: string | null;
  aiRevisionsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription
```typescript
interface Subscription {
  userId: string;
  status: "ACTIVE" | "EXPIRED" | "NONE";
  expiresAt: Date | null;
  packageType: "MONTHLY" | "6_MONTH" | "YEAR";
}
```

---

## 7. Quy Tắc Quan Trọng

1. **Server Actions cho mutations** - Dùng Server Actions thay vì API routes cho mutations đơn giản
2. **TanStack Query cho caching** - Dùng useQuery/useMutation cho data fetching
3. **Optimistic updates** - Cập nhật UI trước khi server xác nhận
4. **Quiz state management** - Dùng useQuizEngine hook để quản lý state
5. **AI quota checking** - Luôn kiểm tra quota trước khi gọi AI

---

## 8. Debugging Tips

### Kiểm tra lỗi Quiz
1. Check `QuizEngine` state trong React DevTools
2. Verify answers được lưu đúng
3. Check `submitQuizAttempt` response

### Kiểm tra lỗi AI
1. Check quota: `getAiUsageRemaining()`
2. Verify AI API call logs
3. Check `aiApiLog` table

### Kiểm tra Progress
1. Check `lessonProgress` table
2. Verify `markLessonComplete` được gọi
3. Check progress bar calculation

---

## 9. Migration Guide

### Khi thêm loại bài học mới

1. Thêm type mới vào `LessonType`
2. Cập nhật `lesson.service.ts` để handle content
3. Tạo component mới trong `learning-content/components/`
4. Update `LessonContent` switch case
5. Thêm quiz logic nếu cần

### Khi thêm AI feature mới

1. Thêm quota check trong `ai-quota.service.ts`
2. Tạo Server Action mới
3. Update AI prompt trong `ai-prompt.service.ts`
4. Handle rate limiting và errors
