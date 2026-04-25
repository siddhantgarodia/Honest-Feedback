import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const DEMO_USERNAME = "demo";
const DEMO_EMAIL = "demo@honestfeedback.app";
const DEMO_PASSWORD = "Demo@1234";

const SEED_MESSAGES = [
  {
    content: "Your communication style is very clear and easy to follow!",
    createdAt: new Date("2024-12-01"),
    isRead: true,
    isPinned: true,
    answers: [],
  },
  {
    content:
      "I appreciate how you always explain the reasoning behind decisions. It really helps the team stay aligned.",
    createdAt: new Date("2024-12-05"),
    isRead: true,
    isPinned: false,
    answers: [],
  },
  {
    content:
      "Sometimes your responses come a bit late. More proactive updates would help the rest of the team.",
    createdAt: new Date("2024-12-10"),
    isRead: false,
    isPinned: false,
    answers: [],
  },
  {
    content:
      "Great at problem-solving under pressure. You keep calm and focused when it matters most.",
    createdAt: new Date("2024-12-15"),
    isRead: false,
    isPinned: false,
    answers: [],
  },
  {
    content:
      "Would love to see more documentation for the features you build. The code is great but hard to onboard to.",
    createdAt: new Date("2024-12-20"),
    isRead: false,
    isPinned: false,
    answers: [],
  },
];

export async function POST() {
  try {
    await dbConnect();

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    const existing = await UserModel.findOne({ username: DEMO_USERNAME });

    if (!existing) {
      await UserModel.create({
        username: DEMO_USERNAME,
        email: DEMO_EMAIL,
        password: hashedPassword,
        isVerified: true,
        isAcceptingMessage: true,
        notifyOnMessage: false,
        messages: SEED_MESSAGES,
        questions: [],
        verifyCode: "000000",
        verifyCodeExpiry: new Date(Date.now() + 365 * 24 * 3600000),
      });
    } else {
      // Keep messages but reset credentials so demo is always accessible
      existing.password = hashedPassword;
      existing.isVerified = true;
      existing.isAcceptingMessage = true;
      existing.notifyOnMessage = false;
      await existing.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demo login seed error:", error);
    return NextResponse.json(
      { success: false, message: "Could not initialize demo account." },
      { status: 500 }
    );
  }
}
