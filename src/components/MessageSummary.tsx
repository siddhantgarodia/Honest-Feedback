"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface SummaryItem {
  question: string;
  summary: string;
}

interface MessageSummaryProps {
  isVisible: boolean;
}

export function MessageSummary({ isVisible }: MessageSummaryProps) {
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/summarize-messages", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to summarize.");

      if (Array.isArray(data.summaries) && data.summaries.length > 0) {
        setSummaries(data.summaries);
        setIsExpanded(true);
      } else {
        setError("No summaries returned.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="my-6">
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={handleSummarize}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating summaries...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Summarize My Feedback
            </>
          )}
        </Button>

        {summaries.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((p) => !p)}
            className="gap-1 text-muted-foreground"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {isExpanded && summaries.length > 0 && (
        <div className="space-y-4">
          {summaries.map(({ question, summary }, i) => (
            <Card key={i} className="border border-border shadow-sm">
              <CardHeader className="pb-2 bg-muted/40 border-b border-border rounded-t-xl">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {question}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {summary}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
