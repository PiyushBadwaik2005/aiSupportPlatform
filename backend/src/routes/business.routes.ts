import { Router } from "express";
import { businessController } from "../controllers/business.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { updateBusinessSettingsSchema } from "../validators";

const router = Router();

router.use(requireAuth);

router.get("/settings", (req, res) => businessController.getSettings(req, res));
router.put("/settings", validateBody(updateBusinessSettingsSchema), (req, res) =>
  businessController.updateSettings(req, res)
);

export default router;

