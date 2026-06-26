"use client";

/**
 * useVocabulary - Hook quản lý từ vựng cho Student (Phase 1 + 2)
 *
 * Phase 1: search, save, remove, notebook
 * Phase 2: collections, tags, note, mastered, SRS, bulk, share
 */

import { useState, useCallback, useMemo } from "react";
import type {
  VocabularyWithMeta,
  UserNotebookEntry,
} from "../types/schemas";

export type { UserNotebookEntry };

// VocabularyCollection shape used in the UI (incl. item count).
export type VocabularyCollection = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  isPublic: boolean;
  shareSlug: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: number;
};

export function useVocabulary() {
  const [searchResults, setSearchResults] = useState<VocabularyWithMeta[]>([]);
  const [notebook, setNotebook] = useState<UserNotebookEntry[]>([]);
  const [collections, setCollections] = useState<VocabularyCollection[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Phase 1 ──────────────────────────────────────────────────────────

  const search = useCallback(
    async (query: string, level?: string, topic?: string) => {
      setIsSearching(true);
      setError(null);
      try {
        const { searchVocabulary } = await import("@/features/vocabulary/actions");
        const result = await searchVocabulary({ query, level, topic, limit: 20, offset: 0 });
        setSearchResults(result.items);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tìm kiếm từ vựng");
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  const loadNotebook = useCallback(async () => {
    setError(null);
    try {
      const { getNotebookAction } = await import("@/features/vocabulary/actions-phase2");
      const entries = await getNotebookAction();
      setNotebook(entries as UserNotebookEntry[]);
      return entries;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải sổ từ vựng");
      return null;
    }
  }, []);

  const saveToNotebook = useCallback(
    async (vocabularyId: string) => {
      setIsSaving(true);
      setError(null);
      try {
        const { saveVocabularyToNotebook } = await import("@/features/vocabulary/actions");
        const result = await saveVocabularyToNotebook(vocabularyId);
        if (result.success) {
          await loadNotebook();
          return true;
        }
        setError(result.error);
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi lưu từ vựng");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [loadNotebook],
  );

  const saveLessonItemToNotebook = useCallback(
    async (lessonVocabularyItemId: string) => {
      setIsSaving(true);
      setError(null);
      try {
        const { saveLessonVocabItemToNotebook } = await import(
          "@/features/vocabulary/actions"
        );
        const result = await saveLessonVocabItemToNotebook(
          lessonVocabularyItemId,
        );
        if (result.success) {
          await loadNotebook();
          return true;
        }
        setError(result.error);
        return false;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Lỗi khi lưu từ vựng vào sổ tay",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [loadNotebook],
  );

  const removeFromNotebook = useCallback(
    async (vocabularyId: string) => {
      setIsSaving(true);
      setError(null);
      try {
        const { removeVocabularyFromNotebook } = await import(
          "@/features/vocabulary/actions"
        );
        const result = await removeVocabularyFromNotebook(vocabularyId);
        if (result.success) {
          setNotebook((prev) => prev.filter((e) => e.vocabulary.id !== vocabularyId));
          return true;
        }
        setError(result.error);
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi xóa từ vựng");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const isSaved = useCallback(
    (vocabularyId: string): boolean => {
      return notebook.some((e) => e.vocabulary.id === vocabularyId);
    },
    [notebook],
  );

  // ─── Phase 2: derived selectors ────────────────────────────────────────

  const reviewEntry = useCallback(
    (vocabularyId: string) =>
      notebook.find((e) => e.vocabulary.id === vocabularyId)?.review,
    [notebook],
  );

  const isMastered = useCallback(
    (vocabularyId: string) => {
      const entry = notebook.find((e) => e.vocabulary.id === vocabularyId);
      return entry ? entry.masteredAt !== null : false;
    },
    [notebook],
  );

  const tagsForVocab = useCallback(
    (vocabularyId: string) => {
      const entry = notebook.find((e) => e.vocabulary.id === vocabularyId);
      return (entry?.tags ?? []) as string[];
    },
    [notebook],
  );

  const dueCount = useMemo(
    () =>
      notebook.filter(
        (e) =>
          e.masteredAt == null &&
          e.review &&
          new Date(e.review.dueAt).getTime() <= Date.now(),
      ).length,
    [notebook],
  );

  // ─── Phase 2: collections ─────────────────────────────────────────────

  const loadCollections = useCallback(async () => {
    setError(null);
    try {
      const { listCollectionsAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await listCollectionsAction();
      setCollections(result as VocabularyCollection[]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải bộ sưu tập");
      return null;
    }
  }, []);

  const createCollection = useCallback(
    async (input: { name: string; description?: string; color?: string }) => {
      try {
        const { createCollectionAction } = await import(
          "@/features/vocabulary/actions-phase2"
        );
        const result = await createCollectionAction(input);
        if (result.success) {
          await loadCollections();
        }
        return result;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Lỗi không xác định",
        };
      }
    },
    [loadCollections],
  );

  const renameCollection = useCallback(
    async (id: string, name: string) => {
      const { updateCollectionAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await updateCollectionAction(id, { name });
      if (result.success) await loadCollections();
      return result;
    },
    [loadCollections],
  );

  const updateCollection = useCallback(
    async (id: string, input: { name?: string; description?: string; color?: string }) => {
      const { updateCollectionAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await updateCollectionAction(id, input);
      if (result.success) await loadCollections();
      return result;
    },
    [loadCollections],
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      const { deleteCollectionAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await deleteCollectionAction(id);
      if (result.success) await Promise.all([loadCollections(), loadNotebook()]);
      return result;
    },
    [loadCollections, loadNotebook],
  );

  const addToCollection = useCallback(
    async (collectionId: string, vocabularyId: string) => {
      const { addToCollectionAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await addToCollectionAction(collectionId, vocabularyId);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  const removeFromCollection = useCallback(
    async (collectionId: string, vocabularyId: string) => {
      const { removeFromCollectionAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await removeFromCollectionAction(collectionId, vocabularyId);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  const bulkAddToCollection = useCallback(
    async (collectionId: string, vocabularyIds: string[]) => {
      const { bulkAddToCollectionAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await bulkAddToCollectionAction(collectionId, vocabularyIds);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  // ─── Phase 2: tags / note / mastered ──────────────────────────────────

  const loadTags = useCallback(async () => {
    try {
      const { listUserTagsAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await listUserTagsAction();
      setTags(result);
      return result;
    } catch (err) {
      return [];
    }
  }, []);

  const updateTags = useCallback(
    async (vocabularyId: string, newTags: string[]) => {
      const { updateTagsAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await updateTagsAction(vocabularyId, newTags);
      if (result.success) {
        await Promise.all([loadNotebook(), loadTags()]);
      }
      return result;
    },
    [loadNotebook, loadTags],
  );

  const updateNote = useCallback(
    async (vocabularyId: string, note: string) => {
      const { updateNoteAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await updateNoteAction(vocabularyId, note);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  const markMastered = useCallback(
    async (vocabularyId: string) => {
      const { markMasteredAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await markMasteredAction(vocabularyId);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  const unmarkMastered = useCallback(
    async (vocabularyId: string) => {
      const { unmarkMasteredAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await unmarkMasteredAction(vocabularyId);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  // ─── Phase 2: bulk ────────────────────────────────────────────────────

  const bulkRemove = useCallback(
    async (vocabularyIds: string[]) => {
      const { bulkRemoveFromNotebookAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await bulkRemoveFromNotebookAction(vocabularyIds);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  const bulkMarkMastered = useCallback(
    async (vocabularyIds: string[], mastered: boolean) => {
      const { bulkMarkMasteredAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await bulkMarkMasteredAction(vocabularyIds, mastered);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  // ─── Phase 2: SRS ─────────────────────────────────────────────────────

  const submitReview = useCallback(
    async (vocabularyId: string, grade: 0 | 1 | 2 | 3) => {
      const { submitReviewAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await submitReviewAction(vocabularyId, grade);
      if (result.success) await loadNotebook();
      return result;
    },
    [loadNotebook],
  );

  // ─── Phase 2: share ───────────────────────────────────────────────────

  const toggleCollectionPublic = useCallback(
    async (collectionId: string, isPublic: boolean) => {
      const { toggleCollectionPublicAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await toggleCollectionPublicAction(collectionId, isPublic);
      if (result.success) await loadCollections();
      return result;
    },
    [loadCollections],
  );

  const cloneSharedCollection = useCallback(
    async (shareSlug: string) => {
      const { cloneSharedCollectionAction } = await import(
        "@/features/vocabulary/actions-phase2"
      );
      const result = await cloneSharedCollectionAction(shareSlug);
      if (result.success) {
        await Promise.all([loadCollections(), loadNotebook()]);
      }
      return result;
    },
    [loadCollections, loadNotebook],
  );

  return {
    // Phase 1
    searchResults,
    notebook,
    isSearching,
    isSaving,
    error,
    search,
    loadNotebook,
    saveToNotebook,
    saveLessonItemToNotebook,
    removeFromNotebook,
    isSaved,
    // Phase 2
    collections,
    tags,
    dueCount,
    reviewEntry,
    isMastered,
    tagsForVocab,
    loadCollections,
    loadTags,
    createCollection,
    renameCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    bulkAddToCollection,
    updateTags,
    updateNote,
    markMastered,
    unmarkMastered,
    submitReview,
    bulkRemove,
    bulkMarkMastered,
    toggleCollectionPublic,
    cloneSharedCollection,
  };
}
