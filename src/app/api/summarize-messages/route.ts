import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import mongoose from "mongoose";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

interface RawMessage {
  content?: string;
  answers?: { questionId: string; questionText: string; answer: string }[];
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
    temperature: 0.7,
  });
  const text = completion.choices[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

export async function POST() {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ success: false, message: "Groq API key is not configured." }, { status: 500 });
  }

  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.user._id);

    const userDoc = await UserModel.findById(userId).select("messages questions");
    if (!userDoc || userDoc.messages.length === 0) {
      return NextResponse.json({ success: false, message: "No messages found." }, { status: 404 });
    }

    const messages = userDoc.messages as unknown as RawMessage[];

    const structured = messages.filter((m) => m.answers && m.answers.length > 0);
    const freeText = messages.filter((m) => !m.answers || m.answers.length === 0);

    const summaries: { question: string; summary: string }[] = [];

    // Summarize free-text messages
    if (freeText.length > 0) {
      const rawText = freeText
        .map((m) => m.content ?? "")
        .filter(Boolean)
        .join("\n")
        .slice(0, 10000);

      if (rawText.length >= 10) {
        const prompt = `Summarize the following anonymous feedback. Identify main themes, overall tone, areas for improvement, and actionable insights. Format as 3-5 bullet points. Be concise.\n\nFeedback:\n${rawText}`;
        const text = await callGroq(prompt);
        summaries.push({ question: "General Feedback", summary: text });
      }
    }

    // Summarize structured Q&A messages per question
    if (structured.length > 0) {
      const questionMap = new Map<string, { text: string; answers: string[] }>();

      for (const msg of structured) {
        for (const ans of msg.answers ?? []) {
          if (!questionMap.has(ans.questionId)) {
            questionMap.set(ans.questionId, { text: ans.questionText, answers: [] });
          }
          if (ans.answer.trim()) {
            questionMap.get(ans.questionId)!.answers.push(ans.answer);
          }
        }
      }

      for (const [, { text, answers }] of Array.from(questionMap)) {
        if (answers.length === 0) continue;
        const answersText = answers.join("\n").slice(0, 8000);
        const prompt = `You are summarizing responses to the feedback question: "${text}"\n\nResponses from ${answers.length} people:\n${answersText}\n\nWrite a concise summary (3-5 bullet points) capturing key themes, patterns, and insights.`;
        const summary = await callGroq(prompt);
        summaries.push({ question: text, summary });
      }
    }

    if (summaries.length === 0) {
      return NextResponse.json({ success: false, message: "Not enough content to summarize." }, { status: 400 });
    }

    return NextResponse.json({ success: true, summaries });
  } catch (error) {
    console.error("Error summarizing messages:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate summary." },
      { status: 500 }
    );
  }
}
