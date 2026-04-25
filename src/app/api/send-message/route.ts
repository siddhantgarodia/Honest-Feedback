import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { Message } from "@/model/User";
import { messageSchema } from "@/schemas/messageSchema";
import { z } from "zod";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const QuestionAnswerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  answer: z.string().min(1, "Answer cannot be empty"),
});

async function sendNewMessageNotification(email: string, username: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Honest-Feedback" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "You received new feedback!",
      html: `<h2>Hi ${username},</h2><p>Someone just sent you anonymous feedback on Honest-Feedback.</p><p><a href="${process.env.NEXTAUTH_URL}/dashboard">View it on your dashboard →</a></p><br/><p>The Honest-Feedback Team</p>`,
    });
  } catch {
    // Notification failure is non-critical — don't break the main flow
  }
}

export async function POST(request: Request) {
  await dbConnect();

  const body = await request.json();
  const { username, answers } = body;

  const hasStructuredAnswers = Array.isArray(answers) && answers.length > 0;

  if (hasStructuredAnswers) {
    const parsed = z.array(QuestionAnswerSchema).safeParse(answers);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
  } else {
    const parsed = messageSchema.safeParse({ content: body.content });
    if (!parsed.success) {
      return Response.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
  }

  try {
    const userExists = await UserModel.findOne({
      username: username?.toLowerCase(),
    });

    if (!userExists) {
      return Response.json(
        { success: false, message: "User does not exist." },
        { status: 404 }
      );
    }

    if (!userExists.isVerified) {
      return Response.json(
        { success: false, message: "User exists but is not verified." },
        { status: 404 }
      );
    }

    if (!userExists.isAcceptingMessage) {
      return Response.json(
        { success: false, message: "User is not accepting feedback." },
        { status: 403 }
      );
    }

    // Validate required questions are answered
    if (userExists.questions.length > 0 && hasStructuredAnswers) {
      const requiredIds = userExists.questions
        .filter((q) => q.isRequired)
        .map((q) => q._id?.toString());
      const answeredIds = (answers as { questionId: string }[]).map((a) => a.questionId);
      const missing = requiredIds.filter((id) => id && !answeredIds.includes(id));
      if (missing.length > 0) {
        return Response.json(
          { success: false, message: "Please answer all required questions." },
          { status: 400 }
        );
      }
    }

    const newMessage: Partial<Message> = {
      content: hasStructuredAnswers ? "" : (body.content as string),
      createdAt: new Date(),
      isRead: false,
      isPinned: false,
      answers: hasStructuredAnswers ? answers : [],
    };

    userExists.messages.push(newMessage as Message);
    await userExists.save();

    // Fire-and-forget notification email
    if (userExists.notifyOnMessage) {
      sendNewMessageNotification(userExists.email, userExists.username);
    }

    return Response.json(
      { success: true, message: "Feedback sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending feedback:", error);
    return Response.json(
      { success: false, message: "Error sending feedback." },
      { status: 500 }
    );
  }
}
