import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST() {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ success: false, message: "Groq API key is not configured." }, { status: 500 });
  }

  const prompt = `Generate 5 open-ended, friendly, and constructive feedback prompts for a feedback platform.
Each prompt should be 30-100 characters long.
Respond ONLY with a JSON array of strings — no explanation, no markdown, no code fences.
Example format: ["prompt one", "prompt two", "prompt three", "prompt four", "prompt five"]`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
      temperature: 0.9,
      response_format: { type: "json_object" },
    });

    let text = completion.choices[0]?.message?.content?.trim() ?? "";

    // Parse: Groq with json_object returns {"questions": [...]} or just the array
    let questions: string[] = [];
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else {
      // Find the first array value in the object
      const arr = Object.values(parsed).find(Array.isArray) as string[] | undefined;
      questions = arr ?? [];
    }

    if (questions.length === 0) throw new Error("No questions returned");

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("Groq Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate suggestions." },
      { status: 500 }
    );
  }
}
