# Implementation Prompt: Student Notebook Feature

## Task
Implement chức năng **Sổ Từ Vựng (Vocabulary Notebook)** cho Student role.

## Reference Documents
- Đọc kỹ: `.agents/docs/student-notebook-spec.md` - Chứa đầy đủ nghiệp vụ và UI specification
- Tham khảo: `features/vocabulary/hooks/useVocabulary.ts` - Client hook đã có sẵn
- Tham khảo: `features/vocabulary/actions.ts` - Server actions đã có sẵn
- Tham khảo: `app/(student)/account/account-client.tsx` (lines ~460-475) - Link navigation

## Target Files

### 1. Create: `apps/web/src/app/(student)/notebook/notebook-client.tsx`
Client component chính chứa toàn bộ UI.

**Requirements:**
- Sử dụng `useVocabulary()` hook để quản lý state
- Gọi `loadNotebook()` trong `useEffect` khi mount
- Implement local search với debounce 300ms
- Implement filters: level (A1-C2) và topic
- Implement delete với confirmation dialog
- Responsive layout: 1 column mobile, 2 columns tablet+
- Reuse UI components từ shadcn/ui

**Component Structure:**
```tsx
// Main sections:
1. Header (title + count badge)
2. SearchFilterBar (search input + 2 dropdowns)
3. VocabularyList (grid of cards)
4. EmptyState (when no vocab)
5. NoResultsState (when search/filter has no results)
6. LoadingSkeleton (when isLoading)
```

**Key Behaviors:**
- Filter tất cả diễn ra ở client-side (không gọi API)
- Delete với optimistic update
- Expandable cards cho examples/notes
- Format thời gian tương đối: "2 giờ trước", "1 ngày trước"

### 2. Modify: `apps/web/src/app/(student)/notebook/page.tsx`
Update page hiện tại để import và render NotebookClient.

```tsx
// Keep auth check, render NotebookClient instead of placeholder
import NotebookClient from "./notebook-client";

export default async function NotebookPage() {
  // ... existing auth code ...
  
  return <NotebookClient />;
}
```

## Implementation Checklist

### UI Components
- [ ] Header với title và count badge
- [ ] Search input với icon và clear button
- [ ] Level filter dropdown (A1-C2)
- [ ] Topic filter dropdown (dynamic từ data)
- [ ] Vocabulary card với:
  - [ ] Word, phonetic, part of speech
  - [ ] Meaning
  - [ ] Saved time (relative format)
  - [ ] Delete button (hover to show)
  - [ ] Expandable examples/notes
- [ ] Empty state
- [ ] No results state
- [ ] Loading skeleton (3-5 cards)

### Functionality
- [ ] Fetch notebook on mount
- [ ] Client-side search (word + meaning)
- [ ] Client-side filter by level
- [ ] Client-side filter by topic
- [ ] Delete with confirmation
- [ ] Toast notifications
- [ ] Error handling

### UX
- [ ] Responsive layout
- [ ] Hover states
- [ ] Loading states
- [ ] Empty states
- [ ] Relative time formatting

## Design System (reuse from existing)
- Colors: teal theme (từ VocabularyLessonConfig)
- Border radius: rounded-xl (14px)
- Shadows: hover:shadow-sm
- Spacing: gap-3 cho cards, p-4 cho padding

## Dependencies (already installed)
- `useVocabulary` hook
- shadcn/ui: Button, Input, Card, Badge, Skeleton
- lucide-react: BookOpen, Search, X, ChevronDown, ChevronUp, Trash2
- sonner: toast (already in use)

## Success Criteria
- [ ] Page load và hiển thị danh sách từ vựng
- [ ] Search hoạt động real-time
- [ ] Filters hoạt động chính xác
- [ ] Delete với confirmation hoạt động
- [ ] Empty state hiển thị khi không có data
- [ ] Không có TypeScript errors
- [ ] Không có console errors

## Notes
- Không cần tạo thêm service/actions - đã có sẵn
- Reuse logic từ `useVocabulary` hook
- Follow existing code style và conventions
- Mobile-first responsive design
