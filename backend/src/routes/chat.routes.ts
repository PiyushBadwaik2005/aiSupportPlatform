import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { standardRateLimiter } from "../middleware/rateLimiter.middleware";
import { chatQuestionSchema } from "../validators";

const router = Router();

// AI Playground chat for authenticated business owners
router.post(
  "/playground",
  requireAuth,
  validateBody(chatQuestionSchema),
  (req, res) => chatController.playgroundChat(req, res)
);

// Public customer widget chat
router.post(
  "/public",
  standardRateLimiter,
  validateBody(chatQuestionSchema),
  (req, res) => chatController.publicChat(req, res)
);

// Public widget config
router.get("/public/config/:slug", (req, res) =>
  chatController.getPublicWidgetConfig(req, res)
);

export default router;

