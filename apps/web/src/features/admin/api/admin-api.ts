import { adminApiClient } from "./client";
import { ADMIN_API_ENDPOINTS } from "./endpoints";

export interface AdminCoursePayload {
  title: string;
  description?: string;
  detailedDescription?: string;
  learningObjectives?: string;
  targetAudience?: string;
  level: string;
  language?: string;
  thumbnailUrl?: string;
  certificateTemplateUrl?: string;
  policyNotes?: string;
  status?: "DRAFT" | "PUBLISHED" | "PAUSED";
}

export interface AdminModulePayload {
  courseId: string;
  title: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED" | "PAUSED";
  orderIndex?: number;
}

export interface AdminLessonPayload {
  moduleId: string;
  title: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED" | "PAUSED";
  orderIndex?: number;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasQuiz?: boolean;
  hasVideo?: boolean;
  hasVocabulary?: boolean;
  isRequired?: boolean;
}

export interface ReorderLessonPayload {
  id: string;
  orderIndex: number;
}

export interface AdminModuleVocabularyPayload {
  moduleId: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  orderIndex?: number;
  status?: "DRAFT" | "PUBLISHED" | "PAUSED";
}

export interface AdminQuizQuestionPayload {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

function unwrap<T>(data: { data: T }) {
  return data.data;
}

export const adminApi = {
  // AI Prompts
  getAiPrompts: async () => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.aiPrompts);
    return unwrap(response.data);
  },

  createAiPrompt: async (payload: { name: string; description?: string; systemPrompt: string; userPromptTemplate: string; temperature?: number; maxTokens?: number }) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.aiPrompts, payload);
    return unwrap(response.data);
  },

  updateAiPrompt: async (promptId: string, payload: Partial<{ name: string; description?: string; systemPrompt: string; userPromptTemplate: string; temperature?: number; maxTokens?: number }>) => {
    const response = await adminApiClient.patch(ADMIN_API_ENDPOINTS.aiPromptDetail(promptId), payload);
    return unwrap(response.data);
  },

  deleteAiPrompt: async (promptId: string) => {
    const response = await adminApiClient.delete(ADMIN_API_ENDPOINTS.aiPromptDetail(promptId));
    return unwrap(response.data);
  },

  getDashboardOverview: async () => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.dashboardOverview);
    return unwrap(response.data);
  },

  getCourses: async () => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.courses);
    return unwrap(response.data);
  },

  getCourseContentWorkspace: async (courseId: string) => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.courseContentWorkspace(courseId));
    return unwrap(response.data);
  },

  createCourse: async (payload: AdminCoursePayload) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.courses, payload);
    return unwrap(response.data);
  },

  updateCourse: async (courseId: string, payload: Partial<AdminCoursePayload>) => {
    const response = await adminApiClient.patch(ADMIN_API_ENDPOINTS.courseDetail(courseId), payload);
    return unwrap(response.data);
  },

  deleteCourse: async (courseId: string) => {
    const response = await adminApiClient.delete(ADMIN_API_ENDPOINTS.courseDetail(courseId));
    return unwrap(response.data);
  },

  publishCourse: async (courseId: string) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.coursePublish(courseId));
    return unwrap(response.data);
  },

  unpublishCourse: async (courseId: string) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.courseUnpublish(courseId));
    return unwrap(response.data);
  },

  archiveCourse: async (courseId: string) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.courseArchive(courseId));
    return unwrap(response.data);
  },

  createModule: async (payload: AdminModulePayload) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.modules, payload);
    return unwrap(response.data);
  },

  updateModule: async (moduleId: string, payload: Partial<AdminModulePayload>) => {
    const response = await adminApiClient.patch(ADMIN_API_ENDPOINTS.moduleDetail(moduleId), payload);
    return unwrap(response.data);
  },

  deleteModule: async (moduleId: string) => {
    const response = await adminApiClient.delete(ADMIN_API_ENDPOINTS.moduleDetail(moduleId));
    return unwrap(response.data);
  },

  createLesson: async (payload: AdminLessonPayload) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.lessons, payload);
    return unwrap(response.data);
  },

  updateLesson: async (lessonId: string, payload: Partial<AdminLessonPayload>) => {
    const response = await adminApiClient.patch(ADMIN_API_ENDPOINTS.lessonDetail(lessonId), payload);
    return unwrap(response.data);
  },

  deleteLesson: async (lessonId: string) => {
    const response = await adminApiClient.delete(ADMIN_API_ENDPOINTS.lessonDetail(lessonId));
    return unwrap(response.data);
  },

  reorderLessons: async (moduleId: string, lessons: { id: string; orderIndex: number }[]) => {
    const response = await adminApiClient.post(
      `${ADMIN_API_ENDPOINTS.modules}/${moduleId}/reorder-lessons`,
      { lessons }
    );
    return unwrap(response.data);
  },

  upsertLessonRead: async (
    lessonId: string,
    payload: { title: string; content: string; keywords?: string; learningObjectives?: string },
  ) => {
    const response = await adminApiClient.put(ADMIN_API_ENDPOINTS.lessonRead(lessonId), payload);
    return unwrap(response.data);
  },

  upsertLessonWrite: async (
    lessonId: string,
    payload: {
      title?: string;
      prompt: string;
      gradingCriteria?: string;
      wordCountGuidance?: number;
      aiPromptId?: string;
      maxAiRevisions?: number;
      dueDate?: string | null;
      submissionMode?: "OPEN" | "CLOSED";
    },
  ) => {
    const response = await adminApiClient.put(ADMIN_API_ENDPOINTS.lessonWrite(lessonId), payload);
    return unwrap(response.data);
  },

  upsertLessonVideo: async (
    lessonId: string,
    payload: {
      title: string;
      description?: string;
      cloudinaryPublicId: string;
      cloudinaryUrl: string;
      durationSeconds?: number;
      resourceNotes?: string;
    },
  ) => {
    const response = await adminApiClient.put(ADMIN_API_ENDPOINTS.lessonVideo(lessonId), payload);
    return unwrap(response.data);
  },

  upsertLessonQuiz: async (
    lessonId: string,
    payload: { title?: string; passingPercentage?: number | null; questions: AdminQuizQuestionPayload[] },
  ) => {
    const response = await adminApiClient.put(ADMIN_API_ENDPOINTS.lessonQuiz(lessonId), payload);
    return unwrap(response.data);
  },

  // Lesson Vocabulary
  getLessonVocabulary: async (lessonId: string) => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.lessonVocabulary(lessonId));
    return unwrap(response.data);
  },

  addLessonVocabulary: async (lessonId: string, payload: { word: string; meaning: string; partOfSpeech: string; phonetic?: string; example?: string; notes?: string }) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.lessonVocabulary(lessonId), payload);
    return unwrap(response.data);
  },

  updateLessonVocabulary: async (vocabularyId: string, payload: Partial<{ word: string; meaning: string; partOfSpeech: string; phonetic: string; example: string; notes: string; status: string }>) => {
    const response = await adminApiClient.patch(ADMIN_API_ENDPOINTS.lessonVocabularyDetail(vocabularyId), payload);
    return unwrap(response.data);
  },

  deleteLessonVocabulary: async (vocabularyId: string) => {
    const response = await adminApiClient.delete(ADMIN_API_ENDPOINTS.lessonVocabularyDetail(vocabularyId));
    return unwrap(response.data);
  },

  syncLessonVocabulary: async (lessonId: string, vocabularyList: Array<{ id?: string; word: string; meaning: string; partOfSpeech: string; phonetic?: string; example?: string; notes?: string }>) => {
    const response = await adminApiClient.post(`${ADMIN_API_ENDPOINTS.lessonVocabulary(lessonId)}/sync`, { vocabulary: vocabularyList });
    return unwrap(response.data);
  },

  getModuleVocabulary: async (moduleId: string) => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.moduleVocabulary(moduleId));
    return unwrap(response.data);
  },

  createModuleVocabulary: async (payload: AdminModuleVocabularyPayload) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.moduleVocabulary(payload.moduleId), payload);
    return unwrap(response.data);
  },

  updateModuleVocabulary: async (vocabularyId: string, payload: Partial<AdminModuleVocabularyPayload>) => {
    const response = await adminApiClient.patch(
      ADMIN_API_ENDPOINTS.moduleVocabularyDetail(vocabularyId),
      payload,
    );
    return unwrap(response.data);
  },

  deleteModuleVocabulary: async (vocabularyId: string) => {
    const response = await adminApiClient.delete(ADMIN_API_ENDPOINTS.moduleVocabularyDetail(vocabularyId));
    return unwrap(response.data);
  },

  getOrders: async () => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.orders);
    return unwrap(response.data);
  },

  getOrderAnalytics: async () => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.orderAnalytics);
    return unwrap(response.data);
  },

  createManualOrder: async (payload: { userId: string; courseId: string; amount: number }) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.orders, payload);
    return unwrap(response.data);
  },

  approveOrder: async (orderId: string) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.orderApprove(orderId));
    return unwrap(response.data);
  },

  rejectOrder: async (orderId: string, payload: { reason: string }) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.orderReject(orderId), payload);
    return unwrap(response.data);
  },

  getTransactionLogs: async () => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.transactionLogs);
    return unwrap(response.data);
  },

  getReviews: async () => {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.reviews);
    return unwrap(response.data);
  },

  replyReview: async (reviewId: string, payload: { reply: string }) => {
    const response = await adminApiClient.post(ADMIN_API_ENDPOINTS.reviewReply(reviewId), payload);
    return unwrap(response.data);
  },

  updateReviewStatus: async (reviewId: string, payload: { status: "VISIBLE" | "HIDDEN" }) => {
    const response = await adminApiClient.patch(ADMIN_API_ENDPOINTS.reviewStatus(reviewId), payload);
    return unwrap(response.data);
  },
};
