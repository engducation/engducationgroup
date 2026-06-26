# Notebook Feature - Ngữ Cảnh & Yêu Cầu

## 1. Tính năng Notebook (Sổ Từ Vựng)

### 1.1 Filter theo Trạng thái

**Yêu cầu:**
| Filter | Mô tả | Logic |
|--------|--------|-------|
| **Tất cả** | Hiển thị tất cả từ vựng | Không filter theo status |
| **Cần ôn** | Chỉ từ vựng chưa thuộc, đến hạn ôn | `masteredAt == null && review.dueAt <= now` |
| **Đã thuộc** | Chỉ từ vựng đã thuộc | `masteredAt != null` |

### 1.2 Bộ Sưu Tập (Collections)

**Yêu cầu:**
- Một từ vựng có thể thuộc **nhiều** bộ sưu tập
- Khi ấn vào bộ sưu tập → hiển thị tất cả từ vựng trong bộ đó (không filter status)
- Cần hiển thị **nhãn/label** các bộ sưu tập mà từ vựng đó thuộc về

**CRUD Operations:**
| Operation | Yêu cầu |
|-----------|----------|
| Create | Tạo bộ sưu tập mới |
| Read | Xem danh sách, xem từ vựng trong bộ |
| Update | Đổi tên, màu, mô tả |
| Delete | **Cần dialog xác nhận** - Khi xóa bộ sưu tập, từ vựng chỉ bị mất nhãn trong bộ đó, không bị xóa khỏi notebook |

### 1.3 Tags

- Từ vựng có thể có nhiều tags
- Filter theo tag

## 2. File cần làm việc

### Core Files:
- `apps/web/src/app/(student)/notebook/notebook-client.tsx` - Client component, logic filter
- `apps/web/src/app/(student)/notebook/_components/collection-sidebar.tsx` - Sidebar với filters
- `apps/web/src/app/(student)/notebook/_components/notebook/vocabulary-card.tsx` - Card hiển thị từ vựng
- `apps/web/src/features/vocabulary/hooks/useVocabulary.ts` - Hook quản lý state
- `apps/web/src/features/vocabulary/services/vocabulary.service.ts` - Service layer (DB operations)

### Actions:
- `apps/web/src/features/vocabulary/actions-phase2.ts` - Server actions

## 3. Các Vấn Đề Cần Xử Lý

### 3.1 Đã Fix ✅
- Logic filter "Cần ôn" / "Đã thuộc" / "Tất cả" đã đúng
- `dueCount` trong hook đã nhất quán với filter
- `unmarkMastered` và `bulkMarkMastered` đã tự tạo review record khi unmark

### 3.2 Chưa Fix ❌

#### Vấn đề 1: Hiển thị nhãn bộ sưu tập trên vocabulary card
- **Mô tả:** Vocabulary card chưa hiển thị rõ ràng từ vựng thuộc những bộ sưu tập nào
- **Yêu cầu:** Hiển thị badges/chips cho các collection mà từ vựng đó thuộc về
- **File cần sửa:** `vocabulary-card.tsx`

#### Vấn đề 2: Filter theo bộ sưu tập
- **Mô tả:** Khi ấn vào bộ sưu tập trong sidebar, chưa hiển thị đúng từ vựng trong bộ đó
- **Yêu cầu:** Lọc hiển thị từ vựng thuộc bộ sưu tập được chọn (không filter status)
- **File cần sửa:** `notebook-client.tsx` (filter logic)

#### Vấn đề 3: CRUD Collections với Dialog xác nhận
- **Mô tả:** Khi xóa bộ sưu tập, cần hỏi người dùng xác nhận
- **Yêu cầu:**
  - Dialog xác nhận khi delete collection
  - Thông báo rõ: "Từ vựng sẽ không bị xóa, chỉ bị mất nhãn trong bộ sưu tập này"
  - Options: "Hủy" / "Xóa"
- **File cần sửa:** `collection-sidebar.tsx` hoặc tạo dialog component riêng

## 4. Data Models

### UserNotebookEntry
```typescript
interface UserNotebookEntry {
  id: string;
  vocabularyId: string;
  vocabulary: Vocabulary;
  masteredAt: Date | null;       // null = chưa thuộc
  collections: string[];         // array of collection IDs
  tags: string[];
  review: ReviewData | null;    // SRS review data
}
```

### ReviewData
```typescript
interface ReviewData {
  id: string;
  easeFactor: number;
  intervalDays: number;
  repetition: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
}
```

## 5. Filter Logic (Hiện tại trong notebook-client.tsx)

```typescript
if (collectionFilter.kind === "due") {
  // "Cần ôn": từ vựng CHƯA thuộc và đến hạn ôn
  result = result.filter(
    (e) =>
      e.masteredAt == null &&
      e.review != null &&
      new Date(e.review.dueAt).getTime() <= Date.now(),
  );
} else if (collectionFilter.kind === "mastered") {
  // "Đã thuộc": từ vựng đã được đánh dấu thuộc
  result = result.filter((e) => e.masteredAt != null);
}
// "all" và "collection": hiển thị tất cả (không filter theo status)
```

## 6. Các Bước Tiếp Theo

1. **Fix hiển thị collection labels** trên vocabulary card
2. **Fix filter collection** - đảm bảo khi chọn collection hiển thị đúng từ vựng
3. **Thêm dialog xác nhận delete** collection
4. **Test các scenario:**
   - Thêm từ vào nhiều collections → kiểm tra labels
   - Chọn filter collection → kiểm tra hiển thị
   - Unmark "Đã thuộc" → kiểm tra xuất hiện trong "Cần ôn"
