"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { FeedbackQuestion } from "@/model/User";

interface QuestionsManagerProps {
  initialQuestions: FeedbackQuestion[];
  onSave: (questions: FeedbackQuestion[]) => void;
}

export function QuestionsManager({ initialQuestions, onSave }: QuestionsManagerProps) {
  const [questions, setQuestions] = useState<FeedbackQuestion[]>(initialQuestions);

  // Sync when parent async-loads questions after first render
  React.useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);
  const [isSaving, setIsSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast.error("Maximum 10 questions allowed.");
      return;
    }
    setQuestions([...questions, { text: "", isRequired: false, order: questions.length }]);
  };

  const updateQuestion = (idx: number, field: keyof FeedbackQuestion, value: string | boolean) => {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setQuestions(reordered);
    setDragIdx(idx);
  };

  const handleSave = async () => {
    const invalid = questions.find((q) => !q.text.trim());
    if (invalid) {
      toast.error("All questions must have text.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await axios.put("/api/questions", {
        questions: questions.map((q, i) => ({
          text: q.text.trim(),
          isRequired: q.isRequired,
          order: i,
        })),
      });
      onSave(res.data.questions);
      toast.success("Questions saved!");
    } catch {
      toast.error("Failed to save questions.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
          <span>Custom Feedback Questions</span>
          <span className="text-xs font-normal text-muted-foreground">{questions.length}/10</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          People visiting your profile will answer these instead of writing free-form feedback.
          Drag to reorder. Toggle the switch to make a question mandatory.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No questions yet. Add one below to get structured feedback.
          </p>
        )}

        {questions.map((q, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={() => setDragIdx(null)}
            className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg p-2 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={q.text}
              onChange={(e) => updateQuestion(idx, "text", e.target.value)}
              placeholder={`Question ${idx + 1}`}
              className="flex-1 h-8 text-sm bg-background"
              maxLength={300}
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">Required</span>
              <Switch
                checked={q.isRequired}
                onCheckedChange={(v) => updateQuestion(idx, "isRequired", v)}
                className="scale-90"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => removeQuestion(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Question
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
