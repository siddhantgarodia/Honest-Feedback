import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";
import { NextRequest } from "next/server";

// This explicitly sets the route to be dynamically rendered at request time
// and not statically optimized at build time
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

/**
 * API endpoint to check if a username exists and accepts messages
 */
export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    // Validate username format
    const result = UsernameQuerySchema.safeParse({ username });
    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json(
        {
          success: false,
          exists: false,
          acceptsMessages: false,
          message:
            usernameErrors.length > 0
              ? usernameErrors.join(", ")
              : "Invalid username format.",
        },
        { status: 400 }
      );
    }

    const { username: validatedUsername } = result.data;

    const existingUser = await UserModel.findOne({
      username: validatedUsername.toLowerCase(),
      isVerified: true,
    });

    if (!existingUser) {
      return Response.json(
        {
          success: true,
          exists: false,
          acceptsMessages: false,
          message: "Username does not exist or is not verified.",
        },
        { status: 200 }
      );
    }

    return Response.json(
      {
        success: true,
        exists: true,
        acceptsMessages: existingUser.isAcceptingMessage,
        questions: existingUser.questions ?? [],
        message: existingUser.isAcceptingMessage
          ? "User exists and is accepting messages."
          : "User exists but is not accepting messages.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking message eligibility:", error);
    return Response.json(
      {
        success: false,
        exists: false,
        acceptsMessages: false,
        message:
          "An error occurred while checking if this user can receive messages.",
      },
      { status: 500 }
    );
  }
}
