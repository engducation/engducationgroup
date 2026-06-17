"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  /** ISO datetime string */
  expiresAt: string;
  onExpire?: () => void;
}

/**
 * Countdown tới expiresAt. Render mm:ss. Khi hit 0 → gọi onExpire (1 lần).
 * Sử dụng `useState` cho giá trị hiển thị và `useEffect` cho interval — pattern
 * cơ bản, không cần useTransition ở đây vì update 1s/lần không block UI.
 */
export function Countdown({ expiresAt, onExpire }: CountdownProps) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      const next = Math.max(0, target - Date.now());
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onExpire, remaining]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isCritical = remaining > 0 && remaining < 60_000;
  const isExpired = remaining <= 0;

  return (
    <div
      className={`inline-flex items-baseline gap-1 rounded-lg px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${
        isExpired
          ? "bg-red-50 text-red-700"
          : isCritical
            ? "bg-amber-50 text-amber-700"
            : "bg-slate-100 text-slate-700"
      }`}
    >
      {isExpired ? (
        <span>Đã hết hạn</span>
      ) : (
        <>
          <span className="text-base">{String(minutes).padStart(2, "0")}</span>
          <span>:</span>
          <span className="text-base">{String(seconds).padStart(2, "0")}</span>
        </>
      )}
    </div>
  );
}
