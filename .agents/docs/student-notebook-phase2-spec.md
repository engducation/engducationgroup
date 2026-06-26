# Sổ Từ Vựng — Phase 2: Ôn tập, Sắp xếp, UX

> Phần mở rộng của [`student-notebook-spec.md`](./student-notebook-spec.md) với 3 nhóm tính năng:
>
> - **Nhóm 1 — Ôn tập chủ động**: Flashcard SRS, Quiz, Spelling Practice
> - **Nhóm 2 — Sắp xếp thông minh**: Collections/Folders, Tags, Sort nâng cao, Mark Mastered
> - **Nhóm 5 — UX polish**: Bulk actions, Keyboard shortcuts, Pronunciation tooltip, Share collection
>
> Phase 1 (đã triển khai): hiển thị, tìm kiếm, lọc cơ bản, xóa, empty/no-results state.

---

## 1. Mục tiêu & Phạm vi

### 1.1 Vấn đề hiện tại

Phase 1 cung cấp "**bookmark list**" — sinh viên lưu từ nhưng **không có cơ chế ôn tập chủ động**. Dữ liệu ngày càng nhiều nhưng kiến thức không được củng cố → tỉ lệ quên tăng theo đường cong Ebbinghaus. Đây là lý do chính khiến sổ từ vựng trở nên "vô dụng" sau 1-2 tuần sử dụng.

### 1.2 Mục tiêu Phase 2

1. **Biến danh sách thành công cụ ôn tập**: có lịch ôn cá nhân hoá theo thuật toán Spaced Repetition (SRS).
2. **Đa dạng hóa hình thức luyện tập**: Flashcard → Quiz → Spelling → Match-the-pair, để chống nhàm chán.
3. **Giúp sinh viên tổ chức kho từ theo mục đích học**: collections, tags, mastered status.
4. **Tăng tốc thao tác**: bulk actions + keyboard shortcuts, giảm số click để hoàn thành một session học.

### 1.3 Người dùng mục tiêu

Sinh viên đã có ít nhất 5 từ trong sổ từ vựng, đang tích cực học (đăng nhập ≥ 3 lần/tuần).

### 1.4 Phi trong phạm vi (out of scope)

- AI Tutor / sinh câu ví dụ tự động (đề xuất Sprint 3 — chưa triển khai).
- Stats dashboard / biểu đồ tiến độ.
- Streak / daily goal / gamification.
- Export Anki / CSV.
- Mobile app.

---

## 2. Kiến trúc & Công nghệ

### 2.1 Stack giữ nguyên

- Next.js App Router + Server Components cho layout/SSR.
- Server Actions cho mutation (đã chuẩn hoá trong `features/vocabulary/actions.ts`).
- Drizzle ORM + Postgres (Neon).
- Tailwind + shadcn/ui (đã có sẵn `Button`, `Badge`, `Dialog`, `Select`, `Tooltip`, `Dropdown`, `Checkbox`).
- `lucide-react`, `sonner`.

### 2.2 Schema mới

Bốn bảng mới, đặt trong `apps/web/src/db/schema/learning-content.ts` (mở rộng file hiện tại) hoặc tách file `apps/web/src/db/schema/notebook.ts` nếu muốn tách concern.

#### 2.2.1 `vocabulary_review` — Lịch ôn SRS (mỗi từ 1 dòng / user)

```ts
export const vocabularyReview = pgTable("vocabulary_review", {
  id: text("id").primaryKey(),                 // nanoid
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  vocabularyId: text("vocabulary_id").notNull().references(() => vocabulary.id, { onDelete: "cascade" }),

  // SM-2 state
  easeFactor: real("ease_factor").default(2.5).notNull(), // hệ số dễ, mặc định 2.5
  intervalDays: integer("interval_days").default(0).notNull(), // khoảng cách đến lần ôn kế tiếp (ngày)
  repetition: integer("repetition").default(0).notNull(),    // số lần ôn liên tiếp đúng
  lapses: integer("lapses").default(0).notNull(),            // tổng số lần "Quên"

  // Scheduling
  dueAt: timestamp("due_at").defaultNow().notNull(),         // ngày-giờ đến hạn ôn
  lastReviewedAt: timestamp("last_reviewed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex("vocabulary_review_user_vocab_unique").on(t.userId, t.vocabularyId),
  index("vocabulary_review_due_idx").on(t.userId, t.dueAt),
]);
```

**Ràng buộc nghiệp vụ**:
- Mỗi cặp `(userId, vocabularyId)` chỉ có tối đa 1 dòng (`uniqueIndex`).
- `dueAt <= now()` ⇒ "đến hạn ôn" (review queue).
- Khi user lưu từ vào sổ tay: chưa tạo dòng review. Dòng review chỉ tạo khi user **mở flashcard lần đầu** cho từ đó (lazy init).

#### 2.2.2 `vocabulary_collection` — Bộ sưu tập do user tạo

```ts
export const vocabularyCollection = pgTable("vocabulary_collection", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),   // hex token (VD: "#0d9488", "#6366f1") để render badge
  isPublic: boolean("is_public").default(false).notNull(),   // dùng cho Share Collection (mục 5.4)
  shareSlug: varchar("share_slug", { length: 32 }),          // random slug nếu isPublic=true
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("vocabulary_collection_user_idx").on(t.userId),
  uniqueIndex("vocabulary_collection_user_name_unique").on(t.userId, t.name),
  uniqueIndex("vocabulary_collection_share_slug_unique").on(t.shareSlug),
]);
```

#### 2.2.3 `user_vocabulary_collection` — Join (user_vocabulary ↔ collection)

```ts
export const userVocabularyCollection = pgTable("user_vocabulary_collection", {
  id: text("id").primaryKey(),
  userVocabularyId: text("user_vocabulary_id").notNull().references(() => userVocabulary.id, { onDelete: "cascade" }),
  collectionId: text("collection_id").notNull().references(() => vocabularyCollection.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("user_vocab_collection_unique").on(t.userVocabularyId, t.collectionId),
  index("user_vocab_collection_collection_idx").on(t.collectionId),
]);
```

**Ràng buộc nghiệp vụ**:
- Một từ có thể thuộc nhiều collection (n-n).
- Khi user xóa từ khỏi sổ tay → cascade xóa join.
- Khi user xóa collection → cascade xóa join, nhưng KHÔNG xóa `user_vocabulary`.

#### 2.2.4 Mở rộng `user_vocabulary` — Tags + Notes + Mastered

Thêm các cột vào bảng `user_vocabulary` hiện tại (dùng `ALTER TABLE` + migration mới, không phá vỡ dữ liệu):

```ts
// Thêm vào bảng user_vocabulary hiện tại:
tags: jsonb("tags").$type<string[]>().default([]).notNull(),   // array tag tự do, lowercase
note: text("note"),                                            // ghi chú cá nhân (tối đa 1000 ký tự)
masteredAt: timestamp("mastered_at"),                          // null = chưa thuộc
```

**Ràng buộc**:
- `tags` tối đa 10 phần tử, mỗi tag ≤ 30 ký tự, lowercase, trim.
- `note` ≤ 1000 ký tự (validate ở server).
- `masteredAt` set/unset qua hành động "Đánh dấu đã thuộc" / "Đánh dấu chưa thuộc".

### 2.3 Service layer mới

Mở rộng `features/vocabulary/services/vocabulary.service.ts`:

```ts
// ── SRS (Nhóm 1.1) ──────────────────────────────────────────────
export async function getOrInitReview(userId, vocabularyId): Promise<VocabularyReview>
export async function getDueReviews(userId, limit=20): Promise<UserNotebookEntry[]>
export async function submitReview(userId, vocabularyId, grade: 0|1|2|3): Promise<VocabularyReview>
// grade: 0=Again (Quên), 1=Hard (Khó), 2=Good (Tốt), 3=Easy (Dễ) — áp dụng SM-2

// ── Collections (Nhóm 2.1) ──────────────────────────────────────
export async function listCollections(userId): Promise<VocabularyCollection[]>
export async function createCollection(userId, input: CreateCollectionInput): Promise<ActionResult>
export async function renameCollection(userId, id, name): Promise<ActionResult>
export async function deleteCollection(userId, id): Promise<ActionResult>
export async function addToCollection(userId, collectionId, vocabularyId): Promise<ActionResult>
export async function removeFromCollection(userId, collectionId, vocabularyId): Promise<ActionResult>
export async function bulkAddToCollection(userId, collectionId, vocabularyIds): Promise<ActionResult>
export async function bulkRemoveFromNotebook(userId, vocabularyIds): Promise<ActionResult>
export async function getCollectionByShareSlug(slug): Promise<VocabularyCollection | null> // cho Share (5.4)
export async function cloneSharedCollection(userId, shareSlug): Promise<ActionResult<{ collectionId }>>

// ── Tags + Notes + Mastered (Nhóm 2.2, 2.4) ─────────────────────
export async function updateUserVocabTags(userId, vocabularyId, tags): Promise<ActionResult>
export async function updateUserVocabNote(userId, vocabularyId, note): Promise<ActionResult>
export async function markMastered(userId, vocabularyId): Promise<ActionResult>
export async function unmarkMastered(userId, vocabularyId): Promise<ActionResult>
```

### 2.4 Server Actions mới

Mở rộng `features/vocabulary/actions.ts`:

```ts
// SRS
export async function getDueReviewQueue(limit?: number): Promise<UserNotebookEntry[]>
export async function submitReviewAction(vocabularyId: string, grade: 0|1|2|3): Promise<ActionResult>

// Collections
export async function createCollectionAction(input): Promise<ActionResult<{ id: string }>>
export async function updateCollectionAction(id, input): Promise<ActionResult>
export async function deleteCollectionAction(id): Promise<ActionResult>
export async function addToCollectionAction(collectionId, vocabularyId): Promise<ActionResult>
export async function removeFromCollectionAction(collectionId, vocabularyId): Promise<ActionResult>
export async function bulkAddToCollectionAction(collectionId, vocabularyIds): Promise<ActionResult>

// Tags + Notes + Mastered
export async function updateTagsAction(vocabularyId, tags): Promise<ActionResult>
export async function updateNoteAction(vocabularyId, note): Promise<ActionResult>
export async function markMasteredAction(vocabularyId): Promise<ActionResult>
export async function unmarkMasteredAction(vocabularyId): Promise<ActionResult>

// Bulk + Share
export async function bulkRemoveFromNotebookAction(vocabularyIds): Promise<ActionResult>
export async function toggleCollectionPublicAction(collectionId, isPublic): Promise<ActionResult<{ shareSlug: string | null }>>
export async function cloneSharedCollectionAction(shareSlug): Promise<ActionResult<{ collectionId: string }>>
```

### 2.5 Hook mở rộng

Mở rộng `useVocabulary()` (file `features/vocabulary/hooks/useVocabulary.ts`):

```ts
const {
  // Phase 1 (đã có)
  notebook, isSaving, error, loadNotebook, saveLessonItemToNotebook, removeFromNotebook, isSaved,
  // Phase 2
  collections,                    // VocabularyCollection[]
  dueCount,                       // number — số từ đến hạn ôn
  reviewEntry,                    // (vocabularyId) => VocabularyReview | undefined
  isMastered,                     // (vocabularyId) => boolean
  tagsForVocab,                   // (vocabularyId) => string[]
  // mutations
  createCollection, renameCollection, deleteCollection,
  addToCollection, removeFromCollection, bulkAddToCollection,
  updateTags, updateNote, markMastered, unmarkMastered,
  submitReview,
  bulkRemove,
} = useVocabulary();
```

---

## 3. Nhóm 1 — Ôn tập chủ động

### 3.1 Flashcard SRS (Spaced Repetition)

#### 3.1.1 Thuật toán SM-2

Áp dụng thuật toán SuperMemo 2 (Anki-compatible). Mỗi từ có state:
- `easeFactor` (EF) — mặc định 2.5, tối thiểu 1.3.
- `intervalDays` (I) — số ngày đến lần ôn kế tiếp.
- `repetition` (n) — số lần trả lời đúng liên tiếp.

Sau khi user chọn grade `g` (0=Again, 1=Hard, 2=Good, 3=Easy):

```
if g == 0 (Again):
  n = 0
  I = 1                  // ôn lại sau 1 ngày
  lapses += 1
else:
  if n == 0:
    I = 1
  elif n == 1:
    I = 6
  else:
    I = round(I * EF)
  if g == 1 (Hard): I = max(1, round(I * 0.8))
  if g == 3 (Easy): I = round(I * 1.3)
  n += 1

EF = max(1.3, EF + (0.1 - (3 - g) * (0.08 + (3 - g) * 0.02)))
dueAt = now() + I days
```

#### 3.1.2 UI Flow

Trang `/notebook/review` (mới):

```
┌──────────────────────────────────────────────────────────────────┐
│  Ôn tập hôm nay                              3/12 đã hoàn thành  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░  25%                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│             ┌────────────────────────────────────┐               │
│             │                                    │               │
│             │           comfortable              │  ← mặt trước   │
│             │           /ˈkʌmftəbl/               │               │
│             │           (adjective)              │               │
│             │                                    │               │
│             │      Nhấn Space để lật thẻ         │               │
│             └────────────────────────────────────┘               │
│                                                                  │
│     [ ← Trước ]            Card 4/12           [ Tiếp → ]        │
└──────────────────────────────────────────────────────────────────┘
```

Sau khi lật (mặt sau):

```
┌──────────────────────────────────────────────────────────────────┐
│             ┌────────────────────────────────────┐               │
│             │  comfortable (adjective)           │               │
│             │  /ˈkʌmftəbl/                       │               │
│             │  ━━━━━━━━━━━━━━━━━━━━━━━━          │               │
│             │  thoải mái, dễ chịu                │               │
│             │  "The hotel room was comfortable." │               │
│             └────────────────────────────────────┘               │
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Quên   │  │   Khó   │  │   Tốt    │  │   Dễ     │           │
│  │  <1m    │  │  ~1 ng. │  │  6 ngày  │  │  10 ng.  │           │
│  └─────────┘  └─────────┘  └──────────┘  └──────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

Khi user chọn grade:
- Lưu lịch sử review.
- Tính lại `dueAt`, `intervalDays`, `easeFactor`.
- Card kế tiếp trong queue (nếu còn).
- Khi queue rỗng → hiển thị màn "Hoàn thành" với số thống kê.

#### 3.1.3 Hành vi đặc biệt

- **Lazy init**: Lần đầu user mở review screen, với mỗi từ trong queue nếu chưa có dòng `vocabulary_review` thì tạo mới với state mặc định (EF=2.5, I=0, n=0, dueAt=now()).
- **Hết queue**: Hiển thị "Bạn đã hoàn thành ôn tập hôm nay! Quay lại sau 4 giờ."
- **Empty notebook**: Hiển thị empty state giống trang chính nhưng với CTA "Khám phá bài học".
- **Keyboard shortcuts** (xem mục 5.2):
  - `Space` lật thẻ.
  - `1` = Again, `2` = Hard, `3` = Good, `4` = Easy.
  - `←` / `→` chuyển thẻ trước/sau.

#### 3.1.4 API

```ts
// Lấy queue (dueAt <= now, sắp xếp dueAt asc)
getDueReviewQueue(limit=20): UserNotebookEntry[]

// Submit 1 review
submitReviewAction(vocabularyId, grade: 0|1|2|3): ActionResult
  // Trả về { nextDueAt, newIntervalDays, newEaseFactor }
```

### 3.2 Quiz Mode (Multiple Choice)

#### 3.2.1 Nghiệp vụ

Chế độ quiz dùng các từ trong sổ tay để sinh câu hỏi trắc nghiệm. Hai dạng:

- **Word → Meaning**: Hiển thị từ, 4 lựa chọn nghĩa (1 đúng + 3 distractors).
- **Meaning → Word**: Hiển thị nghĩa + phonetic, 4 lựa chọn từ.

#### 3.2.2 Sinh distractors

Lấy ngẫu nhiên 3 từ khác trong cùng `level` (nếu đủ) hoặc random toàn cục `vocabulary` (nếu không đủ). Đảm bảo 4 đáp án luôn khác biệt.

#### 3.2.3 Quiz session

- Mỗi session gồm 10 câu (configurable).
- Lưu lịch sử vào bảng `vocabulary_quiz_attempt` (mới, nếu cần tracking). Hoặc đơn giản chỉ log vào console.
- Sau khi hoàn thành: hiển thị kết quả + cho phép "Làm lại với từ sai".

```ts
// Schema mới (tuỳ chọn, có thể skip nếu chỉ muốn session ephemeral)
export const vocabularyQuizAttempt = pgTable("vocabulary_quiz_attempt", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vocabularyQuizAnswer = pgTable("vocabulary_quiz_answer", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id").notNull().references(() => vocabularyQuizAttempt.id, { onDelete: "cascade" }),
  vocabularyId: text("vocabulary_id").notNull().references(() => vocabulary.id, { onDelete: "cascade" }),
  isCorrect: boolean("is_correct").notNull(),
});
```

> **Đề xuất**: Phase 2 chưa cần tracking chi tiết — chỉ lưu tổng số đúng/sai của session nếu cần. Có thể bỏ qua schema này ở lần đầu, dùng localStorage / sessionStorage cho ephemeral results.

#### 3.2.4 UI Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Quiz · Câu 3 / 10                          Điểm: 2/2           │
├──────────────────────────────────────────────────────────────────┤
│  comfortable (adjective)                                          │
│                                                                  │
│  Nghĩa của từ là gì?                                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐             │
│  │  A. thoải mái, dễ chịu                         │             │
│  └─────────────────────────────────────────────────┘             │
│  ┌─────────────────────────────────────────────────┐             │
│  │  B. căng thẳng, mệt mỏi                        │             │
│  └─────────────────────────────────────────────────┘             │
│  ┌─────────────────────────────────────────────────┐             │
│  │  C. nguy hiểm                                  │             │
│  └─────────────────────────────────────────────────┘             │
│  ┌─────────────────────────────────────────────────┐             │
│  │  D. thú vị, hấp dẫn                           │             │
│  └─────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

Sau khi trả lời:
- Nếu đúng: card đáp án flash xanh, chuyển câu sau 800ms.
- Nếu sai: flash đỏ, hiển thị đáp án đúng, button "Tiếp tục".

#### 3.2.5 Edge cases

- Notebook có < 4 từ → hiển thị thông báo "Cần ít nhất 4 từ trong sổ tay để bắt đầu Quiz".
- Từ đã mastered → không đưa vào quiz (hoặc tuỳ chọn "Bao gồm từ đã thuộc").

### 3.3 Spelling Practice

#### 3.3.1 Nghiệp vụ

Hiển thị **nghĩa + phonetic + part of speech** (không hiển thị từ). User gõ lại từ vựng. Auto-check với fuzzy match.

#### 3.3.2 Fuzzy match

- Bỏ dấu cách đầu/cuối, lowercase, collapse spaces.
- **Levenshtein distance ≤ 1** cho từ ≤ 5 ký tự, ≤ 2 cho từ 6-10 ký tự, ≤ 3 cho từ > 10 ký tự ⇒ đúng.
- Sai ký tự đầu tiên (gõ `c` thay vì `k`) vẫn tính đúng nếu Levenshtein thoả mãn.

#### 3.3.3 UI Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Spelling · 5 / 10                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░  50%                          │
├──────────────────────────────────────────────────────────────────┤
│  Nghĩa: thoải mái, dễ chịu                                       │
│  Phonetic: /ˈkʌmftəbl/                                            │
│  Part of speech: adjective                                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  comfortable_                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  💡 Gợi ý: c__________ (10 ký tự)                                │
│                                                                  │
│  [ Bỏ qua ]                                              [ Kiểm tra ] │
└──────────────────────────────────────────────────────────────────┘
```

**Hành vi**:
- Realtime check khi user gõ xong 1 từ (debounce 500ms) HOẶC bấm Enter.
- Đúng → chuyển từ tiếp theo.
- Sai → highlight đỏ, hiển thị đáp án đúng trong 1.5s, button "Tiếp".
- Nút "Gợi ý" tiết lộ tuần tự các ký tự (mỗi lần nhấn = 1 ký tự). Free, không giới hạn lượt.
- Nút "Bỏ qua" tính là sai.

---

## 4. Nhóm 2 — Sắp xếp thông minh & Gắn nhãn

### 4.1 Collections / Folders

#### 4.1.1 Nghiệp vụ

User tạo các "bộ sưu tập" từ vựng theo mục đích (VD: "IELTS Writing Task 2", "Travel essentials", "Từ hay quên"). Một từ có thể thuộc nhiều collection (n-n).

#### 4.1.2 UI - Sidebar trong `/notebook`

Bên trái `/notebook` hiển thị:

```
┌─────────────────────────────────────────────────────────────────┐
│ Bộ sưu tập                                                       │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ ★ Tất cả từ (147)                                          │   │
│ │ 📁 IELTS Writing (32)                                       │   │
│ │ 📁 Travel essentials (18)                                   │   │
│ │ 📁 Từ hay quên (24)                                         │   │
│ │ + Tạo bộ sưu tập mới                                       │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│ Lọc nhanh                                                         │
│ ● Đến hạn ôn (12)                                                │
│ ● Mastered (8)                                                    │
│ ● Chưa thuộc (139)                                                │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.3 Hành vi

- Click vào collection → lọc notebook theo collection đó (gộp vào hệ filter hiện tại).
- Icon ⋯ trên mỗi collection → menu: Đổi tên, Đổi màu, Xoá, Bật/tắt công khai (Share).
- "+ Tạo bộ sưu tập mới" → mở dialog nhập tên + chọn màu.

#### 4.1.4 Thêm từ vào collection từ lesson viewer

Trong VocabularyLesson flashcard (mặt sau), bên cạnh nút "Lưu vào sổ từ vựng" hiện có, thêm dropdown "Thêm vào bộ sưu tập":

```
[Lưu vào sổ từ vựng]  [📁 Thêm vào bộ sưu tập ▼]
                              ├─ ☑ IELTS Writing
                              ├─ ☐ Travel essentials
                              ├─ ☐ Từ hay quên
                              └─ + Tạo mới...
```

Click từng collection → toggle (n-n). Checked = đã có trong collection đó.

#### 4.1.5 Bulk add (kết hợp với 5.1)

Trong notebook, sau khi user chọn nhiều card bằng checkbox, button "Thêm vào bộ sưu tập" hiện ra ở action bar phía trên.

### 4.2 Tags cá nhân

#### 4.2.1 Nghiệp vụ

Tag tự do gắn lên từng `user_vocabulary`. Mục đích: phân loại ngoài cấu trúc collection (VD: "khó", "hay gặp trong IELTS", "đụng hàng với 'affect'"). Mỗi từ có thể có nhiều tag.

#### 4.2.2 Quy tắc

- Tag tự động lowercase + trim.
- Tối đa 10 tag / từ.
- Tối đa 30 ký tự / tag.
- Validate ở server (zod schema) lẫn client.

#### 4.2.3 UI

Trong card notebook, dưới meaning hiển thị:

```
comfortable (adjective)                    [A2]
/ˈkʌmftəbl/
thoải mái, dễ chịu

#khó  #IELTS  #đụng-affect

+ Thêm tag
```

Click "+ Thêm tag" → popover với input + suggestion từ các tag user đã dùng (autocomplete).

#### 4.2.4 Filter theo tag

Trong thanh filter của notebook, thêm dropdown "Tag" cho phép chọn 1 hoặc nhiều tag (multi-select). Mặc định là "Tất cả".

### 4.3 Sort nâng cao

#### 4.3.1 Nghiệp vụ

Sắp xếp danh sách từ theo nhiều tiêu chí, thay vì chỉ theo `savedAt desc` như hiện tại.

#### 4.3.2 Các tuỳ chọn

| Tuỳ chọn | Mô tả |
|----------|--------|
| Mới lưu trước (mặc định) | `savedAt desc` |
| Cũ nhất | `savedAt asc` |
| A → Z | `word asc` |
| Đến hạn ôn trước | `dueAt asc` (chỉ những từ đã có review), các từ chưa review xuống cuối |
| Mastered cuối | `masteredAt asc nulls last` |
| Level (A1 → C2) | `level asc` |

#### 4.3.3 UI

Thêm dropdown "Sắp xếp" cạnh dropdown filter hiện tại:

```
[🔍 Tìm kiếm...] [Cấp độ ▼] [Chủ đề ▼] [Tag ▼] [Sắp xếp: Mới lưu trước ▼]
```

Sort chỉ áp dụng ở client-side, không thay đổi thứ tự lưu trong DB.

### 4.4 Mark "Mastered"

#### 4.4.1 Nghiệp vụ

User đánh dấu từ đã thuộc → từ đó được ẩn khỏi danh sách mặc định, vẫn xem được qua filter "Mastered" hoặc sắp xếp "Mastered cuối".

#### 4.4.2 Hành vi

- Mỗi card có toggle "Đã thuộc" (icon ✓ / ☆).
- Click → set `masteredAt = now()`.
- Click lại → set `masteredAt = null`.
- Filter "Mastered" hiển thị tất cả từ có `masteredAt IS NOT NULL`.
- Filter "Chưa thuộc" (mặc định) hiển thị từ có `masteredAt IS NULL`.

#### 4.4.3 Ảnh hưởng SRS

- Từ mastered vẫn xuất hiện trong review queue (mặc định 30 ngày một lần).
- Có thể cấu hình sau: cho phép ẩn mastered khỏi queue.

---

## 5. Nhóm 5 — Trải nghiệm UX

### 5.1 Bulk Actions

#### 5.1.1 Nghiệp vụ

User chọn nhiều từ cùng lúc bằng checkbox → thực hiện thao tác hàng loạt (xoá, thêm vào collection, mark mastered).

#### 5.1.2 UI

Khi user chọn ≥ 1 card, một **action bar nổi** hiện ra phía dưới:

```
┌──────────────────────────────────────────────────────────────────┐
│  Đã chọn 5 từ       [📁 Thêm vào bộ sưu tập ▼]  [✓ Mastered]    │
│                       [🗑️ Xoá]                          [Bỏ chọn] │
└──────────────────────────────────────────────────────────────────┘
```

- Checkbox ở góc trên-trái mỗi card (chỉ hiện khi hover, hoặc sticky khi có selection).
- "Chọn tất cả" ở header grid.
- Action bar biến mất khi `selectedCount === 0`.

#### 5.1.3 Hành vi

- Bulk delete: confirmation dialog "Xoá N từ khỏi sổ tay?" → xoá song song (Promise.all trên server).
- Bulk add to collection: dropdown chọn collection, hoặc "Tạo mới" inline.
- Bulk mark mastered: optimistic update, không cần confirm.

### 5.2 Keyboard Shortcuts

#### 5.2.1 Phạm vi áp dụng

Chỉ áp dụng khi focus nằm trong `/notebook/*` (không phải khi user đang gõ vào input/textarea).

#### 5.2.2 Phím tắt - Notebook list (`/notebook`)

| Phím | Hành động |
|------|-----------|
| `/` | Focus vào search input |
| `Esc` | Clear search (nếu có text) hoặc unfocus |
| `J` / `↓` | Chọn card kế tiếp (chế độ list view) |
| `K` / `↑` | Chọn card trước |
| `X` | Toggle selection card hiện tại |
| `Shift + X` | Chọn range từ card trước đến hiện tại |
| `D` | Mở dialog xoá card đang chọn |
| `M` | Toggle mastered card đang chọn |
| `?` | Mở modal danh sách phím tắt |

#### 5.2.3 Phím tắt - Review screen (`/notebook/review`)

| Phím | Hành động |
|------|-----------|
| `Space` | Lật thẻ |
| `1` | Grade: Again |
| `2` | Grade: Hard |
| `3` | Grade: Good |
| `4` | Grade: Easy |
| `←` | Thẻ trước |
| `→` | Thẻ sau (chỉ sau khi đã grade thẻ hiện tại) |
| `Esc` | Thoát review session |

#### 5.2.4 Triển khai

- Dùng hook `useKeyboardShortcuts()` đăng ký global listener (chỉ attach khi vào route tương ứng).
- Hiển thị footer bar nhỏ ở cuối màn hình với các phím tắt hiện đang khả dụng (giống Gmail).
- Modal `?` liệt kê đầy đủ.

### 5.3 Pronunciation Tooltip

#### 5.3.1 Nghiệp vụ

Khi hover vào phonetic của 1 từ, hiển thị tooltip giải thích cách đọc từng âm IPA, kèm audio play button.

#### 5.3.2 Tooltip nội dung

```
┌──────────────────────────────────────┐
│ /ˈkʌmftəbl/                          │
│ ─────────────                        │
│ k   →  âm "c"                        │
│ ʌ   →  âm "u" ngắn (cup)             │
│ m   →  âm "m"                        │
│ f   →  âm "ph"                       │
│ t   →  âm "t"                        │
│ ə   →  âm "ơ" nhẹ (ago)              │
│ b   →  âm "b"                        │
│ l   →  âm "l"                        │
│                                      │
│ 🔊 Nghe                              │
└──────────────────────────────────────┘
```

#### 5.3.3 Triển khai

- Bảng tra cứu IPA → tiếng Việt đặt trong `lib/phonetic-map.ts`.
- Tooltip dùng shadcn `Tooltip` + `HoverCard`.
- Nếu `vocabulary.audioUrl` tồn tại → button "🔊 Nghe" phát audio. Nếu chưa có → ẩn button hoặc placeholder "Chưa có audio".

### 5.4 Share Collection

#### 5.4.1 Nghiệp vụ

User A bật "Công khai" cho 1 collection → nhận được link chia sẻ (VD: `/notebook/shared/abc123`). User B mở link → xem nội dung collection + clone về sổ của mình.

#### 5.4.2 Hành vi

- Trong menu ⋯ của collection → toggle "Công khai".
- Khi bật: generate `shareSlug` random (8 ký tự, nanoid), hiển thị modal với link copy-to-clipboard.
- User B mở link `/notebook/shared/{slug}`:
  - Xem tên, mô tả, số từ của collection.
  - Click "Sao chép vào sổ tay của tôi" → tạo collection mới với cùng tên + copy tất cả `user_vocabulary` entries vào collection đó.
- Nếu collection chưa public → trang hiển thị 404.

#### 5.4.3 Bảo mật

- `shareSlug` đủ dài (8-12 ký tự nanoid), đủ entropy cho public link an toàn.
- Không hiển thị thông tin user A (tên, email) trên trang share.
- Có thể thêm "Report this collection" cho moderation sau.

---

## 6. State Management

### 6.1 Local state (Phase 2 bổ sung)

```ts
// Trong NotebookClient:
const [collections, setCollections] = useState<VocabularyCollection[]>([]);
const [selectedCollectionId, setSelectedCollectionId] = useState<string | "all">("all");
const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
const [sortBy, setSortBy] = useState<SortOption>("recent");
const [selectedVocabIds, setSelectedVocabIds] = useState<Set<string>>(new Set());
const [masteredFilter, setMasteredFilter] = useState<"all" | "mastered" | "not-mastered">("not-mastered");

// Review screen riêng (useReviewSession hook):
const [queue, setQueue] = useState<UserNotebookEntry[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [isFlipped, setIsFlipped] = useState(false);
const [sessionStats, setSessionStats] = useState({ reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 });
```

### 6.2 Derived state

```ts
const filteredNotebook = useMemo(() => {
  let result = notebook;
  if (selectedCollectionId !== "all") {
    result = result.filter((e) => e.collectionIds?.includes(selectedCollectionId));
  }
  if (selectedTagIds.length > 0) {
    result = result.filter((e) =>
      selectedTagIds.every((t) => (e.tags ?? []).includes(t))
    );
  }
  if (masteredFilter === "mastered") {
    result = result.filter((e) => e.masteredAt !== null);
  } else if (masteredFilter === "not-mastered") {
    result = result.filter((e) => e.masteredAt === null);
  }
  // search, level, topic filters giữ nguyên từ Phase 1
  return result;
}, [notebook, selectedCollectionId, selectedTagIds, masteredFilter, ...]);

const sortedFiltered = useMemo(() => {
  const arr = [...filteredNotebook];
  switch (sortBy) {
    case "recent": return arr.sort((a, b) => b.savedAt - a.savedAt);
    case "oldest": return arr.sort((a, b) => a.savedAt - b.savedAt);
    case "alpha": return arr.sort((a, b) => a.vocabulary.word.localeCompare(b.vocabulary.word));
    case "due":
      return arr.sort((a, b) => {
        const ad = a.review?.dueAt?.getTime() ?? Infinity;
        const bd = b.review?.dueAt?.getTime() ?? Infinity;
        return ad - bd;
      });
    case "mastered-last":
      return arr.sort((a, b) => (a.masteredAt?.getTime() ?? 0) - (b.masteredAt?.getTime() ?? 0));
    case "level":
      return arr.sort((a, b) => (a.vocabulary.level ?? "").localeCompare(b.vocabulary.level ?? ""));
    default: return arr;
  }
}, [filteredNotebook, sortBy]);
```

### 6.3 Remote state

Hook `useVocabulary` mở rộng thêm các API như mục 2.5. Vẫn dùng kiểu "fetch on mount + refresh after mutation".

---

## 7. Routes mới

| Path | Mục đích | Auth |
|------|---------|------|
| `/notebook` (đã có, mở rộng) | Danh sách + collections + tags + sort | Student |
| `/notebook/review` | Flashcard SRS session | Student |
| `/notebook/quiz` | Quiz mode | Student |
| `/notebook/spelling` | Spelling practice | Student |
| `/notebook/shared/[slug]` | Trang share collection (public) | Public |

---

## 8. Component Hierarchy mở rộng

```
NotebookPage (Server)
└── NotebookClient (Client)
    ├── CollectionSidebar (mới)
    │   ├── CollectionItem
    │   └── CreateCollectionButton
    ├── SearchFilterBar (mở rộng)
    │   ├── SearchInput
    │   ├── LevelFilter
    │   ├── TopicFilter
    │   ├── TagFilter (mới)
    │   ├── SortDropdown (mới)
    │   └── MasteredFilter (mới)
    ├── BulkActionBar (mới, conditional)
    ├── VocabularyList (mở rộng)
    │   └── VocabularyCard (mở rộng)
    │       ├── TagsRow (mới)
    │       ├── MasteredToggle (mới)
    │       └── CollectionPicker (mới, popover)
    ├── EmptyState
    ├── NoResultsState
    ├── LoadingSkeleton
    └── DeleteDialog

ReviewPage (mới)
└── ReviewClient
    ├── ProgressBar
    ├── Flashcard (lật được)
    ├── GradeButtons
    ├── KeyboardHints (footer)
    └── SessionComplete

QuizPage (mới)
└── QuizClient
    ├── QuizQuestion
    ├── AnswerList
    └── QuizResult

SpellingPage (mới)
└── SpellingClient
    ├── SpellingPrompt
    ├── SpellingInput
    └── SpellingResult
```

---

## 9. Error Handling

| Tình huống | Xử lý |
|-----------|------|
| Submit review fail | Toast error, giữ nguyên trạng thái card (chưa chuyển), cho user retry |
| Quiz có < 4 từ | Hiển thị message "Cần ít nhất 4 từ trong sổ tay" + CTA "Đi học thêm" |
| Create collection trùng tên | Inline form error "Đã có bộ sưu tập với tên này" |
| Share slug collision | Auto-regenerate (xác suất cực thấp với nanoid 12) |
| Bulk action 1 phần tử fail | Toast error kèm số thành công / số lỗi, giữ trạng thái partial |
| Lazy init review fail | Skip từ đó, tiếp tục queue, log lỗi |
| Shared collection không tồn tại | 404 page với "Collection không tồn tại hoặc đã bị xoá" |
| Shared collection private | 404 page |

---

## 10. Performance

- **SRS queue**: Query `LIMIT 20` thay vì load toàn bộ notebook. Pagination khi user next page.
- **Lazy init review**: Tránh tạo row `vocabulary_review` cho tất cả từ trong sổ tay ngay khi user lưu. Chỉ tạo khi mở review screen.
- **Tag autocomplete**: Cache tag list trong memory (load 1 lần), invalidate sau khi user thêm tag mới.
- **Bulk delete**: Dùng `Promise.all` song song, không tuần tự.
- **Sort + filter**: Memo hóa như Phase 1; thêm dependency mới là `sortBy`, `selectedTagIds`, `selectedCollectionId`, `masteredFilter`.
- **Audio playback**: Preload `audioUrl` của từ hiện tại + 2 từ kế tiếp.

---

## 11. Privacy & Bảo mật

- Tất cả Server Actions tiếp tục dùng `requireAuth()` từ Phase 1.
- Share collection: validate slug ở server, không cho phép enumerate.
- Tag và note là dữ liệu user cá nhân → không public qua share (chỉ share từ vựng vào collection mới của user B).
- Server Action input validation bằng zod schema mới: `tagsSchema`, `noteSchema`, `gradeSchema`, `collectionInputSchema`.

---

## 12. Migration Plan

1. **Migration 1 — Schema**: 
   - `ALTER TABLE user_vocabulary ADD COLUMN tags jsonb NOT NULL DEFAULT '[]', ADD COLUMN note text, ADD COLUMN mastered_at timestamp;`
   - Tạo 4 bảng mới: `vocabulary_review`, `vocabulary_collection`, `user_vocabulary_collection`, `vocabulary_quiz_attempt` (tuỳ chọn).
   - Index mới cho `vocabulary_review(user_id, due_at)`.

2. **Backfill**:
   - Với mỗi `user_vocabulary` hiện tại → set `tags = '[]'`, `mastered_at = null`.
   - Không backfill `vocabulary_review` (lazy init).

3. **Backward compatibility**:
   - Phase 1 code (search, filter, delete, list) tiếp tục chạy bình thường.
   - Field `tags`, `note`, `masteredAt` mặc định an toàn.

---

## 13. Acceptance Criteria

### Nhóm 1 — Ôn tập

- [ ] Mở `/notebook/review` hiển thị queue các từ đến hạn ôn (≤ 20 từ).
- [ ] Lật thẻ bằng Space hoặc click.
- [ ] Chọn grade (1-4 hoặc nút) → cập nhật `easeFactor`, `intervalDays`, `dueAt` theo SM-2.
- [ ] Queue cập nhật sau mỗi grade; hết queue hiển thị màn hoàn thành.
- [ ] Mở `/notebook/quiz` với ≥ 4 từ → sinh quiz 10 câu với distractors hợp lý.
- [ ] Quiz tracking điểm số và cho "Làm lại với từ sai".
- [ ] Mở `/notebook/spelling` với ≥ 1 từ → cho phép gõ lại từ với fuzzy check.
- [ ] Gợi ý tiết lộ từng ký tự; bỏ qua = sai.

### Nhóm 2 — Sắp xếp

- [ ] Tạo / sửa / xoá collection; tên trùng → error.
- [ ] Gắn từ vào collection từ lesson viewer (dropdown đa chọn).
- [ ] Lọc notebook theo collection; chọn nhiều collection (OR logic).
- [ ] Gắn tags; autocomplete từ tag đã dùng; tối đa 10 tags / từ.
- [ ] Lọc theo tag (multi-select).
- [ ] Sort theo 6 tuỳ chọn đã liệt kê; sort mặc định là "Mới lưu trước".
- [ ] Mark/unmark Mastered; filter mặc định ẩn Mastered.
- [ ] Mastered từ vẫn xuất hiện trong SRS queue.

### Nhóm 5 — UX

- [ ] Checkbox trên card; "Chọn tất cả" hoạt động.
- [ ] Action bar hiển thị khi có ≥ 1 selection.
- [ ] Bulk delete với confirm; bulk add to collection; bulk mark mastered.
- [ ] Keyboard shortcuts hoạt động trong `/notebook`: `/`, `J/K`, `X`, `D`, `M`, `Esc`.
- [ ] Keyboard shortcuts hoạt động trong `/notebook/review`: `Space`, `1-4`, `←/→`.
- [ ] Modal `?` liệt kê đầy đủ phím tắt.
- [ ] Hover phonetic hiển thị tooltip giải nghĩa IPA tiếng Việt.
- [ ] Tooltip có button "🔊 Nghe" nếu `audioUrl` tồn tại; phát được audio.
- [ ] Bật "Công khai" collection → có link `/notebook/shared/[slug]` copy được.
- [ ] User B mở link → thấy collection và "Sao chép vào sổ tay" tạo collection mới.

### Chung

- [ ] TypeScript `tsc --noEmit` không lỗi.
- [ ] ESLint không lỗi.
- [ ] Mobile responsive (test trên 375px width).
- [ ] Không regression trên Phase 1 (search, level/topic filter, delete với confirm, empty/no-results state).
- [ ] Accessibility: mọi nút bấm có `aria-label`, keyboard navigation đầy đủ.

---

## 14. Lộ trình triển khai đề xuất

Triển khai theo 3 đợt, mỗi đợt độc lập có thể ship:

### Đợt 1 — Quick wins (3-5 ngày)

1. Migration schema: `tags`, `note`, `masteredAt` + bảng `vocabulary_collection` + join.
2. Service + actions cho tags / note / mastered / collections CRUD.
3. UI: `MasteredToggle`, `TagsRow`, `CollectionPicker` trong card.
4. UI: `CollectionSidebar` + filter collection.
5. Sort dropdown.
6. Bulk actions (checkbox + action bar).

### Đợt 2 — Learning core (5-7 ngày)

1. Migration: bảng `vocabulary_review`.
2. Service: SM-2 scheduler, `getOrInitReview`, `submitReview`.
3. Hook `useReviewSession`.
4. UI: `/notebook/review` (flashcard deck + grade buttons + keyboard).
5. UI: `/notebook/quiz` + service sinh distractors.
6. UI: `/notebook/spelling` + fuzzy match helper.

### Đợt 3 — Polish & Share (2-3 ngày)

1. Keyboard shortcut system (`useKeyboardShortcuts` hook + modal `?`).
2. Pronunciation tooltip + IPA map.
3. Share collection: `shareSlug`, route `/notebook/shared/[slug]`, clone action.

Tổng cộng: ~10-15 ngày làm việc.

---

## 15. Phụ thuộc giữa các tính năng

```
Nhóm 5.1 (Bulk) ── phụ thuộc ──> Nhóm 2.1 (Collections) để bulk add
Nhóm 1.1 (SRS)  ── phụ thuộc ──> Nhóm 2.4 (Mastered) cho queue filtering
Nhóm 5.4 (Share) ── cần ──> Nhóm 2.1 (Collections) — share là property của collection
Nhóm 5.2 (Keys)  ── độc lập ──> có thể làm song song mọi lúc
Nhóm 5.3 (Pronun) ── độc lập ──> chỉ cần field audioUrl đã có sẵn
```

Khuyến nghị: làm theo thứ tự 1 → 2.1 → 2.2 → 2.3 → 2.4 → 5.1 → 5.2 → 5.3 → 5.4 để giảm thiểu rework.
