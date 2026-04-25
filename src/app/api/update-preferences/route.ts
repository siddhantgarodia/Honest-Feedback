import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PreferencesSchema = z.object({
  notifyOnMessage: z.boolean().optional(),
});

export async function PUT(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = PreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, message: "Invalid preferences." }, { status: 400 });
  }

  try {
    const update: Record<string, unknown> = {};
    if (parsed.data.notifyOnMessage !== undefined) {
      update.notifyOnMessage = parsed.data.notifyOnMessage;
    }

    const user = await UserModel.findByIdAndUpdate(
      (session.user as User)._id,
      update,
      { new: true }
    ).select("notifyOnMessage");

    if (!user) return Response.json({ success: false, message: "User not found." }, { status: 404 });

    return Response.json({ success: true, notifyOnMessage: user.notifyOnMessage });
  } catch {
    return Response.json({ success: false, message: "Failed to update preferences." }, { status: 500 });
  }
}
