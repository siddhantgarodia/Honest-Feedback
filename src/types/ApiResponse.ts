import { Message, FeedbackQuestion } from "@/model/User";

export interface ApiResponse {
  success: boolean;
  message: string;
  isAcceptingMessage?: boolean;
  messages?: Array<Message>;
  exists?: boolean;
  acceptsMessages?: boolean;
  questions?: FeedbackQuestion[];
  notifyOnMessage?: boolean;
  isPinned?: boolean;
  summaries?: { question: string; summary: string }[];
  text?: string;
}
