"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookText,
  FilePenLine,
  FileQuestion,
  FileText,
  Layers3,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

export type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING";

export type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

export type WorkspaceLesson = {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  isRequired: boolean;
  hasVocabulary?: boolean;
  read?: { title?: string | null; content?: string | null; keywords?: string | null; learningObjectives?: string | null } | null;
  write?: { prompt?: string | null; gradingCriteria?: string | null; wordCountGuidance?: number | null; aiPromptId?: string | null; maxAiRevisions?: number | null } | null;
  video?: { title?: string | null; description?: string | null; cloudinaryPublicId?: string | null; cloudinaryUrl?: string | null; durationSeconds?: number | null } | null;
  quiz?: {
    questions?: Array<{
      question: string;
      options?: string;
      correctOption?: number;
      explanation?: string;
    }>;
  } | null;
};

export type WorkspaceVocabulary = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic?: string | null;
  example?: string | null;
  notes?: string | null;
  orderIndex: number;
  status: StatusValue;
};

export type WorkspaceModule = {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  lessons?: WorkspaceLesson[];
  vocabularies?: WorkspaceVocabulary[];
};

interface LessonCardProps {
  lesson: WorkspaceLesson;
  moduleIndex: number;
  lessonIndex: number;
  onEdit: (lesson: WorkspaceLesson) => void;
  onDelete: (lessonId: string) => void;
}

export function LessonCard({ lesson, moduleIndex, lessonIndex, onEdit, onDelete }: LessonCardProps) {
  const getLessonTypes = (): LessonType[] => {
    const types: LessonType[] = [];
    if (lesson.read) types.push("TEXT");
    if (lesson.video) types.push("VIDEO");
    if (lesson.quiz?.questions?.length) types.push("QUIZ");
    if (lesson.write) types.push("WRITING");
    return types;
  };

  const lessonTypes = getLessonTypes();
  const typeIcons: Record<LessonType, React.ReactNode> = {
    TEXT: <FileText className="h-3 w-3" />,
    VIDEO: <Video className="h-3 w-3" />,
    QUIZ: <FileQuestion className="h-3 w-3" />,
    WRITING: <FilePenLine className="h-3 w-3" />,
  };

  const typeColors: Record<LessonType, string> = {
    TEXT: "bg-blue-100 text-blue-800",
    VIDEO: "bg-purple-100 text-purple-800",
    QUIZ: "bg-amber-100 text-amber-800",
    WRITING: "bg-green-100 text-green-800",
  };

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">
                {moduleIndex + 1}.{lessonIndex + 1}
              </span>
              <Badge
                variant={lesson.status === "PUBLISHED" ? "default" : "secondary"}
                className="text-xs"
              >
                {lesson.status === "PUBLISHED" ? "Published" : "Draft"}
              </Badge>
              {lesson.isRequired && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  Required
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-semibold truncate">{lesson.title}</CardTitle>
            {lesson.description && (
              <CardDescription className="mt-1 line-clamp-2">{lesson.description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(lesson)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(lesson.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {lessonTypes.map((type) => (
            <span
              key={type}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[type]}`}
            >
              {typeIcons[type]}
              {type}
            </span>
          ))}
          {lesson.hasVocabulary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <Layers3 className="h-3 w-3" />
              Vocab
            </span>
          )}
          {lesson.read?.content && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <BookText className="h-3 w-3" />
              {lesson.read.content.length} chars
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
