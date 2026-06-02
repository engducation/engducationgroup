/**
 * useVocabulary - Hook quản lý từ vựng cho Student
 *
 * PRD Section 9.13: Tim kiem theo tu goc hoac nghia.
 * PRD Section 9.13: Loc theo cap do va chu de.
 * PRD Section 9.13: Luu bo luu, cap nhat danh sach ngay lap tuc.
 * PRD Section 12: Khi bo luu, danh sach cap nhat ngay lap tuc.
 */

"use client";

import { useState, useCallback } from "react";
import type {
  VocabularyWithMeta,
  UserNotebookEntry,
} from "../types/schemas";

export function useVocabulary() {
  const [searchResults, setSearchResults] = useState<VocabularyWithMeta[]>([]);
  const [notebook, setNotebook] = useState<UserNotebookEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { getUserNotebook } = await import("@/features/vocabulary/actions");
      const entries = await getUserNotebook();
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
          // PRD Section 12: Danh sach cap nhat ngay lap tuc
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

  const removeFromNotebook = useCallback(
    async (vocabularyId: string) => {
      setIsSaving(true);
      setError(null);
      try {
        const { removeVocabularyFromNotebook } = await import("@/features/vocabulary/actions");
        const result = await removeVocabularyFromNotebook(vocabularyId);
        if (result.success) {
          // PRD Section 12: Danh sach cap nhat ngay lap tuc
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

  return {
    searchResults,
    notebook,
    isSearching,
    isSaving,
    error,
    search,
    loadNotebook,
    saveToNotebook,
    removeFromNotebook,
    isSaved,
  };
}
