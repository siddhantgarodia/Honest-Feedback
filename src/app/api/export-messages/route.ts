import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "json";

  const userId = new mongoose.Types.ObjectId((session.user as User)._id);

  try {
    const result = await UserModel.aggregate([
      { $match: { _id: userId } },
      { $unwind: "$messages" },
      { $sort: { "messages.createdAt": -1 } },
      { $group: { _id: "$_id", messages: { $push: "$messages" } } },
    ]);

    const messages = result?.[0]?.messages ?? [];

    if (format === "csv") {
      const rows = messages.map((m: { content?: string; answers?: { questionText: string; answer: string }[]; createdAt: Date; isRead: boolean; isPinned: boolean }) => {
        const content =
          m.answers?.length
            ? m.answers.map((a: { questionText: string; answer: string }) => `${a.questionText}: ${a.answer}`).join(" | ")
            : m.content ?? "";
        return `"${new Date(m.createdAt).toISOString()}","${content.replace(/"/g, '""')}","${m.isRead}","${m.isPinned}"`;
      });
      const csv = ["date,content,read,pinned", ...rows].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="honest-feedback-messages.csv"`,
        },
      });
    }

    return new Response(JSON.stringify({ messages }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="honest-feedback-messages.json"`,
      },
    });
  } catch {
    return Response.json({ success: false, message: "Failed to export messages." }, { status: 500 });
  }
}
