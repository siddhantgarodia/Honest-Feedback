import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const QuestionSchema = z.object({
  text: z.string().min(1).max(300),
  isRequired: z.boolean().default(false),
  order: z.number().int().default(0),
});

const QuestionsBodySchema = z.object({
  questions: z.array(QuestionSchema).max(10),
});

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const user = await UserModel.findById((session.user as User)._id).select("questions");
    if (!user) return Response.json({ success: false, message: "User not found." }, { status: 404 });

    return Response.json({ success: true, questions: user.questions });
  } catch {
    return Response.json({ success: false, message: "Failed to fetch questions." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = QuestionsBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const user = await UserModel.findByIdAndUpdate(
      (session.user as User)._id,
      { questions: parsed.data.questions.map((q, i) => ({ ...q, order: i })) },
      { new: true }
    ).select("questions");

    if (!user) return Response.json({ success: false, message: "User not found." }, { status: 404 });

    return Response.json({ success: true, questions: user.questions });
  } catch {
    return Response.json({ success: false, message: "Failed to update questions." }, { status: 500 });
  }
}
