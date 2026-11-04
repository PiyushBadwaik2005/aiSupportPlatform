import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/overview", (req, res) => analyticsController.getOverview(req, res));

export default router;

