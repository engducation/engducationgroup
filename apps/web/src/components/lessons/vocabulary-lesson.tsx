"use client";

import { useState } from "react";
import { CheckCircle2, BookOpen, Volume2, ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VocabularyItem {
  id: string;
  word: string;
  phonetic?: string | null;
  partOfSpeech: string;
  meaning: string;
  example?: string | null;
  notes?: string | null;
}

interface VocabularyLessonProps {
  lessonId: string;
  title: string;
  items: VocabularyItem[];
  isCompleted: boolean;
  onComplete: () => void;
  onAddToNotebook?: (item: VocabularyItem) => void;
}

function VocabularyCard({
  item,
  isFlipped,
  onFlip,
  onAddToNotebook,
}: {
  item: VocabularyItem;
  isFlipped: boolean;
  onFlip: () => void;
  onAddToNotebook?: (item: VocabularyItem) => void;
}) {
  return (
    <div
      className="relative h-80 cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <div
        className={`absolute inset-0 transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front - Word */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 flex flex-col items-center justify-center text-white shadow-xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-xs uppercase tracking-widest opacity-70 mb-4">
            {item.partOfSpeech}
          </span>
          <h2 className="text-4xl font-bold text-center mb-2">{item.word}</h2>
          {item.phonetic && (
            <p className="text-lg text-white/70">{item.phonetic}</p>
          )}
          <p className="text-sm text-white/60 mt-6">Nhấn để xem nghĩa</p>
        </div>

        {/* Back - Meaning */}
        <div
          className="absolute inset-0 rounded-2xl bg-white border-2 border-indigo-100 p-6 flex flex-col shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-center mb-4">
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
              {item.partOfSpeech}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{item.meaning}</h3>
          </div>

          {item.example && (
            <div className="mt-auto pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 italic">"{item.example}"</p>
            </div>
          )}

          {item.notes && (
            <div className="mt-2">
              <p className="text-xs text-slate-400">{item.notes}</p>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            {onAddToNotebook && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToNotebook(item);
                }}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                Lưu vào sổ từ vựng
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VocabularyLesson({
  lessonId,
  title,
  items,
  isCompleted,
  onComplete,
  onAddToNotebook,
}: VocabularyLessonProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [shuffledItems, setShuffledItems] = useState<VocabularyItem[]>(items);
  const [isShuffled, setIsShuffled] = useState(false);

  const currentItem = shuffledItems[currentIndex];
  const isFlipped = flippedCards.has(currentIndex);
  const hasStudiedCurrent = studiedCards.has(currentIndex);

  const shuffleCards = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setIsShuffled(true);
    setCurrentIndex(0);
    setFlippedCards(new Set());
    setStudiedCards(new Set());
  };

  const resetCards = () => {
    setShuffledItems(items);
    setIsShuffled(false);
    setCurrentIndex(0);
    setFlippedCards(new Set());
    setStudiedCards(new Set());
  };

  const flipCard = () => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(currentIndex)) {
      newFlipped.delete(currentIndex);
    } else {
      newFlipped.add(currentIndex);
    }
    setFlippedCards(newFlipped);

    // Mark as studied when first flipped
    if (!studiedCards.has(currentIndex)) {
      const newStudied = new Set(studiedCards);
      newStudied.add(currentIndex);
      setStudiedCards(newStudied);
    }
  };

  const goNext = () => {
    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const studiedCount = studiedCards.size;
  const progressPercent = items.length > 0 ? Math.round((studiedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-600">
            <BookOpen className="size-3 mr-1" />
            Bài học Từ vựng
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="size-3" />
              Đã hoàn thành
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">{title}</h1>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-slate-600 shrink-0">
            {studiedCount}/{items.length}
          </span>
        </div>
      </div>

      {/* Flashcard */}
      <div className="max-w-md mx-auto">
        <VocabularyCard
          item={currentItem}
          isFlipped={isFlipped}
          onFlip={flipCard}
          onAddToNotebook={onAddToNotebook}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between max-w-md mx-auto">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="size-4" />
          Trước
        </Button>

        <div className="flex items-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`size-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-indigo-500 w-4"
                  : studiedCards.has(index)
                  ? "bg-emerald-400"
                  : "bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={goNext}
          disabled={currentIndex === items.length - 1}
          className="gap-2"
        >
          Tiếp
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={shuffleCards}
          className="gap-2"
        >
          <Shuffle className="size-4" />
          Xáo trộn
        </Button>
        {isShuffled && (
          <Button
            variant="outline"
            onClick={resetCards}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Đặt lại
          </Button>
        )}
      </div>

      {/* Complete Button */}
      {!isCompleted && (
        <div className="text-center">
          {studiedCount === items.length ? (
            <div className="space-y-4">
              <p className="text-slate-600">Bạn đã học hết từ vựng!</p>
              <Button
                onClick={onComplete}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <CheckCircle2 className="size-4" />
                Hoàn thành bài học
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Hãy học hết các từ vựng để hoàn thành bài học.
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-emerald-900">
            Bạn đã hoàn thành bài học này!
          </h3>
          <p className="text-sm text-emerald-600 mt-1">
            Tiếp tục với bài học tiếp theo để học thêm nhiều từ vựng mới.
          </p>
        </div>
      )}
    </div>
  );
}
