// Admin Services Index
// Re-exports all admin services for convenient imports

// Course Management
export * from "./course.service";

// Module Management
export * from "./module.service";

// Lesson Management
export * from "./lesson.service";

// Vocabulary Management (Admin - module-specific)
export * from "./vocabulary-admin.service";

// Vocabulary Management (Global)
export { getVocabulary, createVocabulary, updateVocabulary, deleteVocabulary, bulkImportVocabulary } from "./vocabulary-global.service";

// Order Management
export { getAdminOrders, getAdminOrderById, createAdminManualOrder, approveAdminOrder, rejectAdminOrder, getAdminOrderAnalytics, getAdminTransactionLogs, grantSubscriptionForOrderSuccess } from "./order.service";
export type { OrderStatus, OrderStats } from "./order.service";

// Review Management
export * from "./review.service";

// AI Prompt Management
export * from "./ai-prompt.service";

// AI Quota & Usage
export * from "./ai-quota.service";

// Support Tickets
export * from "./support.service";

// User Moderation & Audit
export { banUser, unbanUser, getUsersWithModeration, getAdminUsers, getSystemSettings, getSystemSetting, updateSystemSetting, getAdminAuditLogs, logAdminAction } from "./user-moderation.service";

// Quiz Management
export { getQuizzes, getQuizById, createQuiz, deleteQuiz, getQuizQuestions, createQuizQuestion, updateQuizQuestion, deleteQuizQuestion } from "./quiz.service";

// Admin V2 Service (integrated layer)
export * from "./admin-v2.service";
