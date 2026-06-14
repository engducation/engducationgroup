/**
 * Learning Content Feature - Public API
 *
 * Export all public types, actions, and hooks.
 */

export * from "./actions";
// Writing actions live in a separate file to keep `actions.ts` under the
// 250-line size cap. Re-export them here so consumers can keep importing
// from "@/features/learning-content".
export {
  submitWritingAction,
  getLatestWritingSubmissionAction,
  loadWritingForLessonAction,
  saveWritingDraftAction,
} from "./actions-writing";
export * from "./types";
