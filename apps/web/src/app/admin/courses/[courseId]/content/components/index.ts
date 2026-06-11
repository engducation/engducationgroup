// Workspace Components Index
// Re-exports all workspace components for easy importing

// Layout Components
export { CourseHeaderBanner } from "./course-header-banner";
export { ModuleAccordion } from "./module-accordion";
export { SubWorkspaceHeader } from "./sub-workspace-header";
export { StickyActionBar } from "./sticky-action-bar";

// Lesson Editor Components
export { TextLessonEditor } from "./text-lesson-editor";
export { VideoLessonEditor } from "./video-lesson-editor";
export { QuizLessonEditor } from "./quiz-lesson-editor";
export { WritingLessonEditor } from "./writing-lesson-editor";
export { LessonFormDialog } from "./lesson-form-dialog";

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
export type { WorkspaceLesson, WorkspaceVocabulary, WorkspaceModule, WorkspaceCourse, StatusValue, LessonType } from "./workspace-types";
