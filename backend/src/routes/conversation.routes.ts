import { Router } from "express";
import { conversationController } from "../controllers/conversation.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res) => conversationController.list(req, res));
router.get("/:id", (req, res) => conversationController.getById(req, res));
router.delete("/:id", (req, res) => conversationController.delete(req, res));

export default router;

