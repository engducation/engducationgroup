/**
 * Notebook utility helpers
 */

import { useState, useEffect } from "react";

// ─── Date formatting ───────────────────────────────────────────────────────────

export function formatRelativeTime(date: Date | string): string {
  const saved = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - saved.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  if (diffDay < 30) return `${diffWeek} tuần trước`;
  return saved.toLocaleDateString("vi-VN");
}

// ─── Debounce hook ─────────────────────────────────────────────────────────────

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
