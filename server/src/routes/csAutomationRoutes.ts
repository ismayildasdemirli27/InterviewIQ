import { Router } from "express";
import {
  getCsTopicsController,
  startCsSessionController,
  submitCsAnswerController,
  getCsHintController,
  getCsSessionsController,
  getCsSessionByIdController,
  getCsAnalyticsController,
  getAiStatusController,
} from "../controllers/csAutomationController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

/* =========================================
   PUBLIC / AUTH ROUTES
========================================= */

// Topics and AI Provider status can be viewed publicly or with auth
router.get("/topics", getCsTopicsController);
router.get("/ai-status", getAiStatusController);

// All operational routes require authentication
router.use(protect);

router.post("/start", startCsSessionController);
router.post("/submit-answer", submitCsAnswerController);
router.post("/hint", getCsHintController);
router.get("/sessions", getCsSessionsController);
router.get("/sessions/:id", getCsSessionByIdController);
router.get("/analytics", getCsAnalyticsController);

export default router;
