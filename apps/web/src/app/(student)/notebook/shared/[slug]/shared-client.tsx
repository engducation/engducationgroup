"use client";

/**
 * SharedCollectionClient
 *
 * Renders a public-shared collection. Anyone (no auth) can browse the
 * contents. Logged-in users can "Clone to my Notebook" which adds every
 * word + creates a new collection owned by the current user.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Globe,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { cloneSharedCollectionAction } from "@/features/vocabulary";
import { PronunciationTooltip } from "@/app/(student)/notebook/_components/pronunciation-tooltip";

export type SharedCollectionData = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  ownerName: string | null;
  createdAt: string;
  items: Array<{
    word: string;
    phonetic: string | null;
    partOfSpeech: string;
    meaning: string;
    examples: string | null;
    level: string | null;
    topic: string | null;
  }>;
};

export function SharedCollectionClient({
  slug,
  collection,
  currentUserId,
}: {
  slug: string;
  collection: SharedCollectionData;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);

  const handleClone = useCallback(async () => {
    if (!currentUserId) {
      toast.message("Vui lòng đăng nhập để clone bộ sưu tập");
      return;
    }
    setCloning(true);
    try {
      const result = await cloneSharedCollectionAction(slug);
      if (!result.success) {
        toast.error(result.error ?? "Lỗi khi clone");
        return;
      }
      setCloned(true);
      toast.success("Đã thêm vào Notebook của bạn");
    } finally {
      setCloning(false);
    }
  }, [slug, currentUserId]);

  const handleSpeak = useCallback((word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => router.push("/notebook")}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm hover:bg-slate-100"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Về Notebook
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
            <Globe className="h-3 w-3" />
            <span>Chia sẻ công khai</span>
          </div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {collection.color && (
              <span
                className="inline-block h-4 w-4 rounded-full"
                style={{ backgroundColor: collection.color }}
              />
            )}
            {collection.name}
          </CardTitle>
          {collection.description && (
            <p className="text-sm text-slate-500">{collection.description}</p>
          )}
          <div className="text-xs text-slate-400">
            Chia sẻ bởi {collection.ownerName ?? "anonymous"} · {collection.items.length} từ
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {collection.items.map((item, i) => (
              <div
                key={`${item.word}-${i}`}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.word}</span>
                    <span className="text-xs text-slate-500">{item.partOfSpeech}</span>
                    {item.level && (
                      <Badge variant="outline" className="text-xs">
                        {item.level}
                      </Badge>
                    )}
                  </div>
                  {item.phonetic && (
                    <PronunciationTooltip
                      phonetic={item.phonetic}
                      className="mt-1 text-xs"
                    />
                  )}
                  <div className="mt-1 text-sm text-slate-700">{item.meaning}</div>
                  {item.examples && (
                    <div className="mt-1 text-xs italic text-slate-500">
                      {item.examples}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSpeak(item.word)}
                  aria-label="Phát âm"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          {currentUserId ? (
            <Button onClick={handleClone} disabled={cloning || cloned}>
              {cloned ? (
                <>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Đã clone
                </>
              ) : (
                <>
                  <Bookmark className="mr-1 h-4 w-4" /> Clone vào Notebook của tôi
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => router.push("/login")}>Đăng nhập để clone</Button>
          )}
        </CardFooter>
      </Card>

      {!collection.items.length && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Bộ sưu tập này chưa có từ nào.
        </p>
      )}
    </div>
  );
}
