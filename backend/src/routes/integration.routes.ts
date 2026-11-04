import { Router } from "express";
import { integrationController } from "../controllers/integration.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireApiKey } from "../middleware/apiKey.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";
import { createApiKeySchema, chatQuestionSchema } from "../validators";

const router = Router();

// ==========================================
// Privileged Owner Management Endpoints
// ==========================================
router.post("/keys", requireAuth, validateBody(createApiKeySchema), (req, res) =>
  integrationController.createKey(req, res)
);
router.get("/keys", requireAuth, (req, res) => integrationController.listKeys(req, res));
router.delete("/keys/:id", requireAuth, (req, res) => integrationController.revokeKey(req, res));
router.post("/keys/:id/rotate", requireAuth, (req, res) => integrationController.rotateKey(req, res));
router.get("/usage", requireAuth, (req, res) => integrationController.getUsage(req, res));

// ==========================================
// External Integration Endpoints (API Key)
// ==========================================
router.post(
  "/chat",
  apiRateLimiter,
  requireApiKey,
  validateBody(chatQuestionSchema),
  (req, res) => integrationController.integrationChat(req, res)
);

router.post("/conversations", apiRateLimiter, requireApiKey, (req, res) =>
  integrationController.integrationCreateConversation(req, res)
);

router.get("/conversations/:id", apiRateLimiter, requireApiKey, (req, res) =>
  integrationController.integrationGetConversation(req, res)
);

export default router;

