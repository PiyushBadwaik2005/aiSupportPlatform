import { Router } from "express";
import { unansweredQuestionController } from "../controllers/unanswered-question.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { resolveUnansweredQuestionSchema } from "../validators";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res) => unansweredQuestionController.list(req, res));
router.put("/:id/resolve", validateBody(resolveUnansweredQuestionSchema), (req, res) =>
  unansweredQuestionController.resolve(req, res)
);

export default router;

