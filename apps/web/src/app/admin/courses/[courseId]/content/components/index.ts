// Workspace Components Index
// Re-exports all workspace components for easy importing

// Layout Components
export { CourseHeaderBanner } from "./course-header-banner";
export { ModuleAccordion } from "./module-accordion";
export { SubWorkspaceHeader } from "./sub-workspace-header";
export { StickyActionBar } from "./sticky-action-bar";

// Lesson Editor Components (Legacy Dialog)
export { LessonFormDialog } from "./lesson-form-dialog";

// Sheet Components (New slide-over patterns)
export { ModuleSheet } from "./module-sheet";
export { CourseEditSheet } from "./course-edit-sheet";
export { LessonCreateSheet } from "./lesson-create-sheet";

// Legacy Components (for compatibility)
export { LessonCard } from "./lesson-card";
export { VocabularyCard } from "./vocabulary-card";
export { ModuleCard } from "./module-card";
export { ModuleFormDialog } from "./module-form";
export { VocabularyFormDialog } from "./vocabulary-form";
export { LessonFormDialog as LessonFormDialogLegacy } from "./lesson-form";
export { DeleteConfirmDialog } from "./delete-confirm-dialog";
export { CourseEditDialog } from "./course-edit-dialog";

// Re-export types
export type {
  WorkspaceLesson,
  WorkspaceModule,
  WorkspaceCourse,
  StatusValue,
  LessonType,
} from "./workspace-types";
