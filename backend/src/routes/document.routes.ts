import { Router } from "express";
import { documentController } from "../controllers/document.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { documentUpload } from "../middleware/upload.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", documentUpload.single("file"), (req, res) => documentController.upload(req, res));
router.get("/", (req, res) => documentController.list(req, res));
router.get("/:id", (req, res) => documentController.getById(req, res));
router.put("/:id/replace", documentUpload.single("file"), (req, res) =>
  documentController.replace(req, res)
);
router.post("/:id/retry", (req, res) => documentController.retry(req, res));
router.delete("/:id", (req, res) => documentController.delete(req, res));

export default router;

