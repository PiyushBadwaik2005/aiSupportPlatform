import { Router } from "express";
import authRoutes from "./auth.routes";
import businessRoutes from "./business.routes";
import documentRoutes from "./document.routes";
import chatRoutes from "./chat.routes";
import conversationRoutes from "./conversation.routes";
import unansweredRoutes from "./unanswered-question.routes";
import integrationRoutes from "./integration.routes";
import analyticsRoutes from "./analytics.routes";

const router = Router();

// Health check endpoint
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "AI Customer Support Platform API",
    version: "1.0.0",
  });
});

// Mount versioned v1 routes
router.use("/v1/auth", authRoutes);
router.use("/v1/business", businessRoutes);
router.use("/v1/documents", documentRoutes);
router.use("/v1/chat", chatRoutes);
router.use("/v1/conversations", conversationRoutes);
router.use("/v1/unanswered-questions", unansweredRoutes);
router.use("/v1/integrations", integrationRoutes);
router.use("/v1/analytics", analyticsRoutes);

export default router;

