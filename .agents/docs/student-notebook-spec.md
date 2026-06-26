# Sổ Từ Vựng (Student Vocabulary Notebook)

## 1. Mục tiêu & Tổng quan

Cho phép student lưu trữ và quản lý từ vựng yêu thích vào "Sổ tay" cá nhân để ôn tập sau này.

### Người dùng mục tiêu
- Student đã đăng nhập vào hệ thống

### Mục tiêu nghiệp vụ
- Lưu từ vựng từ các bài học vào sổ tay cá nhân
- Xem, tìm kiếm, lọc danh sách từ vựng đã lưu
- Xóa từ vựng khỏi sổ tay khi không cần nữa
- Hỗ trợ ôn tập với thông tin đầy đủ (phiên âm, ví dụ, ghi chú)

---

## 2. Kiến trúc & Công nghệ

### Backend (Đã có sẵn)

| Layer | File | Trạng thái |
|-------|------|-------------|
| Database Schema | `db/schema/learning-content.ts` | ✅ `userVocabulary` table |
| Service Layer | `features/vocabulary/services/vocabulary.service.ts` | ✅ CRUD operations |
| Server Actions | `features/vocabulary/actions.ts` | ✅ 4 actions |
| Client Hook | `features/vocabulary/hooks/useVocabulary.ts` | ✅ React hook |

### Frontend (Cần implement)

| Component | File | Mô tả |
|-----------|------|--------|
| Page Wrapper | `app/(student)/notebook/page.tsx` | Server component với auth |
| Client Component | `app/(student)/notebook/notebook-client.tsx` | UI chính |
| Vocabulary Card | Reuse hoặc tạo mới | Hiển thị từ vựng |

### Database Schema

```typescript
// userVocabulary table
interface UserVocabulary {
  id: string;           // Primary key (nanoid)
  userId: string;       // Foreign key → users.id
  vocabularyId: string;  // Foreign key → vocabulary.id
  savedAt: Date;        // Timestamp when saved
}

// vocabulary table
interface Vocabulary {
  id: string;
  word: string;          // Từ gốc (VD: "comfortable")
  phonetic?: string;      // Phiên âm (VD: "/ˈkʌmftəbl/")
  partOfSpeech: string;   // Từ loại (VD: "adjective")
  meaning: string;        // Nghĩa (VD: "thoải mái, dễ chịu")
  examples?: string;      // Ví dụ
  level?: string;         // Cấp độ: A1, A2, B1, B2, C1, C2
  topic?: string;        // Chủ đề
  audioUrl?: string;      // URL audio (tùy chọn)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. API & Actions

### Server Actions (Đã có trong `features/vocabulary/actions.ts`)

```typescript
// Lấy danh sách từ vựng đã lưu
async function getUserNotebook(): Promise<UserNotebookEntry[]>

// Lưu từ vựng vào sổ tay
async function saveVocabularyToNotebook(vocabularyId: string): Promise<ActionResult>

// Xóa từ vựng khỏi sổ tay
async function removeVocabularyFromNotebook(vocabularyId: string): Promise<ActionResult>

// Đếm số từ đã lưu
async function getNotebookCount(): Promise<number>
```

### Client Hook (Đã có trong `features/vocabulary/hooks/useVocabulary.ts`)

```typescript
const {
  notebook,           // UserNotebookEntry[] - danh sách từ đã lưu
  isSearching,        // boolean - đang tìm kiếm
  isSaving,           // boolean - đang lưu/xóa
  error,              // string | null - lỗi
  loadNotebook,       // () => Promise - load data
  saveToNotebook,     // (id) => Promise<boolean>
  removeFromNotebook, // (id) => Promise<boolean>
  isSaved,            // (id) => boolean - check local state
} = useVocabulary()
```

---

## 4. UI/UX Specification

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Student Header (fixed)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Sổ từ vựng                                    [N] từ đã lưu │ │
│  │  Lưu trữ và ôn tập những từ vựng bạn yêu thích             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  🔍 Tìm kiếm từ vựng...     [A1 ▼] [Chủ đề ▼] [✕]         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  comfortable (adj)                    ✕  Lưu: 2 giờ trước   │ │
│  │  /ˈkʌmftəbl/                                                 │ │
│  │  thoải mái, dễ chịu                                          │ │
│  │  ┌─ Hiện ví dụ ─┐                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  book (noun)                              ✕  Lưu: 1 ngày trước│ │
│  │  /bʊk/                                                        │ │
│  │  sách                                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ...                                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
NotebookPage (Server Component)
└── NotebookClient (Client Component)
    ├── Header Section
    │   ├── Title
    │   └── Count Badge
    ├── SearchFilterBar
    │   ├── SearchInput
    │   ├── LevelFilter (A1-C2)
    │   └── TopicFilter
    ├── VocabularyList
    │   └── VocabularyCard (x n)
    │       ├── WordHeader (word, partOfSpeech, deleteBtn)
    │       ├── Phonetic
    │       ├── Meaning
    │       ├── MetaInfo (level, topic, savedAt)
    │       └── ExpandableSection (examples, notes)
    └── EmptyState (khi không có từ nào)
```

---

## 5. Tính năng Chi tiết

### 5.1 Hiển thị danh sách từ vựng

**Mô tả:** Danh sách từ vựng đã lưu, sắp xếp theo thời gian lưu (mới nhất trước)

**Data source:** `getUserNotebook()` → `useVocabulary().notebook`

**Thông tin hiển thị:**
- Từ gốc (word)
- Phiên âm (phonetic) - nếu có
- Từ loại (partOfSpeech)
- Nghĩa (meaning)
- Thời gian lưu (savedAt) - format: "2 giờ trước", "1 ngày trước"

**Expandable content:**
- Ví dụ (examples) - nếu có
- Ghi chú - nếu có
- Cấp độ (level) - nếu có
- Chủ đề (topic) - nếu có

### 5.2 Tìm kiếm

**Mô tả:** Tìm kiếm từ vựng theo từ gốc hoặc nghĩa

**Input:** Text search query
**Debounce:** 300ms
**Case-insensitive:** Có
**Fields searched:**
- `vocabulary.word` (từ gốc)
- `vocabulary.meaning` (nghĩa)

**Behavior:**
- Clear button để xóa search
- Hiển thị số kết quả tìm thấy
- Empty state nếu không có kết quả

### 5.3 Lọc theo cấp độ (Level)

**Mô tả:** Lọc từ vựng theo cấp độ CEFR

**Options:**
- Tất cả (default)
- A1 (Beginner)
- A2 (Elementary)
- B1 (Intermediate)
- B2 (Upper Intermediate)
- C1 (Advanced)
- C2 (Proficiency)

**UI:** Dropdown select

### 5.4 Lọc theo chủ đề (Topic)

**Mô tả:** Lọc từ vựng theo chủ đề

**Data:** Lấy danh sách topic từ vocabulary đã lưu (unique values)

**Options:**
- Tất cả (default)
- [Danh sách topics có trong notebook]

**UI:** Dropdown select

### 5.5 Xóa từ vựng

**Mô tả:** Xóa từ vựng khỏi sổ tay

**Trigger:** Click button "✕" trên card

**Confirmation:** Hiển thị dialog xác nhận
- Title: "Xóa khỏi sổ tay?"
- Message: "Bạn có chắc muốn xóa "{word}" khỏi sổ tay không?"
- Actions: "Hủy" | "Xóa"

**Success:** Toast notification "Đã xóa từ vựng"
**Error:** Toast notification với error message

**Optimistic update:** Cập nhật UI ngay, revert nếu API fail

### 5.6 Empty State

**Mô tả:** Hiển thị khi chưa có từ vựng nào

**Condition:** `notebook.length === 0`

**Content:**
- Icon: BookOpen hoặc Notebook icon
- Title: "Chưa có từ vựng nào"
- Description: "Hãy bắt đầu lưu từ vựng từ các bài học để ôn tập sau nhé!"
- CTA Button: "Khám phá bài học" → link đến `/learn`

### 5.7 Loading State

**Mô tả:** Hiển thị skeleton khi đang load data

**Trigger:** `isLoading` state

**Content:**
- 3-5 skeleton cards giống với VocabularyCard
- Animation pulse

### 5.8 No Results State

**Mô tả:** Hiển thị khi search/filter không có kết quả

**Condition:** `filteredNotebook.length === 0 && notebook.length > 0`

**Content:**
- Icon: Search
- Title: "Không tìm thấy từ vựng"
- Description: "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
- Action: "Xóa bộ lọc"

---

## 6. User Flows

### Flow 1: Xem danh sách từ vựng
```
1. User click "Sổ từ vựng" trong navigation
2. Page load → fetch notebook data
3. Display vocabulary list
```

### Flow 2: Tìm kiếm từ vựng
```
1. User type vào search box
2. Debounce 300ms
3. Filter local state (client-side)
4. Display filtered results
```

### Flow 3: Lọc theo cấp độ
```
1. User click dropdown "Cấp độ"
2. Select A1/B1/C2...
3. Filter local state
4. Display filtered results
5. Update URL query params (optional)
```

### Flow 4: Xóa từ vựng
```
1. User hover card → delete button appears
2. Click delete button
3. Show confirmation dialog
4. User confirm → API call
5. Optimistic update UI
6. Show success toast
```

---

## 7. State Management

### Local State (useState)
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [levelFilter, setLevelFilter] = useState<string | null>(null);
const [topicFilter, setTopicFilter] = useState<string | null>(null);
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
```

### Derived State (useMemo)
```typescript
const filteredNotebook = useMemo(() => {
  return notebook.filter(vocab => {
    const matchesSearch = !searchQuery ||
      vocab.vocabulary.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vocab.vocabulary.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = !levelFilter || vocab.vocabulary.level === levelFilter;
    const matchesTopic = !topicFilter || vocab.vocabulary.topic === topicFilter;
    
    return matchesSearch && matchesLevel && matchesTopic;
  });
}, [notebook, searchQuery, levelFilter, topicFilter]);

const availableTopics = useMemo(() => {
  const topics = new Set<string>();
  notebook.forEach(entry => {
    if (entry.vocabulary.topic) {
      topics.add(entry.vocabulary.topic);
    }
  });
  return Array.from(topics).sort();
}, [notebook]);
```

### Remote State (useVocabulary hook)
```typescript
const { notebook, isLoading, isSaving, loadNotebook, removeFromNotebook } = useVocabulary();

// Fetch on mount
useEffect(() => {
  loadNotebook();
}, [loadNotebook]);
```

---

## 8. Error Handling

### Network Errors
- Hiển thị toast với error message
- Retry button trong error state

### Empty Responses
- Empty state UI

### Delete Failures
- Revert optimistic update
- Show error toast

---

## 9. Performance Considerations

- **Client-side filtering:** Không cần re-fetch khi search/filter
- **Debounce search:** 300ms để tránh filter quá nhiều lần
- **Optimistic updates:** UI responsive ngay cả khi API chậm
- **Skeleton loading:** Better perceived performance

---

## 10. File Structure

```
apps/web/src/app/(student)/
└── notebook/
    ├── page.tsx              # Server component (auth check)
    └── notebook-client.tsx   # Client component (main UI)
```

---

## 11. Dependencies

### Existing
- `useVocabulary()` hook
- `VocabularyLessonConfig` components (tham khảo style)
- UI components: Button, Input, Card, Badge
- Icons: BookOpen, Search, X, ChevronDown, ChevronUp, Trash2

### New
- Dialog/Confirm dialog cho delete confirmation
- Toast notifications (đã có sonner)

---

## 12. Acceptance Criteria

- [ ] Hiển thị danh sách từ vựng đã lưu
- [ ] Hiển thị đầy đủ thông tin (word, phonetic, meaning, examples)
- [ ] Tìm kiếm theo từ gốc và nghĩa
- [ ] Lọc theo cấp độ (A1-C2)
- [ ] Lọc theo chủ đề
- [ ] Xóa từ vựng với confirmation
- [ ] Empty state khi chưa có từ nào
- [ ] No results state khi search không có kết quả
- [ ] Loading skeleton
- [ ] Responsive layout
- [ ] Toast notifications cho success/error

---

## 13. Design Tokens

### Colors
```css
--teal-50: #f0fdfa    /* Background */
--teal-100: #ccfbf1   /* Badge backgrounds */
--teal-600: #0d9488   /* Primary actions */
--teal-700: #0f766e   /* Hover states */

--slate-900: #0f172a  /* Primary text */
--slate-500: #64748b  /* Secondary text */
--slate-400: #94a3b8  /* Muted text */
```

### Spacing
- Page padding: 24px (px-6)
- Card padding: 16px (p-4)
- Gap between cards: 12px (gap-3)

### Border Radius
- Cards: 14px (rounded-xl)
- Badges: 9999px (rounded-full)
- Inputs: 10px (rounded-lg)
