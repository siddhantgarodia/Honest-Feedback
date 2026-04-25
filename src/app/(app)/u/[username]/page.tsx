"use client";

import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CardHeader, CardContent, Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as z from "zod";
import { ApiResponse } from "@/types/ApiResponse";
import { FeedbackQuestion } from "@/model/User";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { messageSchema } from "@/schemas/messageSchema";

export default function SendMessage() {
  const router = useRouter();
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";

  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isAcceptingMessages, setIsAcceptingMessages] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!username) {
      setUserExists(false);
      setIsAcceptingMessages(false);
      setIsCheckingUser(false);
      return;
    }

    const controller = new AbortController();

    const checkUserExists = async () => {
      try {
        setIsCheckingUser(true);
        const response = await axios.get<ApiResponse>(
          `/api/check-message-eligibility?username=${username}`,
          { signal: controller.signal }
        );

        if (response.data.success) {
          setUserExists(response.data.exists === true);
          setIsAcceptingMessages(response.data.acceptsMessages === true);
          setQuestions((response.data.questions ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        } else {
          toast.error("Error checking username: " + response.data.message);
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          setUserExists(false);
          setIsAcceptingMessages(false);
        } else {
          toast.error("Could not verify user. Try again later.");
        }
      } finally {
        setIsCheckingUser(false);
      }
    };

    checkUserExists();
    return () => controller.abort();
  }, [username]);

  // Free-text form (used when no custom questions)
  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });
  const messageContent = form.watch("content");

  const handleMessageClick = (message: string) => {
    form.setValue("content", message);
  };

  // Submit free-text feedback
  const onSubmitFreeText = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post<ApiResponse>("/api/send-message", {
        username,
        content: data.content,
      });
      toast.success(response.data.message || "Feedback sent!");
      form.reset({ content: "" });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage = axiosError.response?.data.message ?? "Failed to send message";
      toast.error(errorMessage);
      if (axiosError.response?.status === 404) setUserExists(false);
      if (axiosError.response?.status === 403) setIsAcceptingMessages(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit structured Q&A feedback
  const onSubmitStructured = async () => {
    // Validate required questions
    const missing = questions
      .filter((q) => q.isRequired && !answers[q._id ?? ""]?.trim())
      .map((q) => q.text);

    if (missing.length > 0) {
      toast.error(`Please answer required questions: ${missing.slice(0, 2).join(", ")}${missing.length > 2 ? "..." : ""}`);
      return;
    }

    setIsLoading(true);
    try {
      const structuredAnswers = questions
        .filter((q) => answers[q._id ?? ""]?.trim())
        .map((q) => ({
          questionId: q._id ?? "",
          questionText: q.text,
          answer: answers[q._id ?? ""],
        }));

      await axios.post<ApiResponse>("/api/send-message", {
        username,
        answers: structuredAnswers,
      });
      toast.success("Feedback sent! Thank you.");
      setAnswers({});
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message ?? "Failed to send feedback.");
      if (axiosError.response?.status === 403) setIsAcceptingMessages(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedMessages = async () => {
    setIsSuggestLoading(true);
    setSuggestError(null);
    try {
      const res = await axios.post("/api/suggest-messages", {}, { timeout: 15000 });
      const qs = res.data.questions;
      setSuggestions(Array.isArray(qs) ? qs : []);
      if (!Array.isArray(qs)) setSuggestError("Unexpected format from server.");
    } catch {
      setSuggestError("Could not fetch suggestions.");
    } finally {
      setIsSuggestLoading(false);
    }
  };

  const hasCustomQuestions = questions.length > 0;

  return (
    <div className="container mx-auto my-8 p-6 bg-card rounded-lg shadow-sm max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">
        Send Honest Feedback
      </h1>

      {isCheckingUser ? (
        <div className="text-center p-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Checking user profile...</p>
        </div>
      ) : userExists === false ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-xl mb-4 text-foreground">
            User @{username} does not exist.
          </p>
          <Link href="/sign-up">
            <Button className="mt-2">Create Your Account</Button>
          </Link>
        </div>
      ) : !isAcceptingMessages ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-xl mb-4 text-muted-foreground">
            @{username} is not accepting feedback at this time.
          </p>
          <Link href="/">
            <Button className="mt-2">Back to Home</Button>
          </Link>
        </div>
      ) : hasCustomQuestions ? (
        /* ── Structured Q&A form ── */
        <div className="bg-gradient-to-r from-muted to-muted/50 p-6 rounded-lg mb-6 border border-border shadow-sm space-y-5">
          <p className="text-lg font-medium text-foreground">
            Send Feedback to{" "}
            <span className="text-primary font-semibold">@{username}</span>
          </p>
          {questions.map((q) => (
            <div key={q._id} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                {q.text}
                {q.isRequired && (
                  <span className="text-destructive text-xs">*</span>
                )}
              </label>
              <Textarea
                value={answers[q._id ?? ""] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q._id ?? ""]: e.target.value }))
                }
                placeholder={q.isRequired ? "Required" : "Optional"}
                className="resize-none min-h-[80px] bg-background text-foreground border-border"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {(answers[q._id ?? ""] ?? "").length}/500
              </p>
            </div>
          ))}
          <div className="flex justify-center pt-2">
            <Button
              onClick={onSubmitStructured}
              disabled={isLoading}
              className="px-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              ) : (
                "Send Feedback"
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* ── Free-text form ── */
        <>
          <div className="bg-gradient-to-r from-muted to-muted/50 p-6 rounded-lg mb-6 border border-border shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitFreeText)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-foreground">
                        Send Feedback to{" "}
                        <span className="text-primary font-semibold">@{username}</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your honest feedback here..."
                          className="resize-none min-h-[120px] bg-background text-foreground border-border focus:border-ring shadow-inner"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between mt-1">
                        <FormMessage />
                        <div className="text-xs text-muted-foreground">
                          {messageContent?.length || 0}/500 characters
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="flex justify-center pt-2">
                  {isLoading ? (
                    <Button disabled className="px-6">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!messageContent}
                      className="px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Send Feedback
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Suggestions (only for free-text mode) */}
          <div className="space-y-4 my-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-muted to-muted/40 p-4 rounded-lg border border-border">
              <Button
                onClick={fetchSuggestedMessages}
                className="mb-2 sm:mb-0 bg-background border-border text-foreground hover:bg-muted"
                variant="outline"
                disabled={isSuggestLoading}
              >
                {isSuggestLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating suggestions...</>
                ) : (
                  "Generate Message Ideas"
                )}
              </Button>
              <p className="text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border border-border shadow-sm">
                Click any suggestion to use it
              </p>
            </div>

            <Card className="border border-border shadow-md overflow-hidden">
              <CardHeader className="pb-2 bg-muted border-b border-border">
                <h3 className="text-xl font-semibold text-foreground">Message Suggestions</h3>
              </CardHeader>
              <CardContent className="pt-3 bg-background">
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                  {suggestError ? (
                    <p className="text-destructive col-span-2 p-3 bg-muted rounded border border-destructive">
                      {suggestError}
                    </p>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((message, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left h-auto py-3 px-4 justify-start border-border hover:bg-muted break-words whitespace-pre-wrap w-full"
                        onClick={() => handleMessageClick(message)}
                      >
                        {message}
                      </Button>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-2 py-4 text-center">
                      Click "Generate Message Ideas" to get AI-powered message suggestions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Separator className="my-6" />
      <div className="text-center bg-muted p-6 rounded-lg">
        <div className="mb-4 font-medium text-foreground">Want your own feedback page?</div>
        <Link href="/sign-up">
          <Button className="px-6">Create Your Account</Button>
        </Link>
      </div>
    </div>
  );
}
