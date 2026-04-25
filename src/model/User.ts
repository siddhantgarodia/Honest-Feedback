import mongoose, { Schema, Document } from "mongoose";

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  answer: string;
}

export interface FeedbackQuestion {
  _id?: string;
  text: string;
  isRequired: boolean;
  order: number;
}

export interface Message extends Document {
  content: string;
  createdAt: Date;
  isRead: boolean;
  isPinned: boolean;
  answers: QuestionAnswer[];
}

const QuestionAnswerSchema = new Schema<QuestionAnswer>(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const FeedbackQuestionSchema = new Schema<FeedbackQuestion>({
  text: { type: String, required: true, trim: true },
  isRequired: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const MessageSchema: Schema<Message> = new Schema({
  content: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  answers: [QuestionAnswerSchema],
});

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  verifyCode: string;
  verifyCodeExpiry: Date;
  isVerified: boolean;
  isAcceptingMessage: boolean;
  messages: Message[];
  questions: FeedbackQuestion[];
  notifyOnMessage: boolean;
}

const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  verifyCode: {
    type: String,
    required: [true, "Verification code is required"],
  },
  verifyCodeExpiry: {
    type: Date,
    required: [true, "Verification code expiry is required"],
  },
  isAcceptingMessage: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  messages: [MessageSchema],
  questions: {
    type: [FeedbackQuestionSchema],
    default: [],
  },
  notifyOnMessage: {
    type: Boolean,
    default: true,
  },
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;
