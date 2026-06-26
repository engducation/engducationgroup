"use client";

/**
 * PronunciationTooltip
 *
 * Hiển thị phiên âm IPA và khi hover sẽ liệt kê cách đọc từng âm
 * bằng tiếng Việt, kèm ví dụ tham chiếu.
 */

import { Volume2 } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parsePhonetic } from "@/lib/phonetic-map";
import { cn } from "@/lib/utils";

export function PronunciationTooltip({
  phonetic,
  className,
}: {
  phonetic: string;
  className?: string;
}) {
  const entries = parsePhonetic(phonetic);
  if (!phonetic) return null;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border bg-slate-50 px-2 py-1 text-sm font-mono text-slate-600 hover:bg-slate-100",
          className,
        )}
        aria-label="Xem cách đọc"
      >
        <Volume2 className="h-3.5 w-3.5 text-slate-500" />
        {phonetic}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">
          Cách đọc từng âm
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">Không nhận diện được ký hiệu IPA.</p>
        ) : (
          <ul className="space-y-1.5">
            {entries.map((entry, i) => (
              <li
                key={`${entry.symbol}-${i}`}
                className="flex items-start gap-3 text-sm"
              >
                <span className="w-10 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center font-mono text-xs">
                  {entry.symbol}
                </span>
                <div className="flex-1">
                  <div className="text-slate-700">{entry.sound}</div>
                  {entry.example && (
                    <div className="text-xs italic text-slate-400">
                      ví dụ: {entry.example}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}