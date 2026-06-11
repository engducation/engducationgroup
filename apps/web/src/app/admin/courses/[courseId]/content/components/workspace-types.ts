// Shared types for workspace components
// Centralized type definitions to avoid duplication

export type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

export type WorkspaceLesson = {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  isRequired: boolean;
  // Lesson type flags (determines lesson type, prioritized order matters)
  hasRead?: boolean;
  hasWrite?: boolean;
  hasQuiz?: boolean;
  hasVideo?: boolean;
  hasVocabulary?: boolean;
  read?: {
    title?: string | null;
    content?: string | null;
    keywords?: string | null;
    learningObjectives?: string | null;
  } | null;
  write?: {
    prompt?: string | null;
    gradingCriteria?: string | null;
    wordCountGuidance?: number | null;
    aiPromptId?: string | null;
    maxAiRevisions?: number | null;
  } | null;
  video?: {
    title?: string | null;
    description?: string | null;
    cloudinaryPublicId?: string | null;
    cloudinaryUrl?: string | null;
    durationSeconds?: number | null;
  } | null;
  quiz?: {
    questions?: Array<{
      question: string;
      options?: string;
      correctOption?: number;
      explanation?: string;
    }>;
  } | null;
};

export type WorkspaceModule = {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  lessons?: WorkspaceLesson[];
};

export type WorkspaceCourse = {
  id: string;
  title?: string;
  status?: StatusValue;
  modules?: WorkspaceModule[];
};

export type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING" | "VOCABULARY";
