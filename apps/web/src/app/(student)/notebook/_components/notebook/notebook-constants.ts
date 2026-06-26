/**
 * Notebook constants: level options, sort options
 */

export const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type LevelOption = (typeof LEVEL_OPTIONS)[number];
export const ALL_VALUE = "all";

export type SortOption =
  | "recent"
  | "oldest"
  | "alpha"
  | "due"
  | "mastered-last"
  | "level";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Mới lưu trước" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "alpha", label: "A → Z" },
  { value: "due", label: "Đến hạn ôn" },
  { value: "mastered-last", label: "Mastered cuối" },
  { value: "level", label: "Cấp độ (A1 → C2)" },
];
