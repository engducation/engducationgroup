"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, FileQuestion, AlertCircle, ArrowRight, RotateCcw, Trophy, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface QuizLessonProps {
  lessonId: string;
  title: string;
  passingPercentage?: number;
  questions: QuizQuestion[];
  isCompleted: boolean;
  onComplete: (score: number, totalQuestions: number, answers: number[]) => void;
}

export function QuizLesson({
  lessonId,
  title,
  passingPercentage = 70,
  questions,
  isCompleted,
  onComplete,
}: QuizLessonProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const question = questions[currentQuestion];
  const hasAnswered = answers[currentQuestion] !== null;
  const isCorrect = selectedAnswer === question.correctOption;
  const isPassed = showResults && calculateScore() >= passingPercentage;

  function calculateScore() {
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctOption) {
        correct++;
      }
    }
    return Math.round((correct / questions.length) * 100);
  }

  const handleSelectAnswer = (index: number) => {
    if (hasAnswered || isSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      setIsSubmitted(true);
      setShowResults(true);
    }
  };

  const handleFinishQuiz = () => {
    const score = calculateScore();
    const answerArray = answers.map(a => a ?? -1);
    onComplete(score, questions.length, answerArray);
  };

  const handleRetryQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers(new Array(questions.length).fill(null));
    setShowExplanation(false);
    setIsSubmitted(false);
    setShowResults(false);
  };

  // Results view
  if (showResults) {
    const score = calculateScore();
    const correctCount = questions.filter((q, i) => answers[i] === q.correctOption).length;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
              <FileQuestion className="size-3 mr-1" />
              Bài tập Quiz
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="size-3" />
                Đã hoàn thành
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>

        {/* Results Card */}
        <div className={`rounded-2xl border p-8 text-center ${
          isPassed
            ? "bg-emerald-50 border-emerald-200"
            : "bg-rose-50 border-rose-200"
        }`}>
          <div className="flex justify-center mb-4">
            <div className={`flex size-20 items-center justify-center rounded-full ${
              isPassed ? "bg-emerald-100" : "bg-rose-100"
            }`}>
              {isPassed ? (
                <Trophy className="size-10 text-emerald-600" />
              ) : (
                <RotateCcw className="size-10 text-rose-600" />
              )}
            </div>
          </div>

          <h2 className={`text-3xl font-bold mb-2 ${isPassed ? "text-emerald-700" : "text-rose-700"}`}>
            {score}%
          </h2>

          <p className={`text-lg mb-6 ${isPassed ? "text-emerald-600" : "text-rose-600"}`}>
            {isPassed
              ? "Chúc mừng! Bạn đã vượt qua bài quiz!"
              : `Bạn cần đạt ít nhất ${passingPercentage}% để vượt qua.`}
          </p>

          <div className="inline-flex items-center gap-6 bg-white rounded-xl px-6 py-3 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{correctCount}</div>
              <div className="text-xs text-slate-500">Đúng</div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{questions.length - correctCount}</div>
              <div className="text-xs text-slate-500">Sai</div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{questions.length}</div>
              <div className="text-xs text-slate-500">Tổng cộng</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isPassed && !isCompleted && (
              <Button
                onClick={handleRetryQuiz}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="size-4" />
                Làm lại
              </Button>
            )}
            {(isPassed || isCompleted) && (
              <Button
                onClick={handleFinishQuiz}
                className={`gap-2 ${
                  isPassed
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } text-white`}
              >
                <CheckCircle2 className="size-4" />
                {isCompleted ? "Xem kết quả" : "Hoàn thành bài học"}
              </Button>
            )}
          </div>
        </div>

        {/* Review Answers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Xem lại đáp án</h3>
          <div className="space-y-4">
            {questions.map((q, index) => {
              const userAnswer = answers[index];
              const isAnswerCorrect = userAnswer === q.correctOption;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    isAnswerCorrect
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex size-6 items-center justify-center rounded-full shrink-0 ${
                      isAnswerCorrect ? "bg-emerald-200" : "bg-rose-200"
                    }`}>
                      {isAnswerCorrect ? (
                        <CheckCircle2 className="size-4 text-emerald-700" />
                      ) : (
                        <X className="size-4 text-rose-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 mb-2">{q.question}</p>
                      <div className="space-y-1.5">
                        {q.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`text-sm px-3 py-1.5 rounded-lg ${
                              optIndex === q.correctOption
                                ? "bg-emerald-100 text-emerald-700 font-medium"
                                : optIndex === userAnswer && !isAnswerCorrect
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-50 text-slate-600"
                            }`}
                          >
                            {option}
                            {optIndex === q.correctOption && " ✓"}
                            {optIndex === userAnswer && !isAnswerCorrect && " (Bạn chọn)"}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 text-sm text-slate-600 bg-white/70 p-2 rounded-lg">
                          <span className="font-medium">Giải thích:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Question view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
            <FileQuestion className="size-3 mr-1" />
            Bài tập Quiz
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">{title}</h1>

        {/* Warning Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Lưu ý quan trọng</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Bài làm quiz <strong>không được lưu tạm</strong>. Nếu tải lại trang, đóng trình duyệt hoặc mất kết nối mạng, bạn sẽ phải làm lại từ đầu. Hãy đảm bảo kết nối internet ổn định trước khi bắt đầu!
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-slate-600 shrink-0">
            {currentQuestion + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
            Câu hỏi {currentQuestion + 1}
          </span>
          {showExplanation && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isCorrect
                ? "bg-emerald-100 text-emerald-600"
                : "bg-rose-100 text-rose-600"
            }`}>
              {isCorrect ? "Đúng!" : "Sai"}
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-slate-900 mb-6">{question.question}</h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === question.correctOption;

            let optionClass = "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
            if (showExplanation) {
              if (isCorrectOption) {
                optionClass = "border-emerald-500 bg-emerald-50";
              } else if (isSelected && !isCorrectOption) {
                optionClass = "border-rose-500 bg-rose-50";
              } else {
                optionClass = "border-slate-200 bg-slate-50 opacity-60";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={hasAnswered}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected && !showExplanation
                    ? "border-indigo-500 bg-indigo-50"
                    : optionClass
                } ${hasAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className={`flex size-8 items-center justify-center rounded-full shrink-0 font-medium ${
                  isSelected && !showExplanation
                    ? "bg-indigo-500 text-white"
                    : showExplanation
                    ? isCorrectOption
                      ? "bg-emerald-500 text-white"
                      : isSelected
                      ? "bg-rose-500 text-white"
                      : "bg-slate-100 text-slate-500"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1 text-slate-700">{option}</span>
                {showExplanation && isCorrectOption && (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                )}
                {showExplanation && isSelected && !isCorrectOption && (
                  <X className="size-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`mt-4 p-4 rounded-xl ${
            isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`size-5 shrink-0 ${
                isCorrect ? "text-emerald-600" : "text-rose-600"
              }`} />
              <div>
                <p className={`font-medium ${
                  isCorrect ? "text-emerald-700" : "text-rose-700"
                }`}>
                  {isCorrect ? "Xuất sắc!" : "Chưa chính xác"}
                </p>
                {question.explanation && (
                  <p className="text-sm text-slate-600 mt-1">{question.explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        {!showExplanation ? (
          <Button
            onClick={handleConfirmAnswer}
            disabled={selectedAnswer === null}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            Xác nhận
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            {currentQuestion < questions.length - 1 ? (
              <>
                Câu tiếp theo
                <ArrowRight className="size-4" />
              </>
            ) : (
              <>
                Xem kết quả
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
