import { Schema, model, Types } from "mongoose";

export type CsDifficulty = "beginner" | "intermediate" | "advanced" | "senior";
export type CsMode = "challenge" | "deep_dive" | "exam";
export type CsSessionStatus = "in_progress" | "completed" | "cancelled";

export interface ICsTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface ICsQuestionItem {
  _id?: Types.ObjectId;
  questionId?: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: CsDifficulty;
  questionText: string;
  codeSnippet?: string;
  language?: string;
  testCases?: ICsTestCase[];
  expectedComplexity?: {
    time: string;
    space: string;
  };
  keyConcepts: string[];
  hints: string[];
  userAnswer?: string;
  userTimeComplexity?: string;
  userSpaceComplexity?: string;
  evaluationStatus: "pending" | "completed" | "failed";
  evaluation?: {
    score: number;
    technicalAccuracy: number;
    conceptualDepth: number;
    edgeCasesHandling: number;
    timeComplexityVerdict?: string;
    spaceComplexityVerdict?: string;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
    optimalSolution?: string;
    followUpQuestion?: string;
  };
}

export type CsPersona = "google" | "meta" | "amazon" | "holberton";

export interface ICsSession {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  topic: string;
  subTopic?: string;
  difficulty: CsDifficulty;
  mode: CsMode;
  interviewerPersona?: CsPersona;
  isPressureMode?: boolean;
  isBlindMode?: boolean;
  status: CsSessionStatus;
  questions: ICsQuestionItem[];
  currentQuestionIndex: number;
  overallScore?: number;
  timeSpentSeconds?: number;
  summaryReport?: {
    strengths: string[];
    improvements: string[];
    recommendedTopics: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const csQuestionItemSchema = new Schema<ICsQuestionItem>(
  {
    questionId: { type: String },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true, lowercase: true },
    subTopic: { type: String, default: "General", trim: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "senior"],
      required: true,
    },
    questionText: { type: String, required: true, trim: true },
    codeSnippet: { type: String, default: "" },
    language: { type: String, default: "javascript" },
    testCases: {
      type: [
        {
          id: { type: String },
          input: { type: String, default: "" },
          expectedOutput: { type: String, default: "" },
          explanation: { type: String, default: "" },
        },
      ],
      default: [],
    },
    expectedComplexity: {
      time: { type: String, default: "O(n)" },
      space: { type: String, default: "O(1)" },
    },
    keyConcepts: { type: [String], default: [] },
    hints: { type: [String], default: [] },
    userAnswer: { type: String, default: "" },
    userTimeComplexity: { type: String, default: "" },
    userSpaceComplexity: { type: String, default: "" },
    evaluationStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    evaluation: {
      score: { type: Number, min: 0, max: 100 },
      technicalAccuracy: { type: Number, min: 0, max: 100 },
      conceptualDepth: { type: Number, min: 0, max: 100 },
      edgeCasesHandling: { type: Number, min: 0, max: 100 },
      timeComplexityVerdict: { type: String, default: "" },
      spaceComplexityVerdict: { type: String, default: "" },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      feedback: { type: String, default: "" },
      optimalSolution: { type: String, default: "" },
      followUpQuestion: { type: String, default: "" },
    },
  },
  { _id: true }
);

const csSessionSchema = new Schema<ICsSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      lowercase: true,
      trim: true,
    },
    subTopic: {
      type: String,
      default: "General",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "senior"],
      default: "intermediate",
    },
    mode: {
      type: String,
      enum: ["challenge", "deep_dive", "exam"],
      default: "challenge",
    },
    interviewerPersona: {
      type: String,
      enum: ["google", "meta", "amazon", "holberton"],
      default: "google",
    },
    isPressureMode: {
      type: Boolean,
      default: false,
    },
    isBlindMode: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "cancelled"],
      default: "in_progress",
    },
    questions: {
      type: [csQuestionItemSchema],
      default: [],
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    summaryReport: {
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      recommendedTopics: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

csSessionSchema.index({ user: 1, createdAt: -1 });
csSessionSchema.index({ user: 1, topic: 1 });

export const CsSession = model<ICsSession>("CsSession", csSessionSchema);
