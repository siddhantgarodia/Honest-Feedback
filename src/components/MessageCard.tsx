"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import dayjs from "dayjs";
import { X, Pin, PinOff, Circle, CheckCircle2 } from "lucide-react";
import { Message } from "@/model/User";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ApiResponse } from "@/types/ApiResponse";

type MessageCardProps = {
  message: Message;
  onMessageDelete: (feedbackId: string) => void;
  onPinToggle: (feedbackId: string, isPinned: boolean) => void;
  onMarkRead: (feedbackId: string) => void;
};

export function MessageCard({
  message,
  onMessageDelete,
  onPinToggle,
  onMarkRead,
}: MessageCardProps) {
  const [isPinned, setIsPinned] = useState(message.isPinned ?? false);
  const [isRead, setIsRead] = useState(message.isRead ?? false);
  const [isPinLoading, setIsPinLoading] = useState(false);

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete<ApiResponse>(
        `/api/delete-message/${message._id}`
      );
      toast.success(response.data.message || "Feedback deleted successfully");
      onMessageDelete(message._id as string);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to delete feedback");
    }
  };

  const handlePinToggle = async () => {
    setIsPinLoading(true);
    try {
      const res = await axios.patch<ApiResponse>(`/api/messages/${message._id}/pin`);
      const newPinned = res.data.isPinned ?? !isPinned;
      setIsPinned(newPinned);
      onPinToggle(message._id as string, newPinned);
    } catch {
      toast.error("Failed to toggle pin.");
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleMarkRead = async () => {
    if (isRead) return;
    try {
      await axios.patch(`/api/messages/${message._id}/read`);
      setIsRead(true);
      onMarkRead(message._id as string);
    } catch {
      // Non-critical — silently fail
    }
  };

  const hasAnswers = message.answers && message.answers.length > 0;

  return (
    <Card
      onClick={handleMarkRead}
      className={`feedback-card group transition-shadow hover:shadow-md rounded-2xl cursor-pointer
        ${isPinned ? "border-primary/40 dark:border-primary/30 bg-primary/5" : "border border-border/50 bg-background/90"}
        ${!isRead ? "ring-1 ring-primary/30" : ""}
      `}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {/* Unread indicator */}
              {!isRead ? (
                <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
              ) : (
                <CheckCircle2 className="h-2 w-2 text-muted-foreground/40 shrink-0" />
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {dayjs(message.createdAt).format("MMM D, YYYY h:mm A")}
              </span>
              {isPinned && (
                <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full">
                  Pinned
                </span>
              )}
            </div>

            {/* Message content */}
            {hasAnswers ? (
              <div className="space-y-2 mt-1">
                {message.answers.map((ans, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {ans.questionText}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{ans.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm sm:text-base break-words leading-relaxed text-foreground mt-1">
                {message.content}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Pin button */}
            <Button
              variant="ghost"
              size="icon"
              disabled={isPinLoading}
              onClick={(e) => { e.stopPropagation(); handlePinToggle(); }}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-full hover:bg-primary/10"
              title={isPinned ? "Unpin" : "Pin"}
            >
              {isPinned ? (
                <PinOff className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Pin className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>

            {/* Delete button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-full hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-destructive/20 shadow-xl rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive font-semibold">
                    Delete this message?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border border-border rounded-full px-4">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-4"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-0.5 w-1/3 bg-gradient-to-r from-primary/40 to-transparent rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
}
