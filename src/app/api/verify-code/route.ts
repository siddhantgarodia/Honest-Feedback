import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  
  if (request.method !== "POST") {
    return NextResponse.json(
      { success: false, message: "Method not allowed. Only POST requests are allowed." },
      { status: 405 }
    );
  }

  await dbConnect();

  const CodeVerificationSchema = z.object({
    username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
    code: z.string().length(6, { message: "Code must be exactly 6 characters long" }),
  });

  try {
    const body = await request.json();
    const parsed = CodeVerificationSchema.safeParse({
      username: decodeURIComponent(body.username ?? ""),
      code: body.code,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username: decodedUsername, code } = parsed.data;
    const user = await UserModel.findOne({ username: decodedUsername.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const isCodeValid = user.verifyCode === code;

    if (!isCodeValid) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code." },
        { status: 400 }
      );
    }

    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

    if (!isCodeNotExpired) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired." },
        { status: 400 }
      );
    }

    if (isCodeNotExpired && isCodeValid) {
      user.isVerified = true;
      await user.save();
      return NextResponse.json(
        { success: true, 
          message: "User verified successfully." 
        },
        { status: 200 }
      );
    }

  }
  catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { success: false, 
        message: "An error occurred while verifying the code." 
      },
      { status: 500 }
    );
  }
}