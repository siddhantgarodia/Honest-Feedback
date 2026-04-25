import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";
import { NextRequest } from "next/server";

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

// This explicitly sets the route to be dynamically rendered at request time
// and not statically optimized at build time
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    const result = UsernameQuerySchema.safeParse({ username });

    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            usernameErrors.length > 0
              ? usernameErrors.join(", ")
              : "Invalid username format.",
        },
        { status: 400 }
      );
    }
    const { username: validatedUsername } = result.data;

    const existingVerifiedUser = await UserModel.findOne({
      username: validatedUsername.toLowerCase(),
      isVerified: true,
    });

    if (existingVerifiedUser) {

      return Response.json(
        {
          success: false,
          message: "Username is already taken.",
          isAcceptingMessage: existingVerifiedUser.isAcceptingMessage,
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Username is available.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking username:", error);
    return Response.json(
      {
        success: false,
        message: "An error occurred while checking the username.",
      },
      { status: 500 }
    );
  }
}
