import { randomInt } from "node:crypto";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const username = body.username?.toLowerCase();
    const { email, password } = body;

    const existingUserVerifiedByUserName = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingUserVerifiedByUserName) {
      return Response.json(
        { success: false, message: "Username already exists." },
        { status: 400 }
      );
    }

    const existingUserByEmail = await UserModel.findOne({ email });
    const verifyCode = randomInt(100000, 999999).toString();
    const verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          { success: false, message: "Email already exists and is verified." },
          { status: 400 }
        );
      }

      // Update unverified user with new password and verification code
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUserByEmail.username = username;
      existingUserByEmail.password = hashedPassword;
      existingUserByEmail.verifyCode = verifyCode;
      existingUserByEmail.verifyCodeExpiry = verifyCodeExpiry;
      await existingUserByEmail.save();
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry,
        isVerified: false,
        messages: [],
      });
      await newUser.save();
    }

    // Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    if (!emailResponse.success) {
      return Response.json(
        { success: false, message: emailResponse.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in sign-up route:", error);
    return Response.json(
      { success: false, message: "An error occurred during sign-up." },
      { status: 500 }
    );
  }
}
