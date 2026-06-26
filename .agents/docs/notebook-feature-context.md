# Notebook Feature - Simplified Design

## Current State (Simplified)

### Features
- **Single page**: `/notebook` - displays all vocabulary
- **Sidebar**: Collections, Tags, Create new collection
- **VocabularyCard**: Status badges (Mới/Đang học/Cần ôn/Đã thuộc), Collections badges
- **Search + Sort**: Filter by word/meaning, sort by recent/oldest/alpha/due/level

### Status Badges on Card
```
- "Mới" (blue): New vocabulary, no review record
- "Đang học" (blue): Has review record, not mastered, not due yet
- "Cần ôn" (amber): Has review record, dueAt <= now, not mastered
- "Đã thuộc" (amber): masteredAt is not null
```

### Removed Features
- ~~Spelling page~~ - Removed
- ~~Review page~~ - Removed
- ~~Quiz page~~ - Removed
- ~~Status filters in sidebar~~ (Cần ôn, Đã thuộc, Tất cả) - Removed
- ~~Bulk "Mark as mastered/unmark"~~ - Removed
- ~~Toggle mastered button on card~~ - Removed

### Bulk Actions
- Delete selected vocabulary
- Add to collection
- Clear selection

### Filter Options
- All vocabulary (default)
- By collection
- By tag
- Search (word/meaning)

## File Structure
```
apps/web/src/app/(student)/notebook/
├── page.tsx                    # Server component
├── notebook-client.tsx          # Main client component
├── _components/
│   ├── collection-sidebar.tsx   # Collections, tags, stats
│   ├── bulk-action-bar.tsx     # Floating action bar
│   ├── pronunciation-tooltip.tsx
│   ├── tag-editor.tsx
│   ├── note-editor.tsx
│   ├── collection-picker.tsx
│   └── notebook/
│       ├── vocabulary-card.tsx
│       ├── search-filter-bar.tsx
│       ├── empty-state.tsx
│       ├── no-results-state.tsx
│       ├── loading-skeleton.tsx
│       ├── shortcut-help-modal.tsx
│       ├── notebook-constants.ts
│       └── notebook-utils.ts
```

## TODO
- [ ] Consider when vocabulary becomes "Đã thuộc": should be after passing a quiz?
