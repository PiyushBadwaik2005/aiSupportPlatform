import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";
import { loginSchema, registerSchema } from "../validators";

const router = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), (req, res) =>
  authController.register(req, res)
);
router.post("/login", authRateLimiter, validateBody(loginSchema), (req, res) =>
  authController.login(req, res)
);
router.post("/logout", (req, res) => authController.logout(req, res));
router.get("/me", requireAuth, (req, res) => authController.me(req, res));

export default router;

