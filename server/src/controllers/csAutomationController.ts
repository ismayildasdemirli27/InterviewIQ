import { type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import { CsSession, type CsDifficulty, type CsMode, type ICsSession } from "../models/CsSession";
import {
  CS_TOPICS,
  generateCsQuestions,
  evaluateCsAnswer,
  generateCsHint,
} from "../services/csAutomationService";
import { getAiProviderStatus } from "../services/aiProviderService";

/* =========================================
   HELPERS
========================================= */

const getUserId = (req: Request): mongoose.Types.ObjectId | null => {
  if (!req.user || !req.user._id) {
    return null;
  }
  return new mongoose.Types.ObjectId(String(req.user._id));
};

/* =========================================
   GET CS TOPICS
========================================= */

export const getCsTopicsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        topics: CS_TOPICS,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   START CS SESSION
========================================= */

export const startCsSessionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const {
      topic = "data-structures",
      subTopic = "General",
      difficulty = "intermediate",
      mode = "challenge",
      interviewerPersona = "google",
      isPressureMode = false,
      isBlindMode = false,
    } = req.body;

    const validDifficulties: CsDifficulty[] = ["beginner", "intermediate", "advanced", "senior"];
    const validModes: CsMode[] = ["challenge", "deep_dive", "exam"];
    const validPersonas = ["google", "meta", "amazon", "holberton"];

    const selectedDifficulty: CsDifficulty = validDifficulties.includes(difficulty) ? difficulty : "intermediate";
    const selectedMode: CsMode = validModes.includes(mode) ? mode : "challenge";
    const selectedPersona = validPersonas.includes(interviewerPersona) ? interviewerPersona : "google";

    // Determine number of questions
    const questionCount = selectedMode === "exam" ? 4 : selectedMode === "deep_dive" ? 2 : 1;

    // Generate questions using AI / Curated fallback
    const questions = await generateCsQuestions(
      topic,
      subTopic,
      selectedDifficulty,
      questionCount,
      selectedMode
    );

    const session = await CsSession.create({
      user: userId,
      topic,
      subTopic,
      difficulty: selectedDifficulty,
      mode: selectedMode,
      interviewerPersona: selectedPersona,
      isPressureMode: Boolean(isPressureMode),
      isBlindMode: Boolean(isBlindMode),
      status: "in_progress",
      questions,
      currentQuestionIndex: 0,
    });

    res.status(201).json({
      success: true,
      message: "CS Automation session started",
      data: {
        session: {
          _id: session._id,
          topic: session.topic,
          subTopic: session.subTopic,
          difficulty: session.difficulty,
          mode: session.mode,
          interviewerPersona: session.interviewerPersona,
          isPressureMode: session.isPressureMode,
          isBlindMode: session.isBlindMode,
          status: session.status,
          totalQuestions: session.questions.length,
          currentQuestionIndex: 0,
          questions: session.questions,
          currentQuestion: session.questions[0],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   SUBMIT CS ANSWER
========================================= */

export const submitCsAnswerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const {
      sessionId,
      questionIndex = 0,
      answer = "",
      userTimeComplexity = "",
      userSpaceComplexity = "",
      timeSpentSeconds = 0,
    } = req.body;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, message: "Valid sessionId is required" });
      return;
    }

    const session = await CsSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
      res.status(404).json({ success: false, message: "CS Session not found" });
      return;
    }

    const qIndex = Number(questionIndex);
    const targetQuestion = session.questions[qIndex];
    if (!targetQuestion) {
      res.status(400).json({ success: false, message: "Invalid question index" });
      return;
    }

    // Evaluate answer with AI
    const evaluation = await evaluateCsAnswer({
      title: targetQuestion.title,
      topic: targetQuestion.topic,
      subTopic: targetQuestion.subTopic,
      difficulty: targetQuestion.difficulty,
      questionText: targetQuestion.questionText,
      userAnswer: answer,
      userTimeComplexity,
      userSpaceComplexity,
      expectedComplexity: targetQuestion.expectedComplexity,
    });

    // Update target question
    targetQuestion.userAnswer = answer;
    targetQuestion.userTimeComplexity = userTimeComplexity;
    targetQuestion.userSpaceComplexity = userSpaceComplexity;
    targetQuestion.evaluationStatus = "completed";
    targetQuestion.evaluation = evaluation;

    session.timeSpentSeconds = (session.timeSpentSeconds || 0) + Number(timeSpentSeconds || 0);

    const isLastQuestion = qIndex >= session.questions.length - 1;

    if (isLastQuestion) {
      session.status = "completed";
      const totalScore = session.questions.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0);
      session.overallScore = Math.round(totalScore / session.questions.length);

      // Aggregate strengths & recommendations
      const allStrengths = session.questions.flatMap((q) => q.evaluation?.strengths || []);
      const allWeaknesses = session.questions.flatMap((q) => q.evaluation?.weaknesses || []);

      session.summaryReport = {
        strengths: allStrengths.slice(0, 4),
        improvements: allWeaknesses.slice(0, 4),
        recommendedTopics: [session.topic, "Algorithms & Complexity"],
      };
    } else {
      session.currentQuestionIndex = qIndex + 1;
    }

    session.markModified("questions");
    await session.save();

    res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      data: {
        isCompleted: session.status === "completed",
        overallScore: session.overallScore,
        questionIndex: qIndex,
        nextQuestionIndex: session.status === "completed" ? null : qIndex + 1,
        evaluation,
        nextQuestion: session.status === "completed" ? null : session.questions[qIndex + 1],
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   GET PROGRESSIVE HINT
========================================= */

export const getCsHintController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { sessionId, questionIndex = 0, hintLevel = 1 } = req.body;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, message: "Valid sessionId is required" });
      return;
    }

    const session = await CsSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
      res.status(404).json({ success: false, message: "Session not found" });
      return;
    }

    const targetQuestion = session.questions[Number(questionIndex)];
    if (!targetQuestion) {
      res.status(400).json({ success: false, message: "Question not found" });
      return;
    }

    const level = Math.max(1, Math.min(3, Number(hintLevel)));
    const hint = await generateCsHint(
      targetQuestion.questionText,
      targetQuestion.topic,
      level,
      targetQuestion.hints
    );

    res.status(200).json({
      success: true,
      data: {
        hintLevel: level,
        hint,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   GET USER SESSIONS (HISTORY)
========================================= */

export const getCsSessionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { limit = 20, page = 1, topic } = req.query;
    const filter: any = { user: userId };
    if (topic) {
      filter.topic = String(topic).toLowerCase();
    }

    const total = await CsSession.countDocuments(filter);
    const sessions = await CsSession.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select("-questions.hints");

    res.status(200).json({
      success: true,
      data: {
        total,
        page: Number(page),
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   GET SINGLE SESSION
========================================= */

export const getCsSessionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { id } = req.params;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid session ID" });
      return;
    }

    const session = await CsSession.findOne({ _id: id, user: userId });
    if (!session) {
      res.status(404).json({ success: false, message: "Session not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   GET CS ANALYTICS & SKILL MATRIX
========================================= */

export const getCsAnalyticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const completedSessions = await CsSession.find({
      user: userId,
      status: "completed",
    });

    const totalSessions = completedSessions.length;
    let totalScoreSum = 0;
    let totalQuestionsSolved = 0;

    const topicStats: Record<string, { count: number; totalScore: number; topicName: string }> = {};

    // Initialize with all standard topics
    CS_TOPICS.forEach((t) => {
      topicStats[t.id] = {
        count: 0,
        totalScore: 0,
        topicName: t.name,
      };
    });

    completedSessions.forEach((session) => {
      totalScoreSum += session.overallScore || 0;
      totalQuestionsSolved += session.questions.length;

      const topKey = session.topic.toLowerCase();
      if (!topicStats[topKey]) {
        topicStats[topKey] = {
          count: 0,
          totalScore: 0,
          topicName: session.topic,
        };
      }

      topicStats[topKey].count += 1;
      topicStats[topKey].totalScore += session.overallScore || 0;
    });

    const skillMatrix = Object.entries(topicStats).map(([topicId, stat]) => {
      const avg = stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0;
      return {
        topicId,
        topicName: stat.topicName,
        completedCount: stat.count,
        masteryScore: avg,
        status: avg >= 80 ? "Mastered" : avg >= 60 ? "Proficient" : avg > 0 ? "Developing" : "Not Started",
      };
    });

    const averageOverallScore = totalSessions > 0 ? Math.round(totalScoreSum / totalSessions) : 0;

    // Identify strongest and weakest topics
    const attemptedTopics = skillMatrix.filter((m) => m.completedCount > 0);
    attemptedTopics.sort((a, b) => b.masteryScore - a.masteryScore);

    const strongest = attemptedTopics[0] || null;
    const weakest = attemptedTopics.length > 1 ? attemptedTopics[attemptedTopics.length - 1] : null;

    res.status(200).json({
      success: true,
      data: {
        totalCompletedSessions: totalSessions,
        totalQuestionsSolved,
        averageOverallScore,
        strongestTopic: strongest,
        weakestTopic: weakest,
        skillMatrix,
        recommendedFocus: weakest
          ? `Focus on ${weakest.topicName} to strengthen your CS foundation.`
          : "Start with Data Structures & Algorithms challenges to build your mastery profile.",
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   GET AI PROVIDER STATUS
========================================= */

export const getAiStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = await getAiProviderStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

