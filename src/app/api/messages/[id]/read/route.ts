import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const user = await UserModel.findOneAndUpdate(
      { _id: (session.user as User)._id, "messages._id": params.id },
      { $set: { "messages.$.isRead": true } },
      { new: true }
    );

    if (!user) {
      return Response.json({ success: false, message: "Message not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Marked as read." });
  } catch {
    return Response.json({ success: false, message: "Failed to mark as read." }, { status: 500 });
  }
}
