"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Plus } from "lucide-react";

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

interface ModuleCardProps {
  module: WorkspaceModule;
  moduleIndex: number;
  onCreateLesson: (moduleId: string) => void;
  onAddVocabulary: (moduleId: string) => void;
  onEditVocabulary: (moduleId: string, item: WorkspaceVocabulary | null) => void;
  onDeleteVocabulary: (vocabularyId: string) => void;
  onEditLesson: (lesson: WorkspaceLesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  renderLesson?: (lesson: WorkspaceLesson, moduleIndex: number, lessonIndex: number) => React.ReactNode;
  renderVocabulary?: (item: WorkspaceVocabulary) => React.ReactNode;
}

export function ModuleCard({
  module,
  moduleIndex,
  onCreateLesson,
  onAddVocabulary,
  onEditVocabulary,
  onDeleteVocabulary,
  onEditLesson,
  onDeleteLesson,
  renderLesson,
  renderVocabulary,
}: ModuleCardProps) {
  const lessons = module.lessons || [];
  const vocabularies = module.vocabularies || [];

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">Module {moduleIndex + 1}</span>
              <Badge variant={module.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">
                {module.status === "PUBLISHED" ? "Published" : "Draft"}
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold">{module.title}</CardTitle>
            {module.description && (
              <CardDescription className="mt-1 line-clamp-2">{module.description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onCreateLesson(module.id)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Lesson
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAddVocabulary(module.id)}>
              <BookOpenText className="h-4 w-4 mr-1" />
              Add Vocab
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {vocabularies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Vocabulary ({vocabularies.length})</h4>
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              {vocabularies.map((item) =>
                renderVocabulary ? (
                  renderVocabulary(item)
                ) : (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="font-medium">{item.word}</span>
                    <span className="text-sm text-muted-foreground">{item.meaning}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {lessons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Lessons ({lessons.length})</h4>
            <div className="space-y-2">
              {lessons.map((lesson, lessonIndex) =>
                renderLesson ? (
                  renderLesson(lesson, moduleIndex, lessonIndex)
                ) : (
                  <div key={lesson.id} className="p-3 bg-muted/50 rounded">
                    <span className="font-medium">{lesson.title}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {lessons.length === 0 && vocabularies.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No lessons or vocabulary yet. Add some content to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
